import test, {type TestContext} from 'node:test';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import React, {useEffect} from 'react';
import {Box, Text, render, useCursor} from '../src/index.js';
import {largestUpwardTravel} from './helpers/cursor-travel.js';

// A cursor placed on a row of a frame taller than the viewport must not require moving the cursor above the viewport. The write that positions the cursor is measured from the bottom row, where a tall frame leaves the cursor.

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

function Frame({
	rows,
	cursorRow,
}: {
	readonly rows: string[];
	readonly cursorRow?: number;
}) {
	const {setCursorPosition} = useCursor();
	useEffect(() => {
		if (cursorRow !== undefined) {
			setCursorPosition({x: 0, y: cursorRow});
		}
	}, [cursorRow, setCursorPosition]);

	return (
		<Box flexDirection="column">
			{rows.map((row) => (
				<Text key={row}>{row}</Text>
			))}
		</Box>
	);
}

for (const isIncremental of [false, true]) {
	test(`a cursor on the top row of a frame taller than the viewport stays inside the viewport (incrementalRendering=${isIncremental})`, async (t: TestContext) => {
		const tty = createCapturingTty();
		const rows = Array.from({length: 20}, (_, index) => `row${index}`);
		const instance = render(<Frame rows={rows} />, {
			stdout: tty.stdout as unknown as NodeJS.WriteStream,
			stdin: tty.stdin as unknown as NodeJS.ReadStream,
			stderr: tty.stdout as unknown as NodeJS.WriteStream,
			interactive: true,
			incrementalRendering: isIncremental,
			exitOnCtrlC: false,
			patchConsole: false,
		});

		try {
			await new Promise((resolve) => {
				setTimeout(resolve, 50);
			});
			const beforeCursor = tty.output().length;
			instance.rerender(<Frame rows={rows} cursorRow={0} />);
			await new Promise((resolve) => {
				setTimeout(resolve, 50);
			});

			const travel = largestUpwardTravel(
				tty.output().slice(beforeCursor),
				ROWS - 1,
			);
			t.assert.ok(
				travel <= ROWS - 1,
				`cursor placement moves the cursor ${travel} rows up; the viewport has ${ROWS - 1} rows above the bottom row`,
			);
		} finally {
			instance.unmount();
		}
	});
}
