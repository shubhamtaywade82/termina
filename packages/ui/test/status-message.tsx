import React from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import {Box} from '@fork/core';
import chalk from 'chalk';
import figures from 'figures';
import {StatusMessage} from '../source/index.js';

test('success', (t: TestContext) => {
	const {lastFrame} = render(
		<StatusMessage variant="success">Success</StatusMessage>,
	);

	t.assert.strictEqual(lastFrame(), `${chalk.green(figures.tick)} Success`);
});

test('error', (t: TestContext) => {
	const {lastFrame} = render(
		<StatusMessage variant="error">Error</StatusMessage>,
	);

	t.assert.strictEqual(lastFrame(), `${chalk.red(figures.cross)} Error`);
});

test('warning', (t: TestContext) => {
	const {lastFrame} = render(
		<StatusMessage variant="warning">Warning</StatusMessage>,
	);

	t.assert.strictEqual(lastFrame(), `${chalk.yellow(figures.warning)} Warning`);
});

test('info', (t: TestContext) => {
	const {lastFrame} = render(
		<StatusMessage variant="info">Info</StatusMessage>,
	);

	t.assert.strictEqual(lastFrame(), `${chalk.blue(figures.info)} Info`);
});

test('multiline message', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={8}>
			<StatusMessage variant="info">Hello world</StatusMessage>
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[`${chalk.blue(figures.info)} Hello`, '  world'].join('\n'),
	);
});
