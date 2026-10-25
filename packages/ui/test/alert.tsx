import test, {type TestContext} from 'node:test';
import React from 'react';
import {Box} from '@nemesis-oss/termina-core';
import chalk from 'chalk';
import figures from 'figures';
import boxen from 'boxen';
import {Alert} from '../source/index.js';
import {render} from './helpers/render.js';

test('success', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={16}>
			<Alert variant="success" title="Success">
				Message
			</Alert>
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		boxen(
			[
				`${chalk.green(figures.tick)} ${chalk.bold('Success')}`,
				'',
				'  Message',
			].join('\n'),
			{
				borderColor: 'green',
				borderStyle: 'round',
				width: 16,
				padding: {
					left: 1,
					right: 1,
				},
			},
		),
	);
});

test('error', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={16}>
			<Alert variant="error" title="Error">
				Message
			</Alert>
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		boxen(
			[
				`${chalk.red(figures.cross)} ${chalk.bold('Error')}`,
				'',
				'  Message',
			].join('\n'),
			{
				borderColor: 'red',
				borderStyle: 'round',
				width: 16,
				padding: {
					left: 1,
					right: 1,
				},
			},
		),
	);
});

test('warning', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={16}>
			<Alert variant="warning" title="Warning">
				Message
			</Alert>
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		boxen(
			[
				`${chalk.yellow(figures.warning)} ${chalk.bold('Warning')}`,
				'',
				'  Message',
			].join('\n'),
			{
				borderColor: 'yellow',
				borderStyle: 'round',
				width: 16,
				padding: {
					left: 1,
					right: 1,
				},
			},
		),
	);
});

test('info', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={16}>
			<Alert variant="info" title="Info">
				Message
			</Alert>
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		boxen(
			[
				`${chalk.blue(figures.info)} ${chalk.bold('Info')}`,
				'',
				'  Message',
			].join('\n'),
			{
				borderColor: 'blue',
				borderStyle: 'round',
				width: 16,
				padding: {
					left: 1,
					right: 1,
				},
			},
		),
	);
});
