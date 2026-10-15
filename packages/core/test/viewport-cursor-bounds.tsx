import test, {type TestContext} from 'node:test';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import React from 'react';
import {Box, Text, render} from '../src/index.js';
import {largestUpwardTravel} from './helpers/cursor-travel.js';

// Cursor movement must stay inside the viewport. The cumulative upward travel of a write may not exceed the rows above the cursor, even when the emulator clamps it, because the emulator's behaviour is not part of Ink's contract.

const ROWS = 5;
const COLUMNS = 20;

const createCapturingTty = () => {
	const writes: string[] = [];
	const stdout = new EventEmitter() as EventEmitter & {
		isTTY: boolean;
		columns: number;
		rows: number;
		write: (data: string, callback?: () => void) => boolean;
	};
	stdout.isTTY = true;
	stdout.columns = COLUMNS;
	stdout.rows = ROWS;
	stdout.write = (data, callback) => {
		writes.push(data);
		callback?.();
		return true;
	};

	const stdin = new PassThrough() as PassThrough & {
		isTTY: boolean;
		setRawMode: (isRawMode: boolean) => void;
	};
	stdin.isTTY = true;
	stdin.setRawMode = () => {};

	return {stdout, stdin, output: () => writes.join('')};
};

const Frame = ({rows}: {readonly rows: string[]}) => (
	<Box flexDirection="column">
		{rows.map((row) => (
			<Text key={row}>{row}</Text>
		))}
	</Box>
);

for (const isIncremental of [false, true]) {
	test(`cursor-up counts never exceed the viewport while a frame taller than it shrinks (incrementalRendering=${isIncremental})`, async (t: TestContext) => {
		const tty = createCapturingTty();
		const instance = render(
			<Frame rows={Array.from({length: 20}, (_, index) => `old${index}`)} />,
			{
				stdout: tty.stdout as unknown as NodeJS.WriteStream,
				stdin: tty.stdin as unknown as NodeJS.ReadStream,
				stderr: tty.stdout as unknown as NodeJS.WriteStream,
				interactive: true,
				incrementalRendering: isIncremental,
				exitOnCtrlC: false,
				patchConsole: false,
			},
		);

		try {
			await new Promise((resolve) => {
				setTimeout(resolve, 50);
			});
			const beforeShrink = tty.output().length;
			instance.rerender(<Frame rows={['new0', 'new1', 'new2']} />);
			await new Promise((resolve) => {
				setTimeout(resolve, 50);
			});

			const travel = largestUpwardTravel(
				tty.output().slice(beforeShrink),
				ROWS - 1,
			);
			t.assert.ok(
				travel <= ROWS - 1,
				`shrink write moves the cursor ${travel} rows up; the viewport has ${ROWS - 1} rows above the bottom row`,
			);
		} finally {
			instance.unmount();
		}
	});
}
