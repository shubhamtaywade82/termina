import test, {type TestContext} from 'node:test';
import React from 'react';
import stripAnsi from 'strip-ansi';
import stringWidth from 'string-width';
import {Box, Text} from '../src/index.js';
import {renderToString} from './helpers/render-to-string.js';

// Wrapped text in a box that shares its row with a sibling. The box has no flexBasis, so Yoga shrinks it by a fractional share, and the text used to come out one column wider than the box.
const LONG =
	'The quick brown fox jumps over the lazy dog and keeps going far past any narrow terminal';

const widest = (output: string): number =>
	Math.max(
		...stripAnsi(output)
			.split('\n')
			.map((line) => stringWidth(line)),
	);

test('a box with wrapped text beside a marker stays inside a 16-column row without flexBasis', (t: TestContext) => {
	const output = renderToString(
		<Box>
			<Text>- </Text>
			<Box>
				<Text>{LONG}</Text>
			</Box>
		</Box>,
		{columns: 16},
	);

	t.assert.ok(
		widest(output) <= 16,
		`widest line is ${widest(output)} columns:\n${output}`,
	);
});

test('a column box with wrapped text beside a marker stays inside a 16-column row', (t: TestContext) => {
	const output = renderToString(
		<Box>
			<Text>- </Text>
			<Box flexDirection="column">
				<Text>{LONG}</Text>
			</Box>
		</Box>,
		{columns: 16},
	);

	t.assert.ok(
		widest(output) <= 16,
		`widest line is ${widest(output)} columns:\n${output}`,
	);
	t.assert.strictEqual(
		stripAnsi(output),
		// The box is 14 columns: the marker takes 2 of the 16.
		[
			'- The quick',
			'  brown fox',
			'  jumps over the',
			'  lazy dog and',
			'  keeps going',
			'  far past any',
			'  narrow',
			'  terminal',
		].join('\n'),
	);
});

test('a row with a gap keeps wrapped text inside the columns left after the gap', (t: TestContext) => {
	const output = renderToString(
		<Box gap={1}>
			<Text>- </Text>
			<Box flexDirection="column">
				<Text>{LONG}</Text>
			</Box>
		</Box>,
		{columns: 16},
	);

	t.assert.ok(
		widest(output) <= 16,
		`widest line is ${widest(output)} columns:\n${output}`,
	);
});

test('the wrapped text fits the box at every width tested, not only at the one that rounds up', (t: TestContext) => {
	for (const columns of [16, 20, 24, 28, 33, 40]) {
		const output = renderToString(
			<Box>
				<Text>- </Text>
				<Box flexDirection="column">
					<Text>{LONG}</Text>
				</Box>
			</Box>,
			{columns},
		);

		t.assert.ok(
			widest(output) <= columns,
			`${columns} columns: widest line is ${widest(output)}`,
		);
	}
});
