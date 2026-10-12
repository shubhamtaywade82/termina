import test, {type TestContext} from 'node:test';
import {rowsForLine, rowsToErase} from '../src/reflow.js';

test('an empty line still occupies one row', (t: TestContext) => {
	t.assert.strictEqual(rowsForLine('', 80), 1);
});

test('a line that exactly fills the width does not wrap', (t: TestContext) => {
	t.assert.strictEqual(rowsForLine('x'.repeat(80), 80), 1);
	t.assert.strictEqual(rowsForLine('x'.repeat(81), 80), 2);
	t.assert.strictEqual(rowsForLine('x'.repeat(161), 80), 3);
});

test('SGR styling does not count toward the width', (t: TestContext) => {
	const styled = `\u001B[31m${'x'.repeat(80)}\u001B[39m`;
	t.assert.strictEqual(rowsForLine(styled, 80), 1);
});

test('wide characters count as two columns', (t: TestContext) => {
	t.assert.strictEqual(rowsForLine('漢字', 2), 2);
	t.assert.strictEqual(rowsForLine('漢字', 4), 1);
});

test('a wide character that does not fit at the end of a row wraps whole', (t: TestContext) => {
	t.assert.strictEqual(rowsForLine('aa漢aa漢aa漢', 3), 5);
});

test('an unknown width falls back to one row per line', (t: TestContext) => {
	t.assert.strictEqual(rowsForLine('x'.repeat(200), 0), 1);
	t.assert.strictEqual(rowsForLine('x'.repeat(200), Number.NaN), 1);
});

test('an empty frame has nothing to erase', (t: TestContext) => {
	t.assert.strictEqual(rowsToErase('', 80), 0);
});

test('a frame ending in a newline counts the cursor row below it', (t: TestContext) => {
	t.assert.strictEqual(rowsToErase('A\n', 80), 2);
	t.assert.strictEqual(rowsToErase('\n', 80), 2);
	t.assert.strictEqual(rowsToErase(`A\n${'x'.repeat(81)}\n`, 80), 4);
});

test('a frame without a trailing newline ends on its last physical row', (t: TestContext) => {
	t.assert.strictEqual(rowsToErase('A\nB', 80), 2);
	t.assert.strictEqual(rowsToErase(`A\n${'x'.repeat(81)}`, 40), 4);
});
