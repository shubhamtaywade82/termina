import React from 'react';
import test, {type TestContext} from 'node:test';
import {Text} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import chalk from 'chalk';
import {
	ThemeProvider,
	UnorderedList,
	defaultTheme,
	extendTheme,
} from '../source/index.js';

test('unordered list', (t: TestContext) => {
	const {lastFrame} = render(
		<UnorderedList>
			<UnorderedList.Item>
				<Text>Red</Text>
			</UnorderedList.Item>
			<UnorderedList.Item>
				<Text>Green</Text>
			</UnorderedList.Item>
			<UnorderedList.Item>
				<Text>Yellow</Text>
			</UnorderedList.Item>
		</UnorderedList>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.dim('─')} Red`,
			`${chalk.dim('─')} Green`,
			`${chalk.dim('─')} Yellow`,
		].join('\n'),
	);
});

test('custom marker', (t: TestContext) => {
	const customTheme = extendTheme(defaultTheme, {
		components: {
			UnorderedList: {
				config: () => ({
					marker: '+',
				}),
			},
		},
	});

	const {lastFrame} = render(
		<ThemeProvider theme={customTheme}>
			<UnorderedList>
				<UnorderedList.Item>
					<Text>Red</Text>
				</UnorderedList.Item>
				<UnorderedList.Item>
					<Text>Green</Text>
				</UnorderedList.Item>
				<UnorderedList.Item>
					<Text>Yellow</Text>
				</UnorderedList.Item>
			</UnorderedList>
		</ThemeProvider>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.dim('+')} Red`,
			`${chalk.dim('+')} Green`,
			`${chalk.dim('+')} Yellow`,
		].join('\n'),
	);
});

test('nested list', (t: TestContext) => {
	const {lastFrame} = render(
		<UnorderedList>
			<UnorderedList.Item>
				<Text>Red</Text>
			</UnorderedList.Item>
			<UnorderedList.Item>
				<Text>Green</Text>

				<UnorderedList>
					<UnorderedList.Item>
						<Text>Light</Text>
					</UnorderedList.Item>

					<UnorderedList.Item>
						<Text>Normal</Text>
					</UnorderedList.Item>

					<UnorderedList.Item>
						<Text>Dark</Text>
					</UnorderedList.Item>
				</UnorderedList>
			</UnorderedList.Item>
			<UnorderedList.Item>
				<Text>Yellow</Text>
			</UnorderedList.Item>
		</UnorderedList>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.dim('─')} Red`,
			`${chalk.dim('─')} Green`,
			[
				`${chalk.dim('─')} Light`,
				`${chalk.dim('─')} Normal`,
				`${chalk.dim('─')} Dark`,
			]
				.map(line => `  ${line}`)
				.join('\n'),
			`${chalk.dim('─')} Yellow`,
		].join('\n'),
	);
});

test('custom marker in nested list', (t: TestContext) => {
	const customTheme = extendTheme(defaultTheme, {
		components: {
			UnorderedList: {
				config: () => ({
					marker: '+',
				}),
			},
		},
	});

	const {lastFrame} = render(
		<ThemeProvider theme={customTheme}>
			<UnorderedList>
				<UnorderedList.Item>
					<Text>Red</Text>
				</UnorderedList.Item>
				<UnorderedList.Item>
					<Text>Green</Text>

					<UnorderedList>
						<UnorderedList.Item>
							<Text>Light</Text>
						</UnorderedList.Item>

						<UnorderedList.Item>
							<Text>Normal</Text>
						</UnorderedList.Item>

						<UnorderedList.Item>
							<Text>Dark</Text>
						</UnorderedList.Item>
					</UnorderedList>
				</UnorderedList.Item>
				<UnorderedList.Item>
					<Text>Yellow</Text>
				</UnorderedList.Item>
			</UnorderedList>
		</ThemeProvider>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.dim('+')} Red`,
			`${chalk.dim('+')} Green`,
			[
				`${chalk.dim('+')} Light`,
				`${chalk.dim('+')} Normal`,
				`${chalk.dim('+')} Dark`,
			]
				.map(line => `  ${line}`)
				.join('\n'),
			`${chalk.dim('+')} Yellow`,
		].join('\n'),
	);
});

test('custom markers in nested lists', (t: TestContext) => {
	const customTheme = extendTheme(defaultTheme, {
		components: {
			UnorderedList: {
				config: () => ({
					marker: ['─', '+'],
				}),
			},
		},
	});

	const {lastFrame} = render(
		<ThemeProvider theme={customTheme}>
			<UnorderedList>
				<UnorderedList.Item>
					<Text>Red</Text>
				</UnorderedList.Item>
				<UnorderedList.Item>
					<Text>Green</Text>

					<UnorderedList>
						<UnorderedList.Item>
							<Text>Light</Text>
						</UnorderedList.Item>

						<UnorderedList.Item>
							<Text>Normal</Text>
						</UnorderedList.Item>

						<UnorderedList.Item>
							<Text>Dark</Text>
						</UnorderedList.Item>
					</UnorderedList>
				</UnorderedList.Item>
				<UnorderedList.Item>
					<Text>Yellow</Text>
				</UnorderedList.Item>
			</UnorderedList>
		</ThemeProvider>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.dim('─')} Red`,
			`${chalk.dim('─')} Green`,
			[
				`${chalk.dim('+')} Light`,
				`${chalk.dim('+')} Normal`,
				`${chalk.dim('+')} Dark`,
			]
				.map(line => `  ${line}`)
				.join('\n'),
			`${chalk.dim('─')} Yellow`,
		].join('\n'),
	);
});
