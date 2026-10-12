// Measures bytes written per one-counter update in the default writer and in incremental rendering.
// Run from the repository root after building the core package:
//   pnpm --filter @nemesis-oss/termina-core run build
//   node docs/research/measure-output-bytes.mjs
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {createRequire} from 'node:module';

// Resolve React from the core package so the reconciler and the renderer share one React instance.
const require = createRequire(new URL('../../packages/core/package.json', import.meta.url));
const React = require('react');
const core = await import(new URL('../../packages/core/build/index.js', import.meta.url).href);
const {Box, Text, render} = core;

// Fixed ANSI sequence instead of chalk, so the byte counts do not depend on the terminal this runs in.
const cyan = text => `\u{1B}[36m${text}\u{1B}[39m`;

const ROWS = 300;
const COLUMNS = 120;
const ROW_COUNT = 200;

const makeStdout = () => {
	const stream = new EventEmitter();
	Object.assign(stream, {isTTY: true, columns: COLUMNS, rows: ROWS, bytes: 0});
	stream.write = (data, callback) => {
		stream.bytes += Buffer.byteLength(data);
		callback?.();
		return true;
	};
	return stream;
};

const stdin = Object.assign(new PassThrough(), {
	isTTY: true,
	setRawMode() {},
	ref() {},
	unref() {},
});

const Dashboard = ({counter}) =>
	React.createElement(
		Box,
		{flexDirection: 'column'},
		...Array.from({length: ROW_COUNT}, (_, index) =>
			React.createElement(
				Text,
				{key: index},
				cyan(`row ${String(index).padStart(3, '0')}`) +
					'  ' +
					(index === 100 ? `counter=${counter}` : `static-value-${(index * 7919) % 100_000}`) +
					'  ' +
					'x'.repeat(60),
			),
		),
	);

for (const incrementalRendering of [false, true]) {
	const stdout = makeStdout();
	const instance = render(React.createElement(Dashboard, {counter: 0}), {
		stdout,
		stdin,
		stderr: stdout,
		interactive: true,
		patchConsole: false,
		incrementalRendering,
		exitOnCtrlC: false,
		maxFps: 1000,
	});
	await instance.waitUntilRenderFlush();

	const initialBytes = stdout.bytes;
	stdout.bytes = 0;
	const updateBytes = [];
	for (let tick = 1; tick <= 5; tick++) {
		instance.rerender(React.createElement(Dashboard, {counter: tick}));
		await instance.waitUntilRenderFlush();
		updateBytes.push(stdout.bytes);
		stdout.bytes = 0;
	}

	console.log(
		`incrementalRendering=${incrementalRendering}: initial frame=${initialBytes} bytes, one-counter updates=${updateBytes.join(', ')} bytes`,
	);
	instance.unmount();
}
