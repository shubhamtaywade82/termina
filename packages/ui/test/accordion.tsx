/* eslint-disable no-await-in-loop -- Each step drives the component, and the next step starts only after the last one has rendered. */
import test, {type TestContext} from 'node:test';
import React from 'react';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import figures from 'figures';
import {Text} from '@nemesis-oss/termina-core';
import {
	Accordion,
	type AccordionItem,
} from '../source/components/accordion/index.js';
import {render} from './helpers/render.js';

const down = '\u{1B}[B';
const up = '\u{1B}[A';
const enter = '\r';
const ctrlK = '\u{B}';
const altJ = '\u{1B}j';
const ctrlSpace = '\u{0}';

const items: AccordionItem[] = [
	{id: 'database', title: 'Database', content: <Text>host: localhost</Text>},
	{id: 'api', title: 'API', content: <Text>timeout: 30s</Text>},
	{id: 'deploy', title: 'Deployment', content: <Text>target: staging</Text>},
];

const closedIcon = chalk.dim(figures.triangleRight);
const closedRow = (title: string): string => `${closedIcon} ${title}`;
const focusedClosedRow = (title: string): string =>
	`${closedIcon} ${chalk.blue(title)}`;
const openRow = (title: string): string => `${figures.triangleDown} ${title}`;
const focusedOpenRow = (title: string): string =>
	`${figures.triangleDown} ${chalk.blue(title)}`;
const frame = (...lines: string[]): string => lines.join('\n');
const hostLine = '  host: localhost';
const timeoutLine = '  timeout: 30s';

const initialFrame = frame(
	focusedClosedRow('Database'),
	closedRow('API'),
	closedRow('Deployment'),
);
const apiFocusedFrame = frame(
	closedRow('Database'),
	focusedClosedRow('API'),
	closedRow('Deployment'),
);
const deployFocusedFrame = frame(
	closedRow('Database'),
	closedRow('API'),
	focusedClosedRow('Deployment'),
);
const apiOpenFrame = frame(
	focusedClosedRow('Database'),
	openRow('API'),
	timeoutLine,
	closedRow('Deployment'),
);

const recordChanges = () => {
	const changes: string[][] = [];
	const onChange = (openIds: string[]) => {
		changes.push(openIds);
	};

	return {changes, onChange};
};

// A short pause after each key lets React commit the frame before the next key and the assertions.
const press = async (
	instance: ReturnType<typeof render>,
	keys: string[],
): Promise<void> => {
	for (const key of keys) {
		instance.stdin.write(key);
		await delay(15);
	}

	await delay(20);
};

test('renders every title closed, with the first title focused', (t: TestContext) => {
	const instance = render(<Accordion items={items} />);
	t.assert.strictEqual(instance.lastFrame(), initialFrame);
	instance.unmount();
});

test('defaultOpenIds sections open at mount with content indented, and the first section is focused', (t: TestContext) => {
	const instance = render(<Accordion items={items} defaultOpenIds={['api']} />);
	t.assert.strictEqual(instance.lastFrame(), apiOpenFrame);
	instance.unmount();
});

test('Down moves focus to the next section and stops at the last one', async (t: TestContext) => {
	const instance = render(<Accordion items={items} />);
	await press(instance, [down, down, down, down, down]);
	t.assert.strictEqual(instance.lastFrame(), deployFocusedFrame);
	instance.unmount();
});

test('Up moves focus to the previous section and stops at the first one', async (t: TestContext) => {
	const instance = render(<Accordion items={items} />);
	await press(instance, [down, down, up, up, up]);
	t.assert.strictEqual(instance.lastFrame(), initialFrame);
	instance.unmount();
});

test('j and k move focus the same way as Down and Up', async (t: TestContext) => {
	const instance = render(<Accordion items={items} />);
	await press(instance, ['j', 'j', 'j', 'k']);
	t.assert.strictEqual(instance.lastFrame(), apiFocusedFrame);
	instance.unmount();
});

test('G focuses the last section and g focuses the first one', async (t: TestContext) => {
	const instance = render(<Accordion items={items} />);
	await press(instance, ['G']);
	t.assert.strictEqual(instance.lastFrame(), deployFocusedFrame);
	await press(instance, ['g']);
	t.assert.strictEqual(instance.lastFrame(), initialFrame);
	instance.unmount();
});

test('Enter and Space open and close the focused section and report each open set', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(<Accordion items={items} onChange={onChange} />);
	await press(instance, [enter]);
	t.assert.strictEqual(
		instance.lastFrame(),
		frame(
			focusedOpenRow('Database'),
			hostLine,
			closedRow('API'),
			closedRow('Deployment'),
		),
	);
	await press(instance, [' ']);
	t.assert.strictEqual(instance.lastFrame(), initialFrame);
	t.assert.deepStrictEqual(changes, [['database'], []]);
	instance.unmount();
});

test('in single mode, opening a section closes the one that was open', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(
		<Accordion
			items={items}
			defaultOpenIds={['database']}
			onChange={onChange}
		/>,
	);
	await press(instance, [down, enter]);
	t.assert.strictEqual(
		instance.lastFrame(),
		frame(
			closedRow('Database'),
			focusedOpenRow('API'),
			timeoutLine,
			closedRow('Deployment'),
		),
	);
	t.assert.deepStrictEqual(changes, [['api']]);
	instance.unmount();
});

test('in multiple mode, sections stay open and ids follow the defaults, then the opening order', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(
		<Accordion
			multiple
			items={items}
			defaultOpenIds={['api']}
			onChange={onChange}
		/>,
	);
	await press(instance, [enter, down, down, enter]);
	t.assert.deepStrictEqual(changes, [
		['api', 'database'],
		['api', 'database', 'deploy'],
	]);
	instance.unmount();
});

test('keys outside the keyboard table, including Ctrl and Alt combinations, change nothing', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(<Accordion items={items} onChange={onChange} />);
	await press(instance, [down, ctrlK, altJ, ctrlSpace, 'x']);
	t.assert.strictEqual(instance.lastFrame(), apiFocusedFrame);
	t.assert.deepStrictEqual(changes, []);
	instance.unmount();
});

test('isActive false ignores every key and keeps the focused title colored', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(
		<Accordion items={items} isActive={false} onChange={onChange} />,
	);
	await press(instance, [down, enter, 'G']);
	t.assert.strictEqual(instance.lastFrame(), initialFrame);
	t.assert.deepStrictEqual(changes, []);
	instance.unmount();
});

test('renders its open content under piped stdin and ignores keys instead of throwing', async (t: TestContext) => {
	const instance = render(
		<Accordion items={items} defaultOpenIds={['api']} />,
		{isStdinPiped: true},
	);
	await press(instance, [down, enter]);
	t.assert.strictEqual(instance.lastFrame(), apiOpenFrame);
	instance.unmount();
});

test('changing defaultOpenIds after mount has no effect', async (t: TestContext) => {
	const instance = render(<Accordion items={items} defaultOpenIds={['api']} />);
	instance.rerender(<Accordion items={items} defaultOpenIds={['deploy']} />);
	await delay(20);
	t.assert.strictEqual(instance.lastFrame(), apiOpenFrame);
	instance.unmount();
});

test('onChange is not called at mount or on re-render, and the newest callback gets the next change', async (t: TestContext) => {
	const first = recordChanges();
	const second = recordChanges();
	const instance = render(
		<Accordion items={items} onChange={first.onChange} />,
	);
	instance.rerender(<Accordion items={items} onChange={second.onChange} />);
	await delay(20);
	t.assert.deepStrictEqual([first.changes, second.changes], [[], []]);
	await press(instance, [enter]);
	t.assert.deepStrictEqual(
		[first.changes, second.changes],
		[[], [['database']]],
	);
	instance.unmount();
});

test('single mode leaves defaultOpenIds with several ids open until a section is opened or closed', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(
		<Accordion
			items={items}
			defaultOpenIds={['database', 'api']}
			onChange={onChange}
		/>,
	);
	t.assert.strictEqual(
		instance.lastFrame(),
		frame(
			focusedOpenRow('Database'),
			hostLine,
			openRow('API'),
			timeoutLine,
			closedRow('Deployment'),
		),
	);
	await press(instance, [enter, down, down, enter]);
	t.assert.deepStrictEqual(changes, [['api'], ['deploy']]);
	instance.unmount();
});

test('switching multiple off keeps open sections open until one is toggled', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(
		<Accordion
			multiple
			items={items}
			defaultOpenIds={['database']}
			onChange={onChange}
		/>,
	);
	await press(instance, [down, enter]);
	instance.rerender(<Accordion items={items} onChange={onChange} />);
	await delay(20);
	t.assert.strictEqual(
		instance.lastFrame(),
		frame(
			openRow('Database'),
			hostLine,
			focusedOpenRow('API'),
			timeoutLine,
			closedRow('Deployment'),
		),
	);
	await press(instance, [up, enter]);
	t.assert.deepStrictEqual(changes, [['database', 'api'], ['api']]);
	instance.unmount();
});

test('ids that match no section stay in the open set and onChange reports them', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(
		<Accordion
			multiple
			items={items}
			defaultOpenIds={['ghost']}
			onChange={onChange}
		/>,
	);
	await press(instance, [enter]);
	t.assert.deepStrictEqual(changes, [['ghost', 'database']]);
	instance.unmount();
});

test('in single mode, the next open drops ids that match no section and the id of a removed section', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(
		<Accordion
			items={items}
			defaultOpenIds={['ghost', 'api']}
			onChange={onChange}
		/>,
	);
	instance.rerender(
		<Accordion
			items={items.filter((item) => item.id !== 'api')}
			onChange={onChange}
		/>,
	);
	await press(instance, [enter]);
	t.assert.deepStrictEqual(changes, [['database']]);
	instance.rerender(<Accordion items={items} onChange={onChange} />);
	await delay(20);
	t.assert.strictEqual(
		instance.lastFrame(),
		frame(
			focusedOpenRow('Database'),
			hostLine,
			closedRow('API'),
			closedRow('Deployment'),
		),
	);
	instance.unmount();
});

test('a section removed from items and added back with its id is open again', async (t: TestContext) => {
	const instance = render(<Accordion items={items} defaultOpenIds={['api']} />);
	instance.rerender(
		<Accordion items={items.filter((item) => item.id !== 'api')} />,
	);
	await delay(20);
	t.assert.strictEqual(
		instance.lastFrame(),
		frame(focusedClosedRow('Database'), closedRow('Deployment')),
	);
	instance.rerender(<Accordion items={items} />);
	await delay(20);
	t.assert.strictEqual(instance.lastFrame(), apiOpenFrame);
	instance.unmount();
});

test('focus is shown on the last section when items shrink past the focused one', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(<Accordion items={items} onChange={onChange} />);
	await press(instance, ['G']);
	instance.rerender(
		<Accordion items={items.slice(0, 2)} onChange={onChange} />,
	);
	await delay(20);
	t.assert.strictEqual(
		instance.lastFrame(),
		frame(closedRow('Database'), focusedClosedRow('API')),
	);
	await press(instance, [enter]);
	t.assert.deepStrictEqual(changes, [['api']]);
	instance.unmount();
});

test('empty items render nothing and keys do nothing, keeping focus for when sections arrive', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(<Accordion items={items} onChange={onChange} />);
	await press(instance, ['G']);
	instance.rerender(<Accordion items={[]} onChange={onChange} />);
	await press(instance, [enter, up, 'g']);
	t.assert.strictEqual(instance.lastFrame() ?? '', '');
	t.assert.deepStrictEqual(changes, []);
	instance.rerender(<Accordion items={items} onChange={onChange} />);
	await delay(20);
	t.assert.strictEqual(instance.lastFrame(), deployFocusedFrame);
	await press(instance, [enter]);
	t.assert.deepStrictEqual(changes, [['deploy']]);
	instance.unmount();
});

test('keys sent one event at a time, a macrotask apart, are all applied to the newest state', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(<Accordion items={items} onChange={onChange} />);
	for (const key of ['j', ' ', 'j', 'j']) {
		instance.stdin.write(key);
		await new Promise((resolve) => {
			setImmediate(resolve);
		});
	}

	await delay(20);
	t.assert.strictEqual(
		instance.lastFrame(),
		frame(
			closedRow('Database'),
			openRow('API'),
			timeoutLine,
			focusedClosedRow('Deployment'),
		),
	);
	t.assert.deepStrictEqual(changes, [['api']]);
	instance.unmount();
});

test('draws a string content as text when the section is open', (t: TestContext) => {
	const {lastFrame} = render(
		<Accordion
			items={[{id: 'alpha', title: 'Alpha', content: 'body text'}]}
			defaultOpenIds={['alpha']}
		/>,
	);

	t.assert.ok(stripAnsi(lastFrame() ?? '').includes('body text'));
});
