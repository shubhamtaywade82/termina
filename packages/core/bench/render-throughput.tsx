// Streams a fixed log scenario through the renderer and writes a JSON report: frames per second, bytes written and frame times.
// Usage: node --import=tsx bench/render-throughput.tsx [--out <file>]
//
// The run uses debug mode, which renders every update at once instead of waiting for the frame throttle. The numbers therefore measure the render pipeline, not the 30 frames per second cap. The first run is a warm-up and is not reported.

import {readFileSync, writeFileSync} from 'node:fs';
import {PassThrough, Writable} from 'node:stream';
import {performance} from 'node:perf_hooks';
import process from 'node:process';
import React from 'react';
import {Box, Text, render} from '../src/index.js';

const scenario = {
	lines: 1000,
	columns: 100,
	rows: 30,
	visibleRows: 24,
};

const packageVersion = (
	JSON.parse(
		readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
	) as {version: string}
).version;

function LogView({lines}: {readonly lines: readonly string[]}) {
	return (
		<Box flexDirection="column" height={scenario.visibleRows} overflow="hidden">
			{lines.slice(-scenario.visibleRows).map((line) => (
				<Text key={line}>{line}</Text>
			))}
		</Box>
	);
}

const logLines = Array.from(
	{length: scenario.lines},
	(_, index) =>
		`${String(index + 1).padStart(4, '0')} request accepted by worker ${index % 7} in ${index % 90} ms`,
);

const percentile = (sorted: readonly number[], p: number): number =>
	sorted[
		Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
	] ?? 0;

const round = (value: number): number => Math.round(value * 1000) / 1000;

const fakeTerminal = () => {
	const counts = {bytes: 0, writes: 0};
	const stdout = new Writable({
		write(chunk: Uint8Array, _encoding, callback) {
			counts.bytes += chunk.byteLength;
			counts.writes++;
			callback();
		},
	}) as unknown as NodeJS.WriteStream;
	stdout.isTTY = true;
	stdout.columns = scenario.columns;
	stdout.rows = scenario.rows;

	return {stdout, counts};
};

const runScenario = async () => {
	const {stdout, counts} = fakeTerminal();
	const stdin = new PassThrough() as unknown as NodeJS.ReadStream;
	stdin.isTTY = false;

	const instance = render(<LogView lines={[]} />, {
		stdout,
		stdin,
		debug: true,
		patchConsole: false,
		exitOnCtrlC: false,
	});

	const frameMs: number[] = [];
	const started = performance.now();

	for (let count = 1; count <= scenario.lines; count++) {
		const frameStart = performance.now();
		instance.rerender(<LogView lines={logLines.slice(0, count)} />);
		// eslint-disable-next-line no-await-in-loop -- Each frame must flush before the next one starts, so the frame times are real.
		await instance.waitUntilRenderFlush();
		frameMs.push(performance.now() - frameStart);
	}

	const elapsedSeconds = (performance.now() - started) / 1000;
	instance.unmount();
	instance.cleanup();

	const sorted = frameMs.toSorted((a, b) => a - b);
	const mean = frameMs.reduce((sum, value) => sum + value, 0) / frameMs.length;

	return {
		frames: scenario.lines,
		elapsedSeconds: round(elapsedSeconds),
		framesPerSecond: round(scenario.lines / elapsedSeconds),
		bytesWritten: counts.bytes,
		stdoutWrites: counts.writes,
		bytesPerFrame: round(counts.bytes / scenario.lines),
		frameMs: {
			mean: round(mean),
			p50: round(percentile(sorted, 50)),
			p95: round(percentile(sorted, 95)),
			max: round(sorted.at(-1) ?? 0),
		},
	};
};

const outputIndex = process.argv.indexOf('--out');
const outputPath =
	outputIndex === -1 ? 'render-benchmark.json' : process.argv[outputIndex + 1];

if (outputPath === undefined) {
	throw new Error(
		'Usage: node --import=tsx bench/render-throughput.tsx [--out <file>]',
	);
}

await runScenario();
const result = await runScenario();

const report = {
	generatedAt: new Date().toISOString(),
	termina: {core: packageVersion},
	environment: {
		node: process.version,
		platform: process.platform,
		arch: process.arch,
	},
	mode: 'debug (unthrottled)',
	scenario: {
		description: `${scenario.lines} log lines streamed one at a time into a ${scenario.columns}x${scenario.rows} terminal, showing the last ${scenario.visibleRows} rows`,
		...scenario,
	},
	result,
};

writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
	`${result.frames} frames in ${result.elapsedSeconds}s: ${result.framesPerSecond} fps, ${result.bytesWritten} bytes written, p95 frame ${result.frameMs.p95} ms. Report: ${outputPath}`,
);
