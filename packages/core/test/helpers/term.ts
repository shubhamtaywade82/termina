import process from 'node:process';
import {createRequire} from 'node:module';
import path from 'node:path';
import url from 'node:url';

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const {spawn} = require('node-pty') as typeof import('node-pty');

const fixturesDir = url.fileURLToPath(new URL('../fixtures', import.meta.url));

const term = (fixture: string, args: string[] = []) => {
	const {promise: exitPromise, resolve, reject} = Promise.withResolvers<void>();
	const {promise: readyPromise, resolve: readyResolve} =
		Promise.withResolvers<void>();
	const {promise: exitedPromise, resolve: exitedResolve} =
		Promise.withResolvers<{exitCode: number; signal?: number}>();
	// A test that ends the process by signal awaits `exited`, which settles for every exit, unlike `waitForExit`.
	exitPromise.catch(() => {});

	const env: Record<string, string> = {
		...(process.env as Record<string, string>),
		// eslint-disable-next-line @typescript-eslint/naming-convention
		NODE_NO_WARNINGS: '1',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		CI: 'false',
	};

	const ps = spawn(
		process.execPath,
		['--import=tsx', path.join(fixturesDir, `${fixture}.tsx`), ...args],
		{
			name: 'xterm-color',
			cols: 100,
			cwd: fixturesDir,
			env,
		},
	);

	const result = {
		pid: ps.pid,
		ready: readyPromise,
		exited: exitedPromise,
		kill(signal: string) {
			ps.kill(signal);
		},
		write(input: string) {
			// Wait for the fixture to signal it's ready to accept input

			void readyPromise.then(() => {
				ps.write(input);
			});
		},
		output: '',
		waitForExit: async () => exitPromise,
	};

	ps.onData((data) => {
		result.output += data;

		if (result.output.includes('__READY__')) {
			readyResolve();
		}
	});

	ps.onExit(({exitCode, signal}) => {
		exitedResolve({exitCode, signal});

		if (exitCode === 0) {
			resolve();
			return;
		}

		reject(new Error(`Process exited with non-zero exit code: ${exitCode}`));
	});

	return result;
};

// Runs the fixture as a job of an interactive shell. A process the harness spawns directly shares an orphaned process group with the harness, where the terminal's stop signals are discarded. A shell with job control gives the job its own group, as a command at a prompt has.
export const termAsJob = (fixture: string) => {
	const {promise: readyPromise, resolve: readyResolve} =
		Promise.withResolvers<void>();

	const env: Record<string, string> = {
		...(process.env as Record<string, string>),
		// eslint-disable-next-line @typescript-eslint/naming-convention
		NODE_NO_WARNINGS: '1',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		CI: 'false',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		PS1: 'PROMPT$ ',
	};

	const shell = spawn('bash', ['--norc', '--noprofile', '-i'], {
		name: 'xterm-color',
		cols: 100,
		cwd: fixturesDir,
		env,
	});

	let isStarted = false;
	const result = {
		output: '',
		ready: readyPromise,
		shellPid: shell.pid,
		write(input: string) {
			shell.write(input);
		},
		dispose() {
			shell.kill('SIGKILL');
		},
	};

	shell.onData((data) => {
		result.output += data;

		// Type the command after the first prompt, so it is not lost in startup output.
		if (!isStarted && result.output.includes('PROMPT$')) {
			isStarted = true;
			shell.write(
				`${process.execPath} --import=tsx ${path.join(fixturesDir, `${fixture}.tsx`)}\r`,
			);
		}

		if (result.output.includes('__READY__')) {
			readyResolve();
		}
	});

	return result;
};

export default term;
