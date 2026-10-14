import test, {type TestContext} from 'node:test';
import {
	lineRange,
	lineStarts,
	offsetAtRowColumn,
	positionOf,
} from '../source/lib/text-lines.js';

// A family emoji is one grapheme: three people joined by zero-width joiners, eight UTF-16 units, two cells.
const family = '👨‍👩‍👧';

test('an empty value has one line that starts at 0', (t: TestContext) => {
	t.assert.deepStrictEqual(lineStarts(''), [0]);
});

test('a value without a line feed has one line', (t: TestContext) => {
	t.assert.deepStrictEqual(lineStarts('abc'), [0]);
});

test('each line feed starts a line, including a trailing one and an empty line', (t: TestContext) => {
	t.assert.deepStrictEqual(lineStarts('a\nbc\n\nd'), [0, 2, 5, 6]);
	t.assert.deepStrictEqual(lineStarts('a\n'), [0, 2]);
});

test('lineRange gives the bounds of a line, without its line feed', (t: TestContext) => {
	t.assert.deepStrictEqual(lineRange('ab\ncd\n', 0), {start: 0, end: 2});
	t.assert.deepStrictEqual(lineRange('ab\ncd\n', 1), {start: 3, end: 5});
	t.assert.deepStrictEqual(lineRange('ab\ncd\n', 2), {start: 6, end: 6});
	t.assert.deepStrictEqual(lineRange('', 0), {start: 0, end: 0});
});

test('positionOf splits an offset into a row and a column', (t: TestContext) => {
	const value = 'ab\ncd';

	t.assert.deepStrictEqual(positionOf(value, 0), {row: 0, column: 0});
	t.assert.deepStrictEqual(positionOf(value, 2), {row: 0, column: 2});
	t.assert.deepStrictEqual(positionOf(value, 3), {row: 1, column: 0});
	t.assert.deepStrictEqual(positionOf(value, 5), {row: 1, column: 2});
});

test('positionOf clamps an offset outside the value', (t: TestContext) => {
	t.assert.deepStrictEqual(positionOf('ab\ncd', 99), {row: 1, column: 2});
	t.assert.deepStrictEqual(positionOf('ab\ncd', -4), {row: 0, column: 0});
});

test('positionOf counts a wide character as two cells', (t: TestContext) => {
	// 中 and 文 are one UTF-16 unit each and two cells each.
	const value = '中文x';

	t.assert.deepStrictEqual(positionOf(value, 1), {row: 0, column: 2});
	t.assert.deepStrictEqual(positionOf(value, 2), {row: 0, column: 4});
	t.assert.deepStrictEqual(positionOf(value, 3), {row: 0, column: 5});
});

test('positionOf counts a ZWJ emoji sequence as one grapheme of two cells', (t: TestContext) => {
	const value = `${family}x`;

	t.assert.strictEqual(family.length, 8);
	t.assert.deepStrictEqual(positionOf(value, 8), {row: 0, column: 2});
	t.assert.deepStrictEqual(positionOf(value, 9), {row: 0, column: 3});
});

test('positionOf counts a combining mark with its base letter as one cell', (t: TestContext) => {
	const value = 'éx';

	t.assert.deepStrictEqual(positionOf(value, 2), {row: 0, column: 1});
	t.assert.deepStrictEqual(positionOf(value, 3), {row: 0, column: 2});
});

test('positionOf places the offset of an empty line at column 0 of that line', (t: TestContext) => {
	const value = '\n\nab';

	t.assert.deepStrictEqual(positionOf(value, 1), {row: 1, column: 0});
	t.assert.deepStrictEqual(positionOf(value, 2), {row: 2, column: 0});
	t.assert.deepStrictEqual(positionOf(value, 4), {row: 2, column: 2});
});

test('offsetAtRowColumn keeps the goal column on another row', (t: TestContext) => {
	// 'cdef' starts at 3. Column 2 is after 'd', at offset 5.
	t.assert.strictEqual(offsetAtRowColumn('ab\ncdef', 1, 2), 5);
	t.assert.strictEqual(offsetAtRowColumn('ab\ncdef', 0, 1), 1);
});

test('offsetAtRowColumn clamps a goal column past the end of the line to the line end', (t: TestContext) => {
	t.assert.strictEqual(offsetAtRowColumn('ab\ncdef', 0, 99), 2);
	t.assert.strictEqual(offsetAtRowColumn('ab\ncdef', 1, 99), 7);
});

test('offsetAtRowColumn picks the last boundary at or before the goal around a wide character', (t: TestContext) => {
	// Boundaries on row 0 are at columns 0, 2 and 4, at offsets 0, 1 and 2.
	const value = '中文\nab';

	t.assert.strictEqual(offsetAtRowColumn(value, 0, 1), 0);
	t.assert.strictEqual(offsetAtRowColumn(value, 0, 2), 1);
	t.assert.strictEqual(offsetAtRowColumn(value, 0, 3), 1);
	t.assert.strictEqual(offsetAtRowColumn(value, 0, 4), 2);
});

test('offsetAtRowColumn does not split a combining sequence', (t: TestContext) => {
	const value = 'éx';

	t.assert.strictEqual(offsetAtRowColumn(value, 0, 0), 0);
	t.assert.strictEqual(offsetAtRowColumn(value, 0, 1), 2);
});

test('offsetAtRowColumn returns the start of an empty line', (t: TestContext) => {
	t.assert.strictEqual(offsetAtRowColumn('a\n\nb', 1, 3), 2);
});

test('offsetAtRowColumn clamps a row outside the value', (t: TestContext) => {
	t.assert.strictEqual(offsetAtRowColumn('ab\ncd', 9, 1), 4);
	t.assert.strictEqual(offsetAtRowColumn('ab\ncd', -1, 1), 1);
});

test('offsetAtRowColumn and positionOf round-trip on every boundary of a mixed value', (t: TestContext) => {
	// Grapheme boundaries of the value: before 中, before a, before the family, before each line feed, before e, before 😀, and the end.
	const value = `中a${family}\n\né😀`;
	const boundaries = [0, 1, 2, 10, 11, 12, 14, 16];

	for (const offset of boundaries) {
		const {row, column} = positionOf(value, offset);
		t.assert.strictEqual(offsetAtRowColumn(value, row, column), offset);
	}
});
