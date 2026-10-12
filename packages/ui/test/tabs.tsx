import React, {useState} from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Text} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import {Tabs, type TabsItem} from '../source/components/tabs/index.js';

const right = '\u001B[C';
const left = '\u001B[D';
const down = '\u001B[B';
const enter = '\r';

const active = (label: string) => chalk.bold(chalk.blue(label));

const recordChanges = () => {
	const changes: string[] = [];
	const onChange = (id: string) => {
		changes.push(id);
	};

	return {changes, onChange};
};

const tabs: TabsItem[] = [
	{id: 'files', label: 'Files', content: <Text>src/index.ts</Text>},
	{id: 'logs', label: 'Logs', content: <Text>No errors in the last hour</Text>},
	{id: 'config', label: 'Config', content: <Text>theme: dark</Text>},
];

test('shows the tab bar with the first tab active, and only its content', async (t: TestContext) => {
	const {lastFrame} = render(<Tabs tabs={tabs} />);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`${active('Files')}  Logs  Config`, 'src/index.ts'].join('\n'),
	);
});

test('right arrow activates the next tab and shows its content', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<Tabs tabs={tabs} />);
	await delay(20);
	stdin.write(right);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`Files  ${active('Logs')}  Config`, 'No errors in the last hour'].join('\n'),
	);
});

test('left arrow activates the previous tab and reports each change to onChange', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const {lastFrame, stdin} = render(<Tabs tabs={tabs} onChange={onChange} />);
	await delay(20);
	stdin.write(right);
	await delay(20);
	stdin.write(right);
	await delay(20);
	stdin.write(left);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`Files  ${active('Logs')}  Config`, 'No errors in the last hour'].join('\n'),
	);
	t.assert.deepStrictEqual(changes, ['logs', 'config', 'logs']);
});

test('left arrow on the first tab changes nothing and does not wrap', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const {lastFrame, stdin} = render(<Tabs tabs={tabs} onChange={onChange} />);
	await delay(20);
	stdin.write(left);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`${active('Files')}  Logs  Config`, 'src/index.ts'].join('\n'),
	);
	t.assert.deepStrictEqual(changes, []);
});

test('right arrow on the last tab changes nothing and does not wrap', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const {lastFrame, stdin} = render(<Tabs tabs={tabs} onChange={onChange} />);
	await delay(20);
	stdin.write(right);
	await delay(20);
	stdin.write(right);
	await delay(20);
	stdin.write(right);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`Files  Logs  ${active('Config')}`, 'theme: dark'].join('\n'),
	);
	t.assert.deepStrictEqual(changes, ['logs', 'config']);
});

test('two key presses in one input chunk each move the tab', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const {lastFrame, stdin} = render(<Tabs tabs={tabs} onChange={onChange} />);
	await delay(20);
	stdin.write(right + right);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`Files  Logs  ${active('Config')}`, 'theme: dark'].join('\n'),
	);
	t.assert.deepStrictEqual(changes, ['logs', 'config']);
});

test('defaultTabId selects the tab active at mount', (t: TestContext) => {
	const {lastFrame} = render(<Tabs tabs={tabs} defaultTabId="config" />);

	t.assert.strictEqual(
		lastFrame(),
		[`Files  Logs  ${active('Config')}`, 'theme: dark'].join('\n'),
	);
});

test('an unknown defaultTabId activates the first tab', (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const {lastFrame} = render(
		<Tabs tabs={tabs} defaultTabId="missing" onChange={onChange} />,
	);

	t.assert.strictEqual(
		lastFrame(),
		[`${active('Files')}  Logs  Config`, 'src/index.ts'].join('\n'),
	);
	t.assert.deepStrictEqual(changes, []);
});

test('defaultTabId is read once at mount, and rendering does not call onChange', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(
		<Tabs tabs={tabs} defaultTabId="logs" onChange={onChange} />,
	);
	await delay(20);
	instance.rerender(
		<Tabs tabs={tabs} defaultTabId="config" onChange={onChange} />,
	);
	await delay(20);

	t.assert.strictEqual(
		instance.lastFrame(),
		[`Files  ${active('Logs')}  Config`, 'No errors in the last hour'].join('\n'),
	);
	t.assert.deepStrictEqual(changes, []);
});

test('keys other than Left and Right are ignored', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const {lastFrame, stdin} = render(<Tabs tabs={tabs} onChange={onChange} />);
	await delay(20);
	stdin.write(enter);
	await delay(20);
	stdin.write(down);
	await delay(20);
	stdin.write('x');
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`${active('Files')}  Logs  Config`, 'src/index.ts'].join('\n'),
	);
	t.assert.deepStrictEqual(changes, []);
});

test('isActive false ignores Left and Right and still renders the active content', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const {lastFrame, stdin} = render(
		<Tabs tabs={tabs} defaultTabId="logs" isActive={false} onChange={onChange} />,
	);
	await delay(20);
	stdin.write(right);
	await delay(20);
	stdin.write(left);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`Files  ${active('Logs')}  Config`, 'No errors in the last hour'].join('\n'),
	);
	t.assert.deepStrictEqual(changes, []);
});

test('each tab mounts its own content, so leaving a tab discards its state', async (t: TestContext) => {
	let mountCount = 0;
	const MountNumber = () => {
		const [mountNumber] = useState(() => {
			mountCount += 1;
			return mountCount;
		});

		return <Text>mount {mountNumber}</Text>;
	};
	const sameComponentTabs: TabsItem[] = [
		{id: 'first', label: 'First', content: <MountNumber />},
		{id: 'second', label: 'Second', content: <MountNumber />},
	];
	const {lastFrame, stdin} = render(<Tabs tabs={sameComponentTabs} />);
	await delay(20);
	t.assert.strictEqual(lastFrame(), [`${active('First')}  Second`, 'mount 1'].join('\n'));

	stdin.write(right);
	await delay(20);
	t.assert.strictEqual(lastFrame(), [`First  ${active('Second')}`, 'mount 2'].join('\n'));

	stdin.write(left);
	await delay(20);
	t.assert.strictEqual(lastFrame(), [`${active('First')}  Second`, 'mount 3'].join('\n'));
});

test('content with several elements stacks them vertically', (t: TestContext) => {
	const stackedTabs: TabsItem[] = [
		{
			id: 'notes',
			label: 'Notes',
			content: (
				<>
					<Text>first line</Text>
					<Text>second line</Text>
				</>
			),
		},
	];
	const {lastFrame} = render(<Tabs tabs={stackedTabs} />);

	t.assert.strictEqual(
		lastFrame(),
		[active('Notes'), 'first line', 'second line'].join('\n'),
	);
});

test('with no tabs, nothing renders and keys have no effect', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const {lastFrame, stdin} = render(<Tabs tabs={[]} onChange={onChange} />);
	await delay(20);
	stdin.write(right);
	await delay(20);

	t.assert.strictEqual(lastFrame(), '');
	t.assert.deepStrictEqual(changes, []);
});

test('removing the active tab shows the first tab and does not call onChange', async (t: TestContext) => {
	const {changes, onChange} = recordChanges();
	const instance = render(
		<Tabs tabs={tabs} defaultTabId="logs" onChange={onChange} />,
	);
	await delay(20);
	instance.rerender(
		<Tabs
			tabs={tabs.filter(tab => tab.id !== 'logs')}
			defaultTabId="logs"
			onChange={onChange}
		/>,
	);
	await delay(20);

	t.assert.strictEqual(
		instance.lastFrame(),
		[`${active('Files')}  Config`, 'src/index.ts'].join('\n'),
	);
	t.assert.deepStrictEqual(changes, []);
});

test('reordering tabs keeps the same tab active', async (t: TestContext) => {
	const {lastFrame, stdin, rerender} = render(<Tabs tabs={tabs} />);
	await delay(20);
	stdin.write(right);
	await delay(20);
	rerender(<Tabs tabs={[...tabs].reverse()} />);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`Config  ${active('Logs')}  Files`, 'No errors in the last hour'].join('\n'),
	);
});

test('renders the active content when stdin is piped', async (t: TestContext) => {
	const {lastFrame} = render(<Tabs tabs={tabs} />, {isStdinPiped: true});
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[`${active('Files')}  Logs  Config`, 'src/index.ts'].join('\n'),
	);
});

test('draws a string content as text in the active panel', (t: TestContext) => {
	const {lastFrame} = render(
		<Tabs tabs={[{id: 'one', label: 'One', content: 'body text'}]} />,
	);

	t.assert.ok(stripAnsi(lastFrame() ?? '').includes('body text'));
});
