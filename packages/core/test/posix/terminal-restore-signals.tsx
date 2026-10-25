// Signals, `ps` and job control. Windows has no SIGTSTP or SIGCONT, and node-pty cannot send signals there, so the runner does not run this directory on Windows.
import test, {type TestContext} from 'node:test';
import {execFileSync} from 'node:child_process';
import term, {termAsJob} from '../helpers/term.js';
import {
	afterReady,
	enterAltScreen,
	exitAltScreen,
	hideCursor,
	missingRestorations,
	showCursor,
	waitFor,
} from '../helpers/terminal-restore.js';

// The `ps` state of the process: `T` while it is stopped by a signal.
const processState = (pid: number): string => {
	try {
		return execFileSync('ps', ['-o', 'stat=', '-p', String(pid)], {
			encoding: 'utf8',
		}).trim();
	} catch {
		return '';
	}
};

// The pid of the job the shell started: the child of the shell's pid.
const childPid = (parentPid: number): number | undefined => {
	const table = execFileSync('ps', ['-axo', 'pid=,ppid='], {encoding: 'utf8'});

	for (const line of table.split('\n')) {
		const [pid, ppid] = line.trim().split(/\s+/).map(Number);
		if (ppid === parentPid && pid !== undefined) {
			return pid;
		}
	}

	return undefined;
};

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
	test(`${signal} restores the terminal before the process ends (PTY)`, async (t: TestContext) => {
		const ps = term('alternate-screen-restore');
		await ps.ready;

		ps.kill(signal);
		await ps.exited;

		t.assert.deepStrictEqual(missingRestorations(afterReady(ps.output)), []);
	});
}

test('Ctrl+Z hands the terminal back before the process stops, and takes it again on SIGCONT (PTY)', async (t: TestContext) => {
	const shell = termAsJob('alternate-screen-stop');

	try {
		await shell.ready;
		const job = childPid(shell.shellPid);
		if (job === undefined) {
			throw new Error('The fixture did not start as a job of the shell');
		}

		const beforeStop = shell.output.length;
		shell.write('\u{1A}');
		// The shell reports the stop after the job has written its restore sequences, so wait for the report before reading the output.
		await waitFor(() => shell.output.slice(beforeStop).includes('Stopped'));
		t.assert.ok(processState(job).startsWith('T'), 'the job is stopped');

		t.assert.ok(
			shell.output.slice(beforeStop).includes(exitAltScreen),
			'left the alternate screen before stopping',
		);
		t.assert.ok(
			shell.output.slice(beforeStop).includes(showCursor),
			'showed the cursor before stopping',
		);

		const beforeContinue = shell.output.length;
		execFileSync('kill', ['-CONT', String(job)]);
		await waitFor(() =>
			shell.output.slice(beforeContinue).includes(enterAltScreen),
		);

		const continued = shell.output.slice(beforeContinue);
		t.assert.ok(continued.includes(hideCursor), 'redrew the frame on continue');

		execFileSync('kill', ['-TERM', String(job)]);
		await waitFor(() => processState(job) === '');
	} finally {
		shell.dispose();
	}
});
