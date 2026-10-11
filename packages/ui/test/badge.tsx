import React from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import chalk from 'chalk';
import {Badge} from '../source/index.js';

test('badge', (t: TestContext) => {
	const {lastFrame} = render(<Badge color="green">Success</Badge>);

	t.assert.strictEqual(lastFrame(), chalk.bgGreen(` ${chalk.black('SUCCESS')} `));
});
