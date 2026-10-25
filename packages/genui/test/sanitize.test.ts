import test, {type TestContext} from 'node:test';
import {sanitizeText} from '../source/sanitize.js';

test('preserves plain text and newlines', (t: TestContext) => {
	const input = 'Hello World\nLine 2\tTabbed';
	t.assert.strictEqual(sanitizeText(input), input);
});

test('preserves Unicode and emojis intact', (t: TestContext) => {
	const input = 'Dashboard 🚀 ✨ Status: OK ✅ 日本語';
	t.assert.strictEqual(sanitizeText(input), input);
});

test('strips OSC sequences including window title and clipboard access', (t: TestContext) => {
	// OSC 0 (window title), OSC 52 (clipboard)
	const input =
		'\u{1B}]0;Malicious Title\u{7}Clean Text\u{1B}]52;c;ZXZpbA==\u{1B}\\';
	const result = sanitizeText(input);
	t.assert.strictEqual(result, 'Clean Text');
});

test('strips OSC 8 hyperlinks to prevent terminal hyperlink spoofing', (t: TestContext) => {
	const input =
		'\u{1B}]8;;https://malicious.site\u{7}Click Here\u{1B}]8;;\u{7}';
	const result = sanitizeText(input);
	t.assert.strictEqual(result, 'Click Here');
});

test('strips CSI escape sequences that alter terminal state', (t: TestContext) => {
	// CSI 2J (clear screen), CSI 1;1H (cursor home), CSI 6n (device status query)
	const input = '\u{1B}[2J\u{1B}[1;1HHeader\u{1B}[6n';
	const result = sanitizeText(input);
	t.assert.strictEqual(result, 'Header');
});

test('enforces maxTextLength limit safely without splitting surrogate pairs', (t: TestContext) => {
	const input = 'Safe Text 🚀 Extended content';
	const truncated = sanitizeText(input, 12);
	t.assert.ok(truncated.length <= 12);
	t.assert.strictEqual(truncated, 'Safe Text 🚀');
});

test('strips 8-bit C1 controls such as the one-byte CSI introducer', (t: TestContext) => {
	t.assert.strictEqual(sanitizeText('a\u{9B}31mb\u{85}c'), 'a31mbc');
});
