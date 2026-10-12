import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Box, Text} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import {KeyHint} from '../source/components/key-hint/index.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';

const shortcuts = [
	{keys: '↑↓', label: 'navigate'},
	{keys: 'Space', label: 'toggle'},
	{keys: 'Enter', label: 'restart'},
	{keys: 'Esc', label: 'cancel'},
];

test('renders the key label in inverse text, a space, then the label in dim text', (t: TestContext) => {
	const {lastFrame} = render(<KeyHint keys="Ctrl+C" label="quit" />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.inverse(' Ctrl+C ')} ${chalk.dim('quit')}`,
	);
});

test('shows keys exactly as given, without changing case', (t: TestContext) => {
	const {lastFrame} = render(<KeyHint keys="ctrl+c" label="quit" />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.inverse(' ctrl+c ')} ${chalk.dim('quit')}`,
	);
});

test('an empty label renders the key block alone', (t: TestContext) => {
	const {lastFrame} = render(<KeyHint keys="Esc" label="" />);

	t.assert.strictEqual(lastFrame(), chalk.inverse(' Esc '));
});

test('an empty label keeps the space before a following sibling', (t: TestContext) => {
	const {lastFrame} = render(
		<Box>
			<KeyHint keys="Esc" label="" />
			<Text>X</Text>
		</Box>,
	);

	t.assert.strictEqual(lastFrame(), `${chalk.inverse(' Esc ')} X`);
});

test('an empty key renders a two-space inverse block before the label', (t: TestContext) => {
	const {lastFrame} = render(<KeyHint keys="" label="cancel" />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.inverse('  ')} ${chalk.dim('cancel')}`,
	);
});

test('changing keys or label after mount updates the row', async (t: TestContext) => {
	const {lastFrame, rerender} = render(<KeyHint keys="Esc" label="cancel" />);

	rerender(<KeyHint keys="Enter" label="confirm" />);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.inverse(' Enter ')} ${chalk.dim('confirm')}`,
	);
});

test('renders under piped stdin and ignores key presses', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<KeyHint keys="q" label="quit" />, {
		isStdinPiped: true,
	});

	stdin.write('q');
	await delay(20);

	t.assert.strictEqual(lastFrame(), `${chalk.inverse(' q ')} ${chalk.dim('quit')}`);
});

test('renders the demo layout as a list above a row of hints', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column" gap={1}>
			<Box flexDirection="column">
				<Text bold>Restart services</Text>
				<Text>› [x] api</Text>
				<Text>  [ ] worker</Text>
				<Text>  [x] web</Text>
			</Box>
			<Box gap={2}>
				{shortcuts.map(shortcut => (
					<KeyHint
						key={shortcut.keys}
						keys={shortcut.keys}
						label={shortcut.label}
					/>
				))}
			</Box>
		</Box>,
	);
	const hintRow = shortcuts
		.map(({keys, label}) => `${chalk.inverse(` ${keys} `)} ${chalk.dim(label)}`)
		.join('  ');

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.bold('Restart services'),
			'› [x] api',
			'  [ ] worker',
			'  [x] web',
			'',
			hintRow,
		].join('\n'),
	);
});

test('reads the key style from the KeyHint entry of a theme override', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {
			KeyHint: {
				styles: {
					key: () => ({bold: true}),
				},
			},
		},
	});
	const {lastFrame} = render(
		<ThemeProvider theme={theme}>
			<KeyHint keys="Ctrl+C" label="quit" />
		</ThemeProvider>,
	);

	t.assert.strictEqual(lastFrame(), `${chalk.bold(' Ctrl+C ')} ${chalk.dim('quit')}`);
});

test('wraps a label that does not fit beside the key block, and drops the gap', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={16}>
			<KeyHint keys="Ctrl+C" label="quit the application now" />
		</Box>,
	);

	t.assert.strictEqual(
		stripAnsi(lastFrame() ?? ''),
		'      quit the a\nCtrl+Cpplication\n       now',
	);
});
