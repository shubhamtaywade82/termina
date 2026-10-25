import test, {type TestContext} from 'node:test';
import term from './helpers/term.js';

// The pty runs the real terminal path, so these checks see the bytes a user's terminal would receive.
const enterAltScreen = '[?1049h';
const exitAltScreen = '[?1049l';
const showCursor = '[?25h';
const ready = '__READY__';

for (const [name, key] of [
	['q', 'q'],
	['Ctrl+C', '\u{3}'],
] as const) {
	test(`leaving with ${name} returns to the primary screen and shows the cursor`, async (t: TestContext) => {
		const ps = term('alternate-screen-exit');
		// `write` waits for the fixture's READY marker, so the key is never sent before the app is listening.
		ps.write(key);
		await ps.waitForExit();

		const enteredAt = ps.output.indexOf(enterAltScreen);
		const readyAt = ps.output.indexOf(ready);
		const leftAt = ps.output.lastIndexOf(exitAltScreen);
		t.assert.notStrictEqual(
			enteredAt,
			-1,
			'the app entered the alternate screen',
		);
		t.assert.ok(
			readyAt > enteredAt,
			'the app is drawn on the alternate screen',
		);
		t.assert.ok(leftAt > readyAt, 'the screen is left only after the key');
		t.assert.ok(
			ps.output.lastIndexOf(showCursor) > leftAt,
			'the cursor is shown after the screen is left',
		);
	});
}
