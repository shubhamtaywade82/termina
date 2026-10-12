import React from 'react';
import test, {type TestContext} from 'node:test';
import stripAnsi from 'strip-ansi';
import {
	Box,
	Text,
	clipboardSequence,
	copyToClipboard,
	detectTerminalCapabilities,
	hyperlink,
	render,
	renderToString,
} from '../src/index.js';
import createStdout from './helpers/create-stdout.js';

const esc = '\u{1B}';

test('hyperlink wraps the label in an OSC 8 sequence terminated by ST', (t: TestContext) => {
	t.assert.strictEqual(
		hyperlink('https://example.com/a', 'docs'),
		`${esc}]8;;https://example.com/a${esc}\\docs${esc}]8;;${esc}\\`,
	);
});

test('hyperlink rejects URLs that could terminate the OSC early', (t: TestContext) => {
	t.assert.throws(() => hyperlink('', 'x'), RangeError);
	t.assert.throws(() => hyperlink(`https://a.test${esc}[2J`, 'x'), RangeError);
	t.assert.throws(() => hyperlink('https://a.test\u{7}', 'x'), RangeError);
});

test('a hyperlink lays out at the width of its label, not its escape bytes', (t: TestContext) => {
	const output = renderToString(
		<Box width={6}>
			<Text>{hyperlink('https://example.com', 'docs')}</Text>
		</Box>,
	);
	t.assert.strictEqual(stripAnsi(output), 'docs');
});

test('clipboardSequence encodes UTF-8 text as OSC 52 base64 with a BEL terminator', (t: TestContext) => {
	t.assert.strictEqual(clipboardSequence('hi'), `${esc}]52;c;aGk=\u{7}`);
	t.assert.strictEqual(
		clipboardSequence('é'),
		`${esc}]52;c;w6k=\u{7}`,
	);
});

test('clipboardSequence refuses payloads the terminal would truncate', (t: TestContext) => {
	t.assert.throws(() => clipboardSequence('x'.repeat(60_000)), RangeError);
});

test('copyToClipboard writes only to a TTY', (t: TestContext) => {
	const written: string[] = [];
	const tty = {isTTY: true, write: (data: string) => written.push(data)};
	const pipe = {isTTY: false, write: (data: string) => written.push(data)};

	t.assert.strictEqual(copyToClipboard('hi', tty), true);
	t.assert.strictEqual(copyToClipboard('hi', pipe), false);
	t.assert.deepStrictEqual(written, [clipboardSequence('hi')]);
});

type Case = {
	readonly name: string;
	readonly environment: Record<string, string>;
	readonly isTty: boolean;
	readonly expected: Partial<ReturnType<typeof detectTerminalCapabilities>>;
};

const cases: Case[] = [
	{
		name: 'modern truecolor terminal',
		environment: {TERM: 'xterm-256color', COLORTERM: 'truecolor'},
		isTty: true,
		expected: {interactive: true, colorLevel: 'truecolor', synchronizedOutput: true, hyperlinks: true},
	},
	{
		name: '256-color terminal without COLORTERM',
		environment: {TERM: 'xterm-256color'},
		isTty: true,
		expected: {interactive: true, colorLevel: 'ansi256'},
	},
	{
		name: 'Linux console has no synchronized output or hyperlinks',
		environment: {TERM: 'linux'},
		isTty: true,
		expected: {interactive: true, colorLevel: 'ansi16', synchronizedOutput: false, hyperlinks: false},
	},
	{
		name: 'dumb terminal is never interactive and has no color',
		environment: {TERM: 'dumb'},
		isTty: true,
		expected: {interactive: false, colorLevel: 'none', hyperlinks: false},
	},
	{
		name: 'piped output is never interactive',
		environment: {TERM: 'xterm-256color', COLORTERM: 'truecolor'},
		isTty: false,
		expected: {interactive: false, colorLevel: 'none', alternateScreen: false, hyperlinks: false},
	},
	{
		name: 'CI disables interactive rendering even on a TTY',
		environment: {TERM: 'xterm-256color', CI: 'true'},
		isTty: true,
		expected: {interactive: false, alternateScreen: false, mouse: false},
	},
	{
		name: 'NO_COLOR removes color but keeps the interactive surface',
		environment: {TERM: 'xterm-256color', NO_COLOR: '1'},
		isTty: true,
		expected: {interactive: true, colorLevel: 'none'},
	},
	{
		name: 'FORCE_COLOR keeps color on a pipe without making it interactive',
		environment: {FORCE_COLOR: '1'},
		isTty: false,
		expected: {interactive: false, colorLevel: 'ansi16'},
	},
	{
		name: 'a FORCE_COLOR level sets the color depth on a pipe',
		environment: {FORCE_COLOR: '3'},
		isTty: false,
		expected: {colorLevel: 'truecolor'},
	},
	{
		name: 'FORCE_COLOR raises a TTY above what TERM reports',
		environment: {TERM: 'xterm', FORCE_COLOR: '2'},
		isTty: true,
		expected: {colorLevel: 'ansi256'},
	},
	{
		name: 'FORCE_COLOR keeps color on a dumb terminal',
		environment: {TERM: 'dumb', FORCE_COLOR: '1'},
		isTty: true,
		expected: {interactive: false, colorLevel: 'ansi16'},
	},
	{
		name: 'FORCE_COLOR=false disables color',
		environment: {TERM: 'xterm-256color', FORCE_COLOR: 'false'},
		isTty: true,
		expected: {colorLevel: 'none'},
	},
];

for (const testCase of cases) {
	test(`capabilities: ${testCase.name}`, (t: TestContext) => {
		const capabilities = detectTerminalCapabilities(
			testCase.environment,
			{isTTY: testCase.isTty},
		);
		for (const [key, value] of Object.entries(testCase.expected)) {
			t.assert.strictEqual(capabilities[key as keyof typeof capabilities], value, key);
		}
	});
}

test('render() defaults to non-interactive on a dumb terminal', (t: TestContext) => {
	const previous = process.env['TERM'];
	process.env['TERM'] = 'dumb';
	const stdout = createStdout(80, true);

	try {
		const instance = render(<Text>dumb</Text>, {
			stdout,
			patchConsole: false,
		});
		t.after(() => {
			instance.unmount();
		});

		// Interactive rendering hides the cursor and erases frames. A dumb terminal gets neither.
		t.assert.strictEqual(
			stdout.getWrites().some(write => write.includes('\u{1B}[?25l')),
			false,
		);
	} finally {
		if (previous === undefined) {
			delete process.env['TERM'];
		} else {
			process.env['TERM'] = previous;
		}
	}
});
