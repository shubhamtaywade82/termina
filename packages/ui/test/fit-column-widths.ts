import test, {type TestContext} from 'node:test';
import {fitColumnWidths} from '../source/lib/fit-column-widths.js';

test('keeps natural widths when the row, gaps included, already fits', (t: TestContext) => {
	t.assert.deepStrictEqual(fitColumnWidths([4, 4], 2, 10), [4, 4]);
	t.assert.deepStrictEqual(fitColumnWidths([4, 4], 2, 40), [4, 4]);
});

test('keeps natural widths until the container is measured', (t: TestContext) => {
	t.assert.deepStrictEqual(fitColumnWidths([12, 4], 2, Number.POSITIVE_INFINITY), [12, 4]);
});

test('shrinks the widest column first, so short columns keep their width', (t: TestContext) => {
	// The cells have 26 columns to fill, and the two short columns take 9 of them.
	t.assert.deepStrictEqual(fitColumnWidths([5, 4, 80], 2, 30), [5, 4, 17]);
});

test('shares the shrink between equally wide columns', (t: TestContext) => {
	const [first, second] = fitColumnWidths([10, 10], 0, 15);

	t.assert.strictEqual(first! + second!, 15);
	t.assert.ok(Math.abs(first! - second!) <= 1);
});

test('keeps every column at one cell when the row cannot fit', (t: TestContext) => {
	// Three one-cell columns need three cells and two gaps. The result stays too wide, and the caller's flex layout absorbs the rest.
	t.assert.deepStrictEqual(fitColumnWidths([3, 3, 3], 2, 1), [1, 1, 1]);
});

test('leaves a column that is already empty at zero', (t: TestContext) => {
	t.assert.deepStrictEqual(fitColumnWidths([0, 5], 0, 3), [0, 3]);
});

test('returns no widths for no columns', (t: TestContext) => {
	t.assert.deepStrictEqual(fitColumnWidths([], 2, 10), []);
});
