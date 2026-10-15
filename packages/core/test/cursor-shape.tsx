import test, {type TestContext} from 'node:test';
import term from './helpers/term.js';

const bar = '\u{1B}[6 q';
const restore = '\u{1B}[0 q';

// Every cursor shape sequence (ESC [ digits, a space, q) in the output, in order. cli-cursor's exit hook shows the cursor after this, so the check looks at shape sequences, not at the last bytes.
const cursorShapeWrites = (output: string): string[] =>
	// eslint-disable-next-line no-control-regex, regexp/no-control-character -- The pattern matches the escape bytes the fixture writes.
	output.match(/\u{1B}\[\d+ q/gu) ?? [];

test('a bar cursor is set while the app runs, and the default is the last cursor shape written on exit (PTY)', async (t: TestContext) => {
	const ps = term('cursor-shape', ['timer']);
	const {exitCode} = await ps.exited;

	t.assert.strictEqual(exitCode, 0);
	t.assert.deepStrictEqual(cursorShapeWrites(ps.output), [bar, restore]);
});

test('SIGTERM restores the default cursor shape before the process ends (PTY)', async (t: TestContext) => {
	const ps = term('cursor-shape');
	await ps.ready;

	ps.kill('SIGTERM');
	await ps.exited;

	t.assert.deepStrictEqual(cursorShapeWrites(ps.output), [bar, restore]);
});
