import test, {type TestContext} from 'node:test';
import {
	nearestInDirection,
	type FocusCandidate,
	type Rect,
} from '../src/spatial.js';

// The 2 by 2 grid of 10 by 5 cells that the package documents.
const a: Rect = {x: 0, y: 0, width: 10, height: 5};
const b: Rect = {x: 12, y: 0, width: 10, height: 5};
const c: Rect = {x: 0, y: 6, width: 10, height: 5};
const d: Rect = {x: 12, y: 6, width: 10, height: 5};
const grid: FocusCandidate[] = [
	{id: 'A', rect: a},
	{id: 'B', rect: b},
	{id: 'C', rect: c},
	{id: 'D', rect: d},
];

test('moves to the neighbor in each direction of a grid', (t: TestContext) => {
	t.assert.strictEqual(nearestInDirection(a, grid, 'right'), 'B');
	t.assert.strictEqual(nearestInDirection(a, grid, 'down'), 'C');
	t.assert.strictEqual(nearestInDirection(a, grid, 'left'), undefined);
	t.assert.strictEqual(nearestInDirection(d, grid, 'up'), 'B');
});

test('never returns the origin, because its center is not ahead of itself', (t: TestContext) => {
	t.assert.strictEqual(
		nearestInDirection(a, [{id: 'A', rect: a}], 'right'),
		undefined,
	);
});

test('counts a row as two columns of distance', (t: TestContext) => {
	const origin: Rect = {x: 0, y: 0, width: 2, height: 2};
	// Two rows straight below: the center is 2 rows away, which counts as 4.
	const twoRowsBelow: FocusCandidate = {
		id: 'straight',
		rect: {x: 0, y: 2, width: 2, height: 2},
	};
	// One row below and three columns over: hypot(2, 3), about 3.6, which is nearer.
	const oneRowBelowThreeOver: FocusCandidate = {
		id: 'diagonal',
		rect: {x: 3, y: 1, width: 2, height: 2},
	};

	t.assert.strictEqual(
		nearestInDirection(origin, [twoRowsBelow, oneRowBelowThreeOver], 'down'),
		'diagonal',
	);
});

test('a candidate off the axis still qualifies when it is ahead, and the distance decides', (t: TestContext) => {
	const origin: Rect = {x: 0, y: 0, width: 2, height: 2};
	const farOff: FocusCandidate = {
		id: 'far',
		rect: {x: 20, y: 6, width: 2, height: 2},
	};

	t.assert.strictEqual(nearestInDirection(origin, [farOff], 'right'), 'far');
});

test('a candidate with the same coordinate along the direction does not qualify', (t: TestContext) => {
	const origin: Rect = {x: 0, y: 0, width: 4, height: 4};
	const sameRow: FocusCandidate = {
		id: 'sameRow',
		rect: {x: 8, y: 0, width: 4, height: 4},
	};

	t.assert.strictEqual(
		nearestInDirection(origin, [sameRow], 'down'),
		undefined,
	);
});

test('equally near candidates resolve to the earlier one', (t: TestContext) => {
	const origin: Rect = {x: 0, y: 0, width: 2, height: 2};
	const first: FocusCandidate = {
		id: 'first',
		rect: {x: 4, y: 0, width: 2, height: 2},
	};
	const second: FocusCandidate = {
		id: 'second',
		rect: {x: 4, y: 0, width: 2, height: 2},
	};

	t.assert.strictEqual(
		nearestInDirection(origin, [first, second], 'right'),
		'first',
	);
	t.assert.strictEqual(
		nearestInDirection(origin, [second, first], 'right'),
		'second',
	);
});

test('returns undefined for no candidates', (t: TestContext) => {
	t.assert.strictEqual(nearestInDirection(a, [], 'right'), undefined);
});
