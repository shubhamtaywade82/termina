import test, {type TestContext} from 'node:test';
import {execFileSync} from 'node:child_process';
import term, {termAsJob} from './helpers/term.js';

const showCursor = '[?25h';
const hideCursor = '[?25l';
const enterAltScreen = '[?1049h';
const exitAltScreen = '[?1049l';
const kittyPop = '[<u';
const mouseOff = '\u{1B}[?1006l\u{1B}[?1002l\u{1B}[?1000l';

const delay = async (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

// Polls until the condition holds. The process and the pty deliver output asynchronously, so a fixed delay would be flaky.
const waitFor = async (isMet: () => boolean, timeoutMs = 3000) => {
	const deadline = Date.now() + timeoutMs;

	while (!isMet()) {
		if (Date.now() > deadline) {
			throw new Error('Timed out waiting for the terminal state');
		}

		// eslint-disable-next-line no-await-in-loop
		await delay(20);
	}
};

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

// Output written after the fixture reported it was ready, so the check covers only the exit path.
const afterReady = (output: string): string =>
	output.slice(output.lastIndexOf('__READY__'));

const restorations: Record<string, string> = {
	'left the alternate screen': exitAltScreen,
	'showed the cursor': showCursor,
	'turned mouse tracking off': mouseOff,
	'popped the kitty keyboard protocol': kittyPop,
};

// Names the restorations missing from the output, so a failure says what was left undone.
const missingRestorations = (output: string): string[] =>
	Object.entries(restorations)
		.filter(([, sequence]) => !output.includes(sequence))
		.map(([name]) => name);

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
	test(`${signal} restores the terminal before the process ends (PTY)`, async (t: TestContext) => {
		const ps = term('alternate-screen-restore');
		await ps.ready;

		ps.kill(signal);
		await ps.exited;

		t.assert.deepStrictEqual(missingRestorations(afterReady(ps.output)), []);
	});
}

test('an uncaught error restores the terminal before the process ends (PTY)', async (t: TestContext) => {
	const ps = term('alternate-screen-restore', ['throw']);
	await ps.exited;

	t.assert.deepStrictEqual(missingRestorations(afterReady(ps.output)), []);
	t.assert.ok(ps.output.includes('uncaught boom'));
});

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
