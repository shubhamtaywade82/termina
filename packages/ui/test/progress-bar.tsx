import React from 'react';
import test, {type TestContext} from 'node:test';
import {Box} from '@fork/core';
import {render} from './helpers/render.js';
import chalk from 'chalk';
import figures from 'figures';
import {ProgressBar} from '../source/index.js';

test('progress bar', (t: TestContext) => {
	const {lastFrame, rerender} = render(
		<Box width={20}>
			<ProgressBar value={0} />
		</Box>,
	);

	t.assert.strictEqual(lastFrame(), chalk.dim(figures.squareLightShade.repeat(20)));

	rerender(
		<Box width={20}>
			<ProgressBar value={50} />
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		chalk.magenta(figures.square.repeat(10)) +
			chalk.dim(figures.squareLightShade.repeat(10)),
	);
});
