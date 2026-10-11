import test, {type TestContext} from 'node:test';
import {nearestInDirection, type FocusCandidate} from '../source/index.js';

// A 2x2 grid of 10x5 cells with a 2-column gutter and a 1-row gutter.
const cells: FocusCandidate[] = [
	{id: 'A', rect: {x: 0, y: 0, width: 10, height: 5}},
	{id: 'B', rect: {x: 12, y: 0, width: 10, height: 5}},
	{id: 'C', rect: {x: 0, y: 6, width: 10, height: 5}},
	{id: 'D', rect: {x: 12, y: 6, width: 10, height: 5}},
];

const cell = (id: string) => cells.find(candidate => candidate.id === id)!.rect;

test('spatial focus moves to the neighbor in each direction', (t: TestContext) => {
	t.assert.strictEqual(nearestInDirection(cell('A'), cells, 'right'), 'B');
	t.assert.strictEqual(nearestInDirection(cell('A'), cells, 'down'), 'C');
	t.assert.strictEqual(nearestInDirection(cell('C'), cells, 'right'), 'D');
	t.assert.strictEqual(nearestInDirection(cell('B'), cells, 'left'), 'A');
	t.assert.strictEqual(nearestInDirection(cell('D'), cells, 'up'), 'B');
});

test('no candidate in the requested direction yields undefined', (t: TestContext) => {
	t.assert.strictEqual(nearestInDirection(cell('A'), cells, 'up'), undefined);
	t.assert.strictEqual(nearestInDirection(cell('A'), cells, 'left'), undefined);
	t.assert.strictEqual(nearestInDirection(cell('B'), cells, 'right'), undefined);
});

test('a target straight ahead beats a diagonal one at a similar distance', (t: TestContext) => {
	const origin = {x: 0, y: 0, width: 10, height: 5};
	const candidates: FocusCandidate[] = [
		{id: 'diagonal', rect: {x: 12, y: 5, width: 10, height: 5}},
		{id: 'straight', rect: {x: 12, y: 0, width: 10, height: 5}},
	];
	t.assert.strictEqual(nearestInDirection(origin, candidates, 'right'), 'straight');
});

test('a vertical step counts a cell row as more distance than a column', (t: TestContext) => {
	// One row down is about two columns of visual distance, so a neighbor two columns to the right is nearer than one row below.
	const origin = {x: 0, y: 0, width: 4, height: 2};
	const candidates: FocusCandidate[] = [
		{id: 'below', rect: {x: 0, y: 2, width: 4, height: 2}},
		{id: 'right', rect: {x: 4, y: 0, width: 4, height: 2}},
	];
	t.assert.strictEqual(nearestInDirection(origin, candidates, 'down'), 'below');
	t.assert.strictEqual(nearestInDirection(origin, candidates, 'right'), 'right');
});
