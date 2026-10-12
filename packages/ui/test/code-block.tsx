import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import {render} from './helpers/render.js';
import {CodeBlock} from '../source/components/code-block/index.js';

const demoCode = `import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.json({ok: true});
});

app.listen(3000);`;

// Frames are written synchronously, so a frame can be read right after render().
const renderFrame = (
	node: React.ReactNode,
	options?: {readonly isStdinPiped?: boolean},
): string => {
	const instance = render(node, options);
	const frame = instance.lastFrame() ?? '';
	instance.unmount();
	return frame;
};

const stripAnsi = (text: string): string =>
	text.replaceAll(/\u001B\[[\d;]*m/g, '');

test('shows the language above numbered rows with a rule', (t: TestContext) => {
	const frame = renderFrame(
		<CodeBlock code={demoCode} language="typescript" highlightLines={[6]} />,
	);

	t.assert.strictEqual(
		stripAnsi(frame),
		[
			'typescript',
			"1 │ import express from 'express';",
			'2 │',
			'3 │ const app = express();',
			'4 │',
			"5 │ app.get('/health', (req, res) => {",
			'6 │   res.json({ok: true});',
			'7 │ });',
			'8 │',
			'9 │ app.listen(3000);',
		].join('\n'),
	);
});

test('right-aligns line numbers to the width of the largest one', (t: TestContext) => {
	const code = Array.from({length: 10}, (_, index) => `l${index + 1}`).join('\n');

	t.assert.strictEqual(
		stripAnsi(renderFrame(<CodeBlock code={code} />)),
		[
			' 1 │ l1',
			' 2 │ l2',
			' 3 │ l3',
			' 4 │ l4',
			' 5 │ l5',
			' 6 │ l6',
			' 7 │ l7',
			' 8 │ l8',
			' 9 │ l9',
			'10 │ l10',
		].join('\n'),
	);
});

test('draws a highlighted line with a bold number and a background', (t: TestContext) => {
	const frame = renderFrame(
		<CodeBlock code={'const a = 1;\nconst b = 2;'} highlightLines={[2]} />,
	);

	t.assert.strictEqual(
		frame,
		[
			`${chalk.dim('1')} ${chalk.dim('│')} const a = 1;`,
			`${chalk.bold('2')} ${chalk.dim('│')} ${chalk.bgGray('const b = 2;')}`,
		].join('\n'),
	);
});

test('dims the label and gutter and highlights nothing by default', (t: TestContext) => {
	const frame = renderFrame(<CodeBlock code={'a\nb'} language="ts" />);

	t.assert.strictEqual(
		frame,
		[
			chalk.dim('ts'),
			`${chalk.dim('1')} ${chalk.dim('│')} a`,
			`${chalk.dim('2')} ${chalk.dim('│')} b`,
		].join('\n'),
	);
});

test('ignores highlight numbers that match no line', (t: TestContext) => {
	const frame = renderFrame(<CodeBlock code={'a\nb'} highlightLines={[0, 9]} />);

	t.assert.strictEqual(
		frame,
		[
			`${chalk.dim('1')} ${chalk.dim('│')} a`,
			`${chalk.dim('2')} ${chalk.dim('│')} b`,
		].join('\n'),
	);
});

test('hides the gutter and rule when line numbers are off, and still highlights', (t: TestContext) => {
	const frame = renderFrame(
		<CodeBlock code={'a\nb'} showLineNumbers={false} highlightLines={[1]} />,
	);

	t.assert.strictEqual(frame, `${chalk.bgGray('a')}\nb`);
});

test('keeps a blank line as a row when line numbers are off', (t: TestContext) => {
	const frame = renderFrame(<CodeBlock code={'a\n\nb'} showLineNumbers={false} />);

	t.assert.strictEqual(stripAnsi(frame), 'a\n\nb');
});

test('shows empty code as one numbered row', (t: TestContext) => {
	t.assert.strictEqual(stripAnsi(renderFrame(<CodeBlock code="" />)), '1 │');
});

test('adds an empty last row for a trailing newline', (t: TestContext) => {
	t.assert.strictEqual(stripAnsi(renderFrame(<CodeBlock code={'a\n'} />)), '1 │ a\n2 │');
});

test('replaces each tab with two spaces', (t: TestContext) => {
	t.assert.strictEqual(stripAnsi(renderFrame(<CodeBlock code={'\tx'} />)), '1 │   x');
});

test('shows no label line when language is an empty string', (t: TestContext) => {
	t.assert.strictEqual(
		stripAnsi(renderFrame(<CodeBlock code="a" language="" />)),
		'1 │ a',
	);
});

test('wraps a long line inside the code column and numbers only its first row', (t: TestContext) => {
	const code = 'word '.repeat(40).trim();
	const rows = stripAnsi(renderFrame(<CodeBlock code={code} />)).split('\n');

	t.assert.ok(rows.length > 1);
	t.assert.ok(rows[0]?.startsWith('1 │ '));
	t.assert.ok(rows.slice(1).every(row => row.startsWith('  │ ')));
	t.assert.strictEqual(rows.map(row => row.slice(4)).join(' '), code);
});

test('renders every line, even when the block is taller than the terminal', (t: TestContext) => {
	const code = Array.from({length: 30}, (_, index) => `l${index + 1}`).join('\n');
	const rows = stripAnsi(renderFrame(<CodeBlock code={code} />)).split('\n');

	t.assert.strictEqual(rows.length, 30);
	t.assert.strictEqual(rows.at(-1), '30 │ l30');
});

test('ignores keyboard input', async (t: TestContext) => {
	const instance = render(<CodeBlock code={'a\nb'} language="ts" />);
	const frameBefore = instance.lastFrame();

	instance.stdin.write('j');
	instance.stdin.write('\u001B[B');
	await delay(20);
	const frameAfter = instance.lastFrame();
	instance.unmount();

	t.assert.strictEqual(frameAfter, frameBefore);
});

test('renders when stdin is piped', (t: TestContext) => {
	const frame = renderFrame(<CodeBlock code="a" />, {isStdinPiped: true});

	t.assert.strictEqual(stripAnsi(frame), '1 │ a');
});
