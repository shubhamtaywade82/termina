import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import {Box, Text} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import {DiffView} from '../source/components/diff-view/index.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';

const demoPatch = [
	'diff --git a/src/server.ts b/src/server.ts',
	'index 3b18e51..a9c4f0e 100644',
	'--- a/src/server.ts',
	'+++ b/src/server.ts',
	'@@ -1,5 +1,6 @@',
	" import express from 'express';",
	'-const PORT = 3000;',
	'+const PORT = process.env.PORT ?? 3000;',
	"+const HOST = '0.0.0.0';",
	' ',
	' const app = express();',
	' app.listen(PORT);',
].join('\n');

test('renders each line in the style of its first characters', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column">
			<Text>Review the change to src/server.ts</Text>
			<DiffView patch={demoPatch} />
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			'Review the change to src/server.ts',
			chalk.bold('diff --git a/src/server.ts b/src/server.ts'),
			chalk.bold('index 3b18e51..a9c4f0e 100644'),
			chalk.bold('--- a/src/server.ts'),
			chalk.bold('+++ b/src/server.ts'),
			chalk.cyan('@@ -1,5 +1,6 @@'),
			" import express from 'express';",
			chalk.red('-const PORT = 3000;'),
			chalk.green('+const PORT = process.env.PORT ?? 3000;'),
			chalk.green("+const HOST = '0.0.0.0';"),
			'',
			' const app = express();',
			' app.listen(PORT);',
		].join('\n'),
	);
});

test('renders nothing for an empty patch', (t: TestContext) => {
	const {lastFrame} = render(<DiffView patch="" />);

	t.assert.strictEqual(lastFrame(), '');
});

test('a trailing newline does not add a row after the last line', (t: TestContext) => {
	const {lastFrame} = render(<DiffView patch={'+a\n-b\n'} />);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.green('+a'), chalk.red('-b')].join('\n'),
	);
});

test('a blank line at the end of the patch keeps its row', (t: TestContext) => {
	const {lastFrame} = render(<DiffView patch={'+a\n\n'} />);

	t.assert.strictEqual(lastFrame(), `${chalk.green('+a')}\n`);
});

test('a blank line between lines keeps its row', (t: TestContext) => {
	const {lastFrame} = render(<DiffView patch={'+a\n\n+b'} />);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.green('+a'), '', chalk.green('+b')].join('\n'),
	);
});

test('a removed or added line whose text begins with -- or ++ is styled as a file header', (t: TestContext) => {
	const {lastFrame} = render(<DiffView patch={'--- old comment\n+++ new text'} />);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.bold('--- old comment'), chalk.bold('+++ new text')].join('\n'),
	);
});

test('the no-newline marker is styled as context', (t: TestContext) => {
	const {lastFrame} = render(
		<DiffView patch={'+a\n\\ No newline at end of file'} />,
	);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.green('+a'), '\\ No newline at end of file'].join('\n'),
	);
});

test('a line that begins with an ANSI color code is treated as context', (t: TestContext) => {
	const coloredPatch = [chalk.green('+added'), chalk.red('-removed')].join('\n');
	const {lastFrame} = render(<DiffView patch={coloredPatch} />);

	t.assert.strictEqual(lastFrame(), coloredPatch);
});

test('a line wider than the terminal wraps onto the next row', (t: TestContext) => {
	const {lastFrame} = render(<DiffView patch={`+${'x'.repeat(119)}END`} />);

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.green(`+${'x'.repeat(99)}`),
			chalk.green(`${'x'.repeat(20)}END`),
		].join('\n'),
	);
});

test('a line wider than its container wraps at the container width', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={20}>
			<DiffView patch={`+${'y'.repeat(30)}`} />
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.green(`+${'y'.repeat(19)}`), chalk.green('y'.repeat(11))].join('\n'),
	);
});

test('changing the patch re-renders the lines', (t: TestContext) => {
	const {lastFrame, rerender} = render(<DiffView patch="+old" />);

	rerender(<DiffView patch={'-new\n+newer'} />);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.red('-new'), chalk.green('+newer')].join('\n'),
	);
});

test('a style key replaced through ThemeProvider changes the output', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {
			DiffView: {
				styles: {
					added: () => ({color: 'blue'}),
				},
			},
		},
	});
	const {lastFrame} = render(
		<ThemeProvider theme={theme}>
			<DiffView patch="+new" />
		</ThemeProvider>,
	);

	t.assert.strictEqual(lastFrame(), chalk.blue('+new'));
});

test('tabs expand to spaces up to the next 8-column stop', (t: TestContext) => {
	const {lastFrame} = render(<DiffView patch={'+\tindented'} />);

	t.assert.strictEqual(lastFrame(), chalk.green(`+${' '.repeat(7)}indented`));
});

test('renders under piped stdin, since it reads no input', (t: TestContext) => {
	const {lastFrame} = render(<DiffView patch="+a" />, {isStdinPiped: true});

	t.assert.strictEqual(lastFrame(), chalk.green('+a'));
});
