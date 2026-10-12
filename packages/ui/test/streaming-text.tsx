import React from 'react';
import test, {type TestContext} from 'node:test';
import {Box, Text} from '@nemesis-oss/termina-core';
import chalk from 'chalk';
import delay from 'delay';
import {render} from './helpers/render.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';
import {StreamingText} from '../source/components/streaming-text/index.js';

const cursor = chalk.blue('▋');

const answer =
	'Staging is green. Three services were rolled to build 4821, and all of them passed their health checks. Production is next and waits for approval from the on-call engineer.';

test('shows a cursor after the text by default', (t: TestContext) => {
	const {lastFrame} = render(<StreamingText text="Hello" />);

	t.assert.strictEqual(lastFrame(), `Hello${cursor}`);
});

test('hides the cursor when isStreaming is false', (t: TestContext) => {
	const {lastFrame} = render(<StreamingText text="Hello" isStreaming={false} />);

	t.assert.strictEqual(lastFrame(), 'Hello');
});

test('removes the cursor when isStreaming changes to false', (t: TestContext) => {
	const {lastFrame, rerender} = render(<StreamingText text="Hello" />);

	t.assert.strictEqual(lastFrame(), `Hello${cursor}`);

	rerender(<StreamingText text="Hello" isStreaming={false} />);

	t.assert.strictEqual(lastFrame(), 'Hello');
});

test('shows only the cursor when text is empty and streaming', (t: TestContext) => {
	const {lastFrame} = render(<StreamingText text="" />);

	t.assert.strictEqual(lastFrame(), cursor);
});

test('renders no output when text is empty and streaming has ended', (t: TestContext) => {
	const {lastFrame} = render(<StreamingText text="" isStreaming={false} />);

	t.assert.strictEqual(lastFrame(), '');
});

test('wraps text to the width of its parent, with the cursor on the last line', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={10}>
			<StreamingText text="one two three" />
		</Box>,
	);

	t.assert.strictEqual(lastFrame(), `one two\nthree${cursor}`);
});

test('a full last line moves the cursor to a new line', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={10}>
			<StreamingText text="abcdefghij" />
		</Box>,
	);

	t.assert.strictEqual(lastFrame(), `abcdefghij\n${cursor}`);
});

test('a shorter text replaces the earlier output', (t: TestContext) => {
	const {lastFrame, rerender} = render(
		<StreamingText text="Hello world" isStreaming={false} />,
	);

	rerender(<StreamingText text="Hi" isStreaming={false} />);

	t.assert.strictEqual(lastFrame(), 'Hi');
});

test('a line break in the text starts a new line', (t: TestContext) => {
	const {lastFrame} = render(<StreamingText text={'first\nsecond'} />);

	t.assert.strictEqual(lastFrame(), `first\nsecond${cursor}`);
});

test('a line break at the end of the text puts the cursor on an empty line', (t: TestContext) => {
	const {lastFrame} = render(<StreamingText text={'abc\n'} />);

	t.assert.strictEqual(lastFrame(), `abc\n${cursor}`);
});

test('redraws nothing while idle, so the cursor does not blink', async (t: TestContext) => {
	const {frames, unmount} = render(<StreamingText text="Hello" />);

	await delay(50);
	const framesAfterMount = frames.length;
	await delay(1000);
	unmount();

	t.assert.strictEqual(frames.length, framesAfterMount);
});

test('a style key replaced through ThemeProvider changes the output', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {
			StreamingText: {
				styles: {
					cursor: () => ({color: 'green'}),
				},
			},
		},
	});
	const {lastFrame} = render(
		<ThemeProvider theme={theme}>
			<StreamingText text="Hello" />
		</ThemeProvider>,
	);

	t.assert.strictEqual(lastFrame(), `Hello${chalk.green('▋')}`);
});

test('renders the demo content in 80 columns', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={80} flexDirection="column" gap={1}>
			<Text bold>Assistant</Text>
			<StreamingText text={answer} isStreaming={false} />
			<Text color="green">done</Text>
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.bold('Assistant'),
			'',
			'Staging is green. Three services were rolled to build 4821, and all of them',
			'passed their health checks. Production is next and waits for approval from the',
			'on-call engineer.',
			'',
			chalk.green('done'),
		].join('\n'),
	);
});
