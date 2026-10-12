import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import figures from 'figures';
import {Box} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import {Markdown} from '../source/components/markdown/index.js';

const stripAnsi = (text: string | undefined): string =>
	(text ?? '').replace(/\u001B\[[0-9;]*m/g, '');

test('headings use one style per level and drop the hash marks', (t: TestContext) => {
	const {lastFrame} = render(
		<Markdown>{'# Title\n\n## Section\n\n### Subsection'}</Markdown>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.underline(chalk.bold(chalk.cyan('Title'))),
			'',
			chalk.bold(chalk.cyan('Section')),
			'',
			chalk.bold('Subsection'),
		].join('\n'),
	);
});

test('headings deeper than three levels and hashtags print as plain text', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'#### Deep\n#tag'}</Markdown>);

	t.assert.strictEqual(lastFrame(), '#### Deep\n#tag');
});

test('line breaks inside a paragraph are kept', (t: TestContext) => {
	const {lastFrame} = render(
		<Markdown>{'first line\nsecond line\n\nthird'}</Markdown>,
	);

	t.assert.strictEqual(lastFrame(), 'first line\nsecond line\n\nthird');
});

test('consecutive blank lines collapse into one blank row between blocks', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'alpha\n\n\n\nbeta'}</Markdown>);

	t.assert.strictEqual(lastFrame(), 'alpha\n\nbeta');
});

test('paragraphs wrap to the width of their container', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={12}>
			<Markdown>{'alpha beta gamma'}</Markdown>
		</Box>,
	);

	t.assert.strictEqual(lastFrame(), 'alpha beta\ngamma');
});

test('list items use a bullet for - and * markers', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'- one\n* two'}</Markdown>);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.dim(`${figures.bullet} `)}one`,
			`${chalk.dim(`${figures.bullet} `)}two`,
		].join('\n'),
	);
});

test('ordered list items print their numbers as written', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'3. three\n7. seven'}</Markdown>);

	t.assert.strictEqual(
		lastFrame(),
		[`${chalk.dim('3. ')}three`, `${chalk.dim('7. ')}seven`].join('\n'),
	);
});

test('nested list items indent two spaces per level', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'- a\n  - b\n    - c'}</Markdown>);

	t.assert.strictEqual(
		stripAnsi(lastFrame()),
		[`${figures.bullet} a`, `  ${figures.bullet} b`, `    ${figures.bullet} c`].join('\n'),
	);
});

test('three spaces of indentation count as one nested level', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'- a\n   - b'}</Markdown>);

	t.assert.strictEqual(
		stripAnsi(lastFrame()),
		[`${figures.bullet} a`, `  ${figures.bullet} b`].join('\n'),
	);
});

test('a line that starts with ** is not a list item', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'**Note:** read this'}</Markdown>);

	t.assert.strictEqual(lastFrame(), `${chalk.bold('Note:')} read this`);
});

test('fenced code is indented, keeps its spacing, and ignores the language', (t: TestContext) => {
	const {lastFrame} = render(
		<Markdown>{'```bash\nconst a = 1;\n  indented();\n\nend\n```'}</Markdown>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`  ${chalk.yellow('const a = 1;')}`,
			`  ${chalk.yellow('  indented();')}`,
			'',
			`  ${chalk.yellow('end')}`,
		].join('\n'),
	);
});

test('an unclosed fence runs to the end of the source', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'```\nline one\nline two'}</Markdown>);

	t.assert.strictEqual(stripAnsi(lastFrame()), '  line one\n  line two');
});

test('block quotes draw a bar and dim their text', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'> quoted\n> second'}</Markdown>);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.dim('│')} ${chalk.dim('quoted')}`,
			`${chalk.dim('│')} ${chalk.dim('second')}`,
		].join('\n'),
	);
});

test('bold text in a block quote is not dimmed, and the text after it stays dimmed', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'> **Note** after'}</Markdown>);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.dim('│')} ${chalk.bold('Note')}${chalk.dim(' after')}`,
	);
});

test('the bar is drawn on every wrapped line of a block quote', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={12}>
			<Markdown>{'> alpha beta gamma'}</Markdown>
		</Box>,
	);
	const lines = stripAnsi(lastFrame()).split('\n');

	t.assert.strictEqual(lines.length, 2);
	t.assert.ok(lines.every(line => line.startsWith('│')));
});

test('bold, italic, underscore italic and inline code are styled', (t: TestContext) => {
	const {lastFrame} = render(
		<Markdown>{'**bold** *italic* _under_ `code`'}</Markdown>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.bold('bold'),
			chalk.italic('italic'),
			chalk.italic('under'),
			chalk.yellow('code'),
		].join(' '),
	);
});

test('links show the link text followed by the dimmed URL', (t: TestContext) => {
	const {lastFrame} = render(
		<Markdown>{'[docs](https://x.dev/a_b_c)'}</Markdown>,
	);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.underline(chalk.blue('docs'))}${chalk.dim(' (https://x.dev/a_b_c)')}`,
	);
});

test('images, tables and HTML print as their source text', (t: TestContext) => {
	const {lastFrame} = render(
		<Markdown>
			{'![logo](logo.png)\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n<div>hi</div>'}
		</Markdown>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			'![logo](logo.png)',
			'',
			'| a | b |\n| - | - |\n| 1 | 2 |',
			'',
			'<div>hi</div>',
		].join('\n'),
	);
});

test('inline markers still apply inside table rows', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'| **a** | b |\n| - | - |'}</Markdown>);

	t.assert.strictEqual(lastFrame(), `| ${chalk.bold('a')} | b |\n| - | - |`);
});

test('emphasis markers that do not close, or touch whitespace, stay literal', (t: TestContext) => {
	const {lastFrame} = render(
		<Markdown>{'snake_case_name and 2 * 3 * 4 and **open'}</Markdown>,
	);

	t.assert.strictEqual(lastFrame(), 'snake_case_name and 2 * 3 * 4 and **open');
});

test('a README excerpt renders each block in order', (t: TestContext) => {
	const readme = [
		'# termina-ui',
		'',
		'Components for **terminal** apps, built on `termina-core`.',
		'',
		'## Install',
		'',
		'- Add the package to your app',
		'- Import components from `@nemesis-oss/termina-ui`',
		'',
		'1. Render a `Box` layout',
		'2. Add a `Markdown` view',
		'',
		'> Markdown is display only. It takes no keyboard input.',
		'',
		'```tsx',
		'render(<App />);',
		'```',
	].join('\n');
	const {lastFrame} = render(<Markdown>{readme}</Markdown>);

	t.assert.strictEqual(
		stripAnsi(lastFrame()),
		[
			'termina-ui',
			'',
			'Components for terminal apps, built on termina-core.',
			'',
			'Install',
			'',
			`${figures.bullet} Add the package to your app`,
			`${figures.bullet} Import components from @nemesis-oss/termina-ui`,
			'',
			'1. Render a Box layout',
			'2. Add a Markdown view',
			'',
			'│ Markdown is display only. It takes no keyboard input.',
			'',
			'  render(<App />);',
		].join('\n'),
	);
});

test('an empty source renders nothing', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{''}</Markdown>);

	t.assert.strictEqual(lastFrame(), '');
});
