import test, {type TestContext} from 'node:test';
import React from 'react';
import chalk from 'chalk';
import {Badge} from '../source/index.js';
import {render} from './helpers/render.js';

test('badge', (t: TestContext) => {
	const {lastFrame} = render(<Badge color="green">Success</Badge>);

	t.assert.strictEqual(
		lastFrame(),
		chalk.bgGreen(` ${chalk.black('SUCCESS')} `),
	);
});
