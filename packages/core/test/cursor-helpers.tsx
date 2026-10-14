import test, {type TestContext} from 'node:test';
import ansiEscapes from 'ansi-escapes';
import {
	cursorPositionChanged,
	buildCursorSuffix,
	buildReturnToBottom,
	buildCursorOnlySequence,
	buildReturnToBottomPrefix,
	buildEraseFrame,
} from '../src/cursor-helpers.js';

const showCursorEscape = '\u{1B}[?25h';
const hideCursorEscape = '\u{1B}[?25l';

// CursorPositionChanged

test('cursorPositionChanged - both undefined returns false', (t: TestContext) => {
	t.assert.strictEqual(cursorPositionChanged(undefined, undefined), false);
});

test('cursorPositionChanged - same position returns false', (t: TestContext) => {
	t.assert.strictEqual(
		cursorPositionChanged({x: 1, y: 2}, {x: 1, y: 2}),
		false,
	);
});

test('cursorPositionChanged - different x returns true', (t: TestContext) => {
	t.assert.ok(cursorPositionChanged({x: 1, y: 2}, {x: 3, y: 2}));
});

test('cursorPositionChanged - different y returns true', (t: TestContext) => {
	t.assert.ok(cursorPositionChanged({x: 1, y: 2}, {x: 1, y: 3}));
});

test('cursorPositionChanged - undefined vs defined returns true', (t: TestContext) => {
	t.assert.ok(cursorPositionChanged(undefined, {x: 0, y: 0}));
	t.assert.ok(cursorPositionChanged({x: 0, y: 0}, undefined));
});

// BuildCursorSuffix

test('buildCursorSuffix - returns empty string when cursorPosition is undefined', (t: TestContext) => {
	t.assert.strictEqual(buildCursorSuffix(3, undefined), '');
});

test('buildCursorSuffix - moves up and positions cursor', (t: TestContext) => {
	const result = buildCursorSuffix(3, {x: 5, y: 1});
	t.assert.strictEqual(
		result,
		ansiEscapes.cursorUp(2) + ansiEscapes.cursorTo(5) + showCursorEscape,
	);
});

test('buildCursorSuffix - no cursorUp when cursor is at last visible line', (t: TestContext) => {
	const result = buildCursorSuffix(3, {x: 0, y: 3});
	t.assert.strictEqual(result, ansiEscapes.cursorTo(0) + showCursorEscape);
});

test('buildCursorSuffix - cursor at first line of single-line output', (t: TestContext) => {
	const result = buildCursorSuffix(1, {x: 4, y: 0});
	t.assert.strictEqual(
		result,
		ansiEscapes.cursorUp(1) + ansiEscapes.cursorTo(4) + showCursorEscape,
	);
});

// BuildReturnToBottom

test('buildReturnToBottom - returns empty string when previousCursorPosition is undefined', (t: TestContext) => {
	t.assert.strictEqual(buildReturnToBottom(4, undefined), '');
});

test('buildReturnToBottom - moves down to bottom', (t: TestContext) => {
	const result = buildReturnToBottom(4, {x: 5, y: 0});
	t.assert.strictEqual(
		result,
		ansiEscapes.cursorDown(3) + ansiEscapes.cursorTo(0),
	);
});

test('buildReturnToBottom - no cursorDown when cursor already at bottom', (t: TestContext) => {
	const result = buildReturnToBottom(4, {x: 0, y: 3});
	t.assert.strictEqual(result, ansiEscapes.cursorTo(0));
});

// BuildCursorOnlySequence

test('buildCursorOnlySequence - builds full sequence with hide prefix when cursor was shown', (t: TestContext) => {
	const result = buildCursorOnlySequence({
		cursorWasShown: true,
		previousLineCount: 2,
		previousCursorPosition: {x: 0, y: 0},
		cursorPosition: {x: 3, y: 0},
	});
	const expected =
		hideCursorEscape +
		buildReturnToBottom(2, {x: 0, y: 0}) +
		buildCursorSuffix(1, {x: 3, y: 0});
	t.assert.strictEqual(result, expected);
});

test('buildCursorOnlySequence - no hide prefix when cursor was not shown', (t: TestContext) => {
	const result = buildCursorOnlySequence({
		cursorWasShown: false,
		previousLineCount: 0,
		previousCursorPosition: undefined,
		cursorPosition: {x: 3, y: 0},
	});
	t.assert.strictEqual(result.startsWith(hideCursorEscape), false);
	t.assert.ok(result.includes(showCursorEscape));
});

// BuildReturnToBottomPrefix

test('buildReturnToBottomPrefix - returns empty string when cursor was not shown', (t: TestContext) => {
	t.assert.strictEqual(buildReturnToBottomPrefix(false, 4, {x: 0, y: 0}), '');
});

test('buildReturnToBottomPrefix - returns hide + returnToBottom when cursor was shown', (t: TestContext) => {
	const result = buildReturnToBottomPrefix(true, 4, {x: 0, y: 0});
	t.assert.strictEqual(
		result,
		hideCursorEscape + buildReturnToBottom(4, {x: 0, y: 0}),
	);
});

test('buildReturnToBottomPrefix - with undefined previousCursorPosition still hides cursor', (t: TestContext) => {
	const result = buildReturnToBottomPrefix(true, 4, undefined);
	t.assert.strictEqual(
		result,
		hideCursorEscape + buildReturnToBottom(4, undefined),
	);
});

// Out-of-range positions must stay inside the frame. A cursor above the top row would move the
// terminal cursor into content the frame does not own, and one below the bottom row would scroll.

test('buildCursorSuffix - a row above the frame stops at the top row', (t: TestContext) => {
	t.assert.strictEqual(
		buildCursorSuffix(3, {x: 0, y: -5}),
		ansiEscapes.cursorUp(3) + ansiEscapes.cursorTo(0) + showCursorEscape,
	);
});

test('buildCursorSuffix - a row below the frame stops at the bottom row', (t: TestContext) => {
	t.assert.strictEqual(
		buildCursorSuffix(3, {x: 0, y: 9}),
		ansiEscapes.cursorTo(0) + showCursorEscape,
	);
});

test('buildCursorSuffix - a negative column is clamped to column 0', (t: TestContext) => {
	t.assert.strictEqual(
		buildCursorSuffix(3, {x: -4, y: 1}),
		ansiEscapes.cursorUp(2) + ansiEscapes.cursorTo(0) + showCursorEscape,
	);
});

test('buildReturnToBottom - a row above the frame returns to the bottom from the top row', (t: TestContext) => {
	t.assert.strictEqual(
		buildReturnToBottom(4, {x: 2, y: -2}),
		ansiEscapes.cursorDown(3) + ansiEscapes.cursorTo(0),
	);
});

test('buildEraseFrame - a row above the frame erases from the top row without moving down', (t: TestContext) => {
	t.assert.strictEqual(
		buildEraseFrame(4, {x: 0, y: -3}),
		hideCursorEscape + ansiEscapes.cursorTo(0) + ansiEscapes.eraseDown,
	);
});
