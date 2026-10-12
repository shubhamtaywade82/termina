import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import figures from 'figures';
import {Box} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import {Markdown} from '../source/components/markdown/index.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';

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

test('nested list items indent two spaces per level, and the indent takes the bullet style', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'- a\n  - b\n    - c'}</Markdown>);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.dim(`${figures.bullet} `)}a`,
			`${chalk.dim(`  ${figures.bullet} `)}b`,
			`${chalk.dim(`    ${figures.bullet} `)}c`,
		].join('\n'),
	);
});

test('three spaces of indentation count as one nested level', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'- a\n   - b'}</Markdown>);

	t.assert.strictEqual(
		stripAnsi(lastFrame()),
		[`${figures.bullet} a`, `  ${figures.bullet} b`].join('\n'),
	);
});

test('an indented line under a list item starts a paragraph and splits the list', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'- first item\n  continues here\n- second'}</Markdown>);

	t.assert.strictEqual(
		stripAnsi(lastFrame()),
		[`${figures.bullet} first item`, '', '  continues here', '', `${figures.bullet} second`].join('\n'),
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

test('takes no keyboard input, so it renders with piped stdin and ignores keys', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<Markdown>{'- one'}</Markdown>, {
		isStdinPiped: true,
	});

	await delay(20);
	stdin.write('\u001B[B');
	await delay(20);

	t.assert.strictEqual(stripAnsi(lastFrame()), `${figures.bullet} one`);
});

test('a new source replaces the output on rerender', (t: TestContext) => {
	const {lastFrame, rerender} = render(<Markdown>{'first'}</Markdown>);

	rerender(<Markdown>{'second'}</Markdown>);

	t.assert.strictEqual(lastFrame(), 'second');
});

test('a long source is not clipped to the terminal height', (t: TestContext) => {
	const source = Array.from({length: 40}, (_, index) => `line ${index + 1}`).join('\n\n');
	const {lastFrame} = render(<Markdown>{source}</Markdown>);

	t.assert.strictEqual(lastFrame()?.split('\n').at(-1), 'line 40');
});

test('a theme paragraph color applies to paragraphs, list items and block quotes', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {
			Markdown: {
				styles: {
					paragraph: () => ({color: 'red'}),
				},
			},
		},
	});
	const {lastFrame} = render(
		<ThemeProvider theme={theme}>
			<Markdown>{'plain\n\n- item\n\n> quote'}</Markdown>
		</ThemeProvider>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.red('plain'),
			'',
			`${chalk.dim(`${figures.bullet} `)}${chalk.red('item')}`,
			'',
			`${chalk.dim('│')} ${chalk.red(chalk.dim('quote'))}`,
		].join('\n'),
	);
});

test('bold and link text do not nest other spans', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'**Run `x`** and [**a**](u)'}</Markdown>);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.bold('Run `x`')} and ${chalk.underline(chalk.blue('**a**'))}${chalk.dim(' (u)')}`,
	);
});

test('a link URL in a heading is dim and not bold, so the text after it stays bold', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{'## See [docs](u) now'}</Markdown>);

	t.assert.strictEqual(
		lastFrame(),
		'\u001B[1m\u001B[36mSee \u001B[4m\u001B[34mdocs\u001B[24m\u001B[22m\u001B[36m\u001B[2m (u)\u001B[22m\u001B[1m now\u001B[22m\u001B[39m',
	);
});

test('an empty source renders nothing', (t: TestContext) => {
	const {lastFrame} = render(<Markdown>{''}</Markdown>);

	t.assert.strictEqual(lastFrame(), '');
});
