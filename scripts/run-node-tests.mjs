// Runs the Node test runner for one package with a fixed environment. The package scripts used `env -u ...` for this, and Windows shells do not have `env`, so the environment is set here instead.
// Usage: node ../../scripts/run-node-tests.mjs "test/*.{ts,tsx}"

import {spawnSync} from 'node:child_process';
import process from 'node:process';

// Suites under a posix/ directory need signals, job control or ps, so Windows does not run them.
const patterns = process.argv
	.slice(2)
	.filter(pattern => process.platform !== 'win32' || !pattern.includes('/posix/'));

if (patterns.length === 0) {
	console.error('Usage: node scripts/run-node-tests.mjs <glob>...');
	process.exit(2);
}

// CI and NO_COLOR would change what the terminal fixtures print, so they are removed. TERM and FORCE_COLOR are fixed so the output matches on every platform.
const env = {...process.env, TERM: 'xterm', FORCE_COLOR: 'true'};
delete env.CI;
delete env.CONTINUOUS_INTEGRATION;
delete env.NO_COLOR;

const result = spawnSync(
	process.execPath,
	['--import=tsx', '--test', '--test-concurrency=1', ...patterns],
	{stdio: 'inherit', env},
);

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

process.exit(result.status ?? 1);
