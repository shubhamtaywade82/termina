import React, {type ReactNode} from 'react';
import test, {type TestContext} from 'node:test';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import stringWidth from 'string-width';
import {Box, Text} from '@nemesis-oss/termina-core';
import {
	Accordion,
	CodeBlock,
	DataTable,
	Dialog,
	DiffView,
	Divider,
	Gauge,
	Header,
	JSONViewer,
	KeyHint,
	LogStream,
	Markdown,
	Modal,
	MultiSelect,
	OrderedList,
	ProgressBar,
	Select,
	StatusMessage,
	Stepper,
	Table,
	Tabs,
	TextInput,
	Toast,
	TreeView,
	UnorderedList,
} from '../source/index.js';
import {render} from './helpers/render.js';

// Long text with wide characters and a zero-width joiner sequence, so every width measures a different break.
const LONG = 'The quick brown fox jumps over 漢字テキスト the lazy dog and keeps going far past any narrow terminal';
const WIDTHS = [16, 28, 40];

// Lets the throttled render and the measure-then-fit pass land before the frame is read.
const settle = async () => delay(100);

const widestLine = (frame: string | undefined): number =>
	Math.max(0, ...stripAnsi(frame ?? '').split('\n').map(line => stringWidth(line)));

const cases: Array<[string, (width: number) => ReactNode]> = [
	['Header', () => <Header title={LONG} />],
	['KeyHint', () => <KeyHint keys="Ctrl+Shift+Alt+Enter" label={LONG} />],
	['StatusMessage', () => <StatusMessage variant="error">{LONG}</StatusMessage>],
	['Toast', () => <Toast variant="success">{LONG}</Toast>],
	['Table', () => <Table columns={[{key: 'a', header: 'Name'}, {key: 'b', header: 'Description'}]} rows={[{a: LONG, b: LONG}]} />],
	['DataTable', () => <DataTable columns={[{key: 'a', header: 'Name'}, {key: 'b', header: 'Description'}]} rows={[{a: LONG, b: LONG}]} />],
	['Tabs', () => <Tabs tabs={[{id: 'a', label: LONG, content: <Text>{LONG}</Text>}]} />],
	['Stepper', () => <Stepper steps={[LONG, 'b']} current={0} />],
	['Gauge', () => <Gauge value={52} />],
	['ProgressBar', () => <ProgressBar value={50} />],
	['Divider', () => <Divider title={LONG} />],
	['Select', () => <Select options={[{label: LONG, value: 'a'}, {label: 'b', value: 'b'}]} />],
	['MultiSelect', () => <MultiSelect options={[{label: LONG, value: 'a'}]} />],
	['TextInput', () => <TextInput defaultValue={LONG} />],
	['Markdown', () => <Markdown>{`# ${LONG}\n\n- ${LONG}\n\n1. ${LONG}\n\n\`\`\`\n${LONG}\n\`\`\``}</Markdown>],
	['CodeBlock', () => <CodeBlock code={LONG} language="text" />],
	['DiffView', () => <DiffView patch={`@@ -1 +1 @@\n-${LONG}\n+${LONG}`} />],
	['JSONViewer', () => <JSONViewer data={{key: LONG, list: [LONG]}} />],
	['TreeView', () => <TreeView nodes={[{label: LONG, children: [{label: LONG}]}] as never} />],
	['Accordion', () => <Accordion items={[{title: LONG, content: LONG}] as never} />],
	['OrderedList', () => <OrderedList><OrderedList.Item><Text>{LONG}</Text></OrderedList.Item></OrderedList>],
	['UnorderedList', () => <UnorderedList><UnorderedList.Item><Text>{LONG}</Text></UnorderedList.Item></UnorderedList>],
	['Dialog', () => <Dialog title={LONG} onClose={() => {}}>{LONG}</Dialog>],
	['Modal', () => <Box height={20}><Modal isOpen onClose={() => {}} title={LONG}><Text>{LONG}</Text></Modal></Box>],
	['LogStream', () => <LogStream lines={[LONG, LONG]} height={3} />],
];

for (const [name, make] of cases) {
	test(`${name} keeps every line inside the terminal width`, async (t: TestContext) => {
		for (const width of WIDTHS) {
			const {lastFrame, unmount} = render(make(width) as React.ReactElement, {columns: width});
			// eslint-disable-next-line no-await-in-loop
			await settle();

			t.assert.ok(
				widestLine(lastFrame()) <= width,
				`${name} at ${width} columns is ${widestLine(lastFrame())} wide:\n${lastFrame()}`,
			);
			unmount();
		}
	});
}

test('Table fits its columns to the width and keeps the short ones whole', async (t: TestContext) => {
	const {lastFrame, unmount} = render(
		<Table
			columns={[
				{key: 'name', header: 'Name'},
				{key: 'pid', header: 'PID', align: 'right'},
				{key: 'desc', header: 'Description'},
			]}
			rows={[
				{name: 'nginx', pid: 1234, desc: LONG},
				{name: 'node', pid: 5678, desc: 'short'},
			]}
		/>,
		{columns: 30},
	);
	await settle();

	t.assert.strictEqual(
		stripAnsi(lastFrame() ?? ''),
		[
			'Name    PID  Description',
			'─'.repeat(30),
			'nginx  1234  The quick brown …',
			'node   5678  short',
		].join('\n'),
	);
	unmount();
});

test('DataTable fits its columns to the width and truncates the widest one', async (t: TestContext) => {
	const {lastFrame, unmount} = render(
		<DataTable
			columns={[
				{key: 'name', header: 'Name'},
				{key: 'desc', header: 'Description'},
			]}
			rows={[
				{name: 'b', desc: LONG},
				{name: 'a', desc: 'x'},
			]}
		/>,
		{columns: 24},
	);
	await settle();

	t.assert.strictEqual(
		stripAnsi(lastFrame() ?? ''),
		[
			'Name    Description',
			'─'.repeat(24),
			'b       The quick brown…',
			'a       x',
		].join('\n'),
	);
	unmount();
});

test('an unordered list wraps inside its marker, aligned under the first line', async (t: TestContext) => {
	const {lastFrame, unmount} = render(
		<UnorderedList>
			<UnorderedList.Item>
				<Text>{LONG}</Text>
			</UnorderedList.Item>
			<UnorderedList.Item>
				<Text>short</Text>
			</UnorderedList.Item>
		</UnorderedList>,
		{columns: 22},
	);
	await settle();

	t.assert.strictEqual(
		stripAnsi(lastFrame() ?? ''),
		[
			'─ The quick brown fox',
			'  jumps over',
			'  漢字テキスト the',
			'  lazy dog and keeps',
			'  going far past any',
			'  narrow terminal',
			'─ short',
		].join('\n'),
	);
	unmount();
});

test('a markdown list item wraps inside its marker', async (t: TestContext) => {
	const {lastFrame, unmount} = render(<Markdown>{`- ${LONG}`}</Markdown>, {
		columns: 22,
	});
	await settle();

	t.assert.strictEqual(
		stripAnsi(lastFrame() ?? ''),
		[
			'● The quick brown fox',
			'  jumps over',
			'  漢字テキスト the',
			'  lazy dog and keeps',
			'  going far past any',
			'  narrow terminal',
		].join('\n'),
	);
	unmount();
});
