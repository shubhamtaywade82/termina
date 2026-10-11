import {spawnSync} from 'node:child_process';
import test, {type TestContext} from 'node:test';

// The detector must pick the same level chalk picks, for every FORCE_COLOR value supports-color understands. Chalk reads the environment at import time, so each case runs in a child process.
const sourceUrl = new URL('../src/terminal-capabilities.ts', import.meta.url).href;
const levelNames = ['none', 'ansi16', 'ansi256', 'truecolor'];

for (const value of ['', '0', 'false', 'true', '1', '2', '3', '9']) {
	test(`FORCE_COLOR='${value}' gives the same color level as chalk`, (t: TestContext) => {
		const source = [
			"import chalk from 'chalk';",
			`import {detectTerminalCapabilities} from ${JSON.stringify(sourceUrl)};`,
			`const detected = detectTerminalCapabilities({FORCE_COLOR: ${JSON.stringify(value)}}, {isTTY: false}).colorLevel;`,
			`process.stdout.write(JSON.stringify({chalk: chalk.level, detected}));`,
		].join('\n');
		const result = spawnSync(process.execPath, ['--import=tsx', '--input-type=module', '-e', source], {
			encoding: 'utf8',
			env: {...process.env, FORCE_COLOR: value},
		});
		t.assert.strictEqual(result.status, 0, result.stderr);
		const {chalk, detected} = JSON.parse(result.stdout) as {chalk: number; detected: string};
		t.assert.strictEqual(detected, levelNames[chalk]);
	});
}
