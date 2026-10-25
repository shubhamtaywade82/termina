import test, {type TestContext} from 'node:test';
import term from './helpers/term.js';
import {afterReady, missingRestorations} from './helpers/terminal-restore.js';

// Runs on every platform. The signal and job-control tests live in test/posix, which Windows does not run.
test('an uncaught error restores the terminal before the process ends (PTY)', async (t: TestContext) => {
	const ps = term('alternate-screen-restore', ['throw']);
	await ps.exited;

	t.assert.deepStrictEqual(missingRestorations(afterReady(ps.output)), []);
	t.assert.ok(ps.output.includes('uncaught boom'));
});
