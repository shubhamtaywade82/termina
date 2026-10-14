import test, {type TestContext} from 'node:test';
import {cursorShapeSequence, type CursorShape} from '../src/cursor-shape.js';

test('cursorShapeSequence maps each shape to its steady DECSCUSR code', (t: TestContext) => {
	const expected: Record<CursorShape, string> = {
		default: '\u{1B}[0 q',
		block: '\u{1B}[2 q',
		underline: '\u{1B}[4 q',
		bar: '\u{1B}[6 q',
	};

	for (const shape of Object.keys(expected) as CursorShape[]) {
		t.assert.strictEqual(cursorShapeSequence(shape), expected[shape], shape);
	}
});
