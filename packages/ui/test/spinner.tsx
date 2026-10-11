import process from 'node:process';
import React from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import chalk from 'chalk';
import spinners from 'cli-spinners';
import delay from 'delay';
import {Spinner} from '../source/index.js';

test('spinner', async (t: TestContext) => {
	const {frames, unmount} = render(<Spinner label="Loading" />);

	const spinner = spinners.dots;
	await delay(spinner.frames.length * spinner.interval);
	unmount();

	const uniqueFrames = [...new Set(frames)];

	if (process.env['CI'] && uniqueFrames.at(-1) === '\n') {
		uniqueFrames.pop();
	}

	t.assert.deepStrictEqual(
		uniqueFrames,
		spinner.frames.map(frame => `${chalk.blue(frame)} Loading`),
	);
});
