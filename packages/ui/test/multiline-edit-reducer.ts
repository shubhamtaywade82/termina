import test, {type TestContext} from 'node:test';
import {
	reduceMultilineEdit,
	viewportTop,
	type MultilineEditState,
} from '../source/lib/multiline-edit-reducer.js';

const family = '👨‍👩‍👧';

const at = (
	value: string,
	cursorOffset: number,
	top = 0,
): MultilineEditState => ({
	value,
	cursorOffset,
	goalColumn: undefined,
	top,
});

test('insert puts text at the caret and moves the caret after it', (t: TestContext) => {
	const next = reduceMultilineEdit(at('ac', 1), {
		type: 'insert',
		text: 'b',
		rows: 5,
	});

	t.assert.deepStrictEqual(next, {
		value: 'abc',
		cursorOffset: 2,
		goalColumn: undefined,
		top: 0,
	});
});

test('insert keeps the line feeds of a multi-line text', (t: TestContext) => {
	const next = reduceMultilineEdit(at('', 0), {
		type: 'insert',
		text: 'x\ny',
		rows: 5,
	});

	t.assert.strictEqual(next.value, 'x\ny');
	t.assert.strictEqual(next.cursorOffset, 3);
});

test('insert drops control characters other than the line feed', (t: TestContext) => {
	const next = reduceMultilineEdit(at('', 0), {
		type: 'insert',
		text: 'a\u{7}b\nc',
		rows: 5,
	});

	t.assert.strictEqual(next.value, 'ab\nc');
});

test('insert of empty text returns the same state', (t: TestContext) => {
	const state = at('abc', 1);

	t.assert.strictEqual(
		reduceMultilineEdit(state, {type: 'insert', text: '', rows: 5}),
		state,
	);
});

test('newline splits the line at the caret and moves the caret to the new line', (t: TestContext) => {
	const next = reduceMultilineEdit(at('abcd', 2), {type: 'newline', rows: 5});

	t.assert.strictEqual(next.value, 'ab\ncd');
	t.assert.strictEqual(next.cursorOffset, 3);
});

test('newline at the end adds an empty last line', (t: TestContext) => {
	const next = reduceMultilineEdit(at('ab', 2), {type: 'newline', rows: 5});

	t.assert.strictEqual(next.value, 'ab\n');
	t.assert.strictEqual(next.cursorOffset, 3);
});

test('delete at the start of a line joins it to the line before', (t: TestContext) => {
	const next = reduceMultilineEdit(at('ab\ncd', 3), {
		type: 'delete',
		rows: 5,
	});

	t.assert.strictEqual(next.value, 'abcd');
	t.assert.strictEqual(next.cursorOffset, 2);
});

test('delete at the start of the value does nothing', (t: TestContext) => {
	const state = at('ab', 0);

	t.assert.strictEqual(
		reduceMultilineEdit(state, {type: 'delete', rows: 5}),
		state,
	);
});

test('delete-forward at the end of a line joins the line after it', (t: TestContext) => {
	const next = reduceMultilineEdit(at('ab\ncd', 2), {
		type: 'delete-forward',
		rows: 5,
	});

	t.assert.strictEqual(next.value, 'abcd');
	t.assert.strictEqual(next.cursorOffset, 2);
});

test('delete removes a whole ZWJ sequence', (t: TestContext) => {
	const next = reduceMultilineEdit(at(`a${family}`, 9), {
		type: 'delete',
		rows: 5,
	});

	t.assert.strictEqual(next.value, 'a');
	t.assert.strictEqual(next.cursorOffset, 1);
});

test('move-left at the start of a line goes to the end of the line before', (t: TestContext) => {
	const next = reduceMultilineEdit(at('ab\ncd', 3), {
		type: 'move-left',
		rows: 5,
	});

	t.assert.strictEqual(next.cursorOffset, 2);
});

test('move-right at the end of a line goes to the start of the line after', (t: TestContext) => {
	const next = reduceMultilineEdit(at('ab\ncd', 2), {
		type: 'move-right',
		rows: 5,
	});

	t.assert.strictEqual(next.cursorOffset, 3);
});

test('move-left and move-right step over a ZWJ sequence as one grapheme', (t: TestContext) => {
	const value = `a${family}`;
	const left = reduceMultilineEdit(at(value, 9), {type: 'move-left', rows: 5});
	const right = reduceMultilineEdit(at(value, 1), {
		type: 'move-right',
		rows: 5,
	});

	t.assert.strictEqual(left.cursorOffset, 1);
	t.assert.strictEqual(right.cursorOffset, 9);
});

test('move-down keeps the goal column across a short line', (t: TestContext) => {
	// Row 0 is 'abcdef' and the caret is at column 5. Row 1 is 'ab', so the caret clamps to its end, but the goal column stays 5 for row 2.
	const value = 'abcdef\nab\nabcdef';
	const first = reduceMultilineEdit(at(value, 5), {
		type: 'move-down',
		rows: 5,
	});
	const second = reduceMultilineEdit(first, {type: 'move-down', rows: 5});

	t.assert.strictEqual(first.cursorOffset, 9);
	t.assert.strictEqual(first.goalColumn, 5);
	t.assert.strictEqual(second.cursorOffset, 15);
	t.assert.strictEqual(second.goalColumn, 5);
});

test('move-up keeps the goal column and clamps it to a short line', (t: TestContext) => {
	// The caret starts at column 5 of row 2, which is offset 15.
	const value = 'abcdef\nab\nabcdef';
	const bottom = at(value, 15);
	const middle = reduceMultilineEdit(bottom, {type: 'move-up', rows: 5});
	const top = reduceMultilineEdit(middle, {type: 'move-up', rows: 5});

	t.assert.strictEqual(middle.cursorOffset, 9);
	t.assert.strictEqual(top.cursorOffset, 5);
});

test('a horizontal move resets the goal column', (t: TestContext) => {
	// Down to the short line ends at its end, offset 9, column 2. Left moves to offset 8, column 1, so the next Down goes to column 1 of row 2 (offset 11), not to column 5.
	const value = 'abcdef\nab\nabcdef';
	const onShort = reduceMultilineEdit(at(value, 5), {
		type: 'move-down',
		rows: 5,
	});
	const moved = reduceMultilineEdit(onShort, {type: 'move-left', rows: 5});
	const down = reduceMultilineEdit(moved, {type: 'move-down', rows: 5});

	t.assert.strictEqual(moved.goalColumn, undefined);
	t.assert.strictEqual(down.cursorOffset, 11);
	t.assert.strictEqual(down.goalColumn, 1);
});

test('an edit resets the goal column', (t: TestContext) => {
	const onShort = reduceMultilineEdit(at('abcdef\nab\nabcdef', 5), {
		type: 'move-down',
		rows: 5,
	});
	const typed = reduceMultilineEdit(onShort, {
		type: 'insert',
		text: 'x',
		rows: 5,
	});

	t.assert.strictEqual(typed.goalColumn, undefined);
});

test('move-up on the first row and move-down on the last row return the same state', (t: TestContext) => {
	const top = at('ab\ncd', 1);
	const bottom = at('ab\ncd', 4);

	t.assert.strictEqual(
		reduceMultilineEdit(top, {type: 'move-up', rows: 5}),
		top,
	);
	t.assert.strictEqual(
		reduceMultilineEdit(bottom, {type: 'move-down', rows: 5}),
		bottom,
	);
});

test('up and down move with wide characters by display cells', (t: TestContext) => {
	// Row 0 ends at column 8, after four wide characters. Row 1 ends at column 2, so Down lands on its end, and Up returns to column 8 of row 0.
	const value = '中文中文\nab';
	const down = reduceMultilineEdit(at(value, 4), {
		type: 'move-down',
		rows: 5,
	});
	const up = reduceMultilineEdit(down, {type: 'move-up', rows: 5});

	t.assert.strictEqual(down.cursorOffset, 7);
	t.assert.strictEqual(up.cursorOffset, 4);
});

test('home and end move within the line of the caret', (t: TestContext) => {
	const state = at('ab\ncdef', 5);

	t.assert.strictEqual(
		reduceMultilineEdit(state, {type: 'home', rows: 5}).cursorOffset,
		3,
	);
	t.assert.strictEqual(
		reduceMultilineEdit(state, {type: 'end', rows: 5}).cursorOffset,
		7,
	);
});

test('home and end reset the goal column', (t: TestContext) => {
	const state = {...at('ab\ncdef', 5), goalColumn: 2};

	t.assert.strictEqual(
		reduceMultilineEdit(state, {type: 'home', rows: 5}).goalColumn,
		undefined,
	);
	t.assert.strictEqual(
		reduceMultilineEdit(state, {type: 'end', rows: 5}).goalColumn,
		undefined,
	);
});

test('home, end, and vertical moves on an empty value keep the value and the caret at 0', (t: TestContext) => {
	const state = at('', 0);

	for (const type of ['home', 'end', 'move-up', 'move-down'] as const) {
		const next = reduceMultilineEdit(state, {type, rows: 5});
		t.assert.strictEqual(next.value, '');
		t.assert.strictEqual(next.cursorOffset, 0);
	}
});

test('a move past the bottom of the viewport scrolls it just far enough to show the caret', (t: TestContext) => {
	const value = 'a\nb\nc\nd\ne';
	let state = at(value, 0);

	state = reduceMultilineEdit(state, {type: 'move-down', rows: 2});
	t.assert.strictEqual(state.top, 0);

	state = reduceMultilineEdit(state, {type: 'move-down', rows: 2});
	t.assert.strictEqual(state.top, 1);

	state = reduceMultilineEdit(state, {type: 'move-down', rows: 2});
	t.assert.strictEqual(state.top, 2);
});

test('a move above the viewport scrolls it up to the caret row', (t: TestContext) => {
	// Offset 4 is row 2 with the viewport at row 2. Up moves to row 1, which is above it.
	const state = reduceMultilineEdit(at('a\nb\nc\nd\ne', 4, 2), {
		type: 'move-up',
		rows: 2,
	});

	t.assert.strictEqual(state.top, 1);

	const above = reduceMultilineEdit(at('a\nb\nc\nd\ne', 2, 2), {
		type: 'move-up',
		rows: 2,
	});

	t.assert.strictEqual(above.top, 0);
});

test('an action with rows adjusts the viewport to the caret row it leaves', (t: TestContext) => {
	const next = reduceMultilineEdit(at('a\nb\nc', 5), {
		type: 'insert',
		text: 'x',
		rows: 2,
	});

	t.assert.strictEqual(next.top, 1);
});

test('the top is clamped to the value when the value shrinks', (t: TestContext) => {
	// The value had five lines and the viewport was scrolled to row 3. It now has three, and the caret is on the last row.
	const next = reduceMultilineEdit(at('a\nb\nc', 5, 3), {
		type: 'move-left',
		rows: 2,
	});

	t.assert.strictEqual(next.top, 1);
});

test('the top keeps the caret visible when the viewport gets shorter', (t: TestContext) => {
	// Four rows show rows 0 to 3, so Down to row 4 scrolls to top 1. The caret is on row 4 when the viewport drops to two rows, so the top moves to 3 to keep it on the bottom row. Left to row 3 stays inside rows 3 and 4.
	const scrolled = at('a\nb\nc\nd\ne', 6);
	const down = reduceMultilineEdit(scrolled, {type: 'move-down', rows: 4});
	const shorter = reduceMultilineEdit(down, {type: 'move-left', rows: 2});

	t.assert.strictEqual(down.top, 1);
	t.assert.strictEqual(shorter.top, 3);
});

test('viewportTop keeps the top when the caret is already visible', (t: TestContext) => {
	t.assert.strictEqual(viewportTop(2, 3, 3, 10), 2);
});

test('viewportTop never shows rows past the end of the value', (t: TestContext) => {
	t.assert.strictEqual(viewportTop(9, 2, 2, 3), 1);
	t.assert.strictEqual(viewportTop(0, 0, 5, 3), 0);
});
