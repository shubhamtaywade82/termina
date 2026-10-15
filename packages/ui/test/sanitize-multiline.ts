import test, {type TestContext} from 'node:test';
import {sanitizeMultiline} from '../source/lib/sanitize-multiline.js';

test('CRLF and a lone CR both become one line feed', (t: TestContext) => {
	t.assert.strictEqual(sanitizeMultiline('a\r\nb'), 'a\nb');
	t.assert.strictEqual(sanitizeMultiline('a\rb'), 'a\nb');
});

test('a line feed is kept', (t: TestContext) => {
	t.assert.strictEqual(sanitizeMultiline('a\nb\n'), 'a\nb\n');
});

test('a CR before a CRLF and a pair of CRLFs each give one line feed per break', (t: TestContext) => {
	t.assert.strictEqual(sanitizeMultiline('\r\r\n'), '\n\n');
	t.assert.strictEqual(sanitizeMultiline('\r\n\r\n'), '\n\n');
});

test('a tab becomes four spaces', (t: TestContext) => {
	t.assert.strictEqual(sanitizeMultiline('a\tb'), 'a    b');
	t.assert.strictEqual(sanitizeMultiline('\t'), ' '.repeat(4));
});

test('other control characters and DEL are removed', (t: TestContext) => {
	t.assert.strictEqual(
		sanitizeMultiline('a\u{0}b\u{7}c\u{8}d\u{B}e\u{1B}f\u{7F}g'),
		'abcdefg',
	);
});

test('an escape sequence loses its escape and keeps the rest as text', (t: TestContext) => {
	t.assert.strictEqual(sanitizeMultiline('\u{1B}[31mred'), '[31mred');
});

test('printable text is kept as it is, including wide and combining characters', (t: TestContext) => {
	const text = '中文 😀 é family‍';

	t.assert.strictEqual(sanitizeMultiline(text), text);
});

test('empty text and text of only control characters', (t: TestContext) => {
	t.assert.strictEqual(sanitizeMultiline(''), '');
	t.assert.strictEqual(sanitizeMultiline('\u{0}\u{1B}\u{7F}'), '');
});
