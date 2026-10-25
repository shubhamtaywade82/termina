import test, {type TestContext} from 'node:test';
import React from 'react';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Box, Text} from '@nemesis-oss/termina-core';
import {JSONViewer} from '../source/components/json-viewer/index.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';
import {render} from './helpers/render.js';

const frameOf = (data: unknown, maxDepth?: number): string => {
	const instance = render(<JSONViewer data={data} maxDepth={maxDepth} />);
	const frame = stripAnsi(instance.lastFrame() ?? '');
	instance.unmount();
	return frame;
};

const key = (name: string) => chalk.cyan(`"${name}"`);
const colon = chalk.dim(': ');
const comma = chalk.dim(',');

const order = {
	id: 'ord_1042',
	status: 'shipped',
	total: 129.95,
	paid: true,
	coupon: null,
	items: [
		{sku: 'KB-75', name: 'Mechanical keyboard', quantity: 1, price: 89.95},
		{sku: 'CABLE-USB-C', name: 'USB-C cable', quantity: 2, price: 20},
	],
	shipping: {carrier: 'UPS', tracking: '1Z999AA10123456784', delivered: false},
};

test('prints JSON-safe data the way JSON.stringify does', (t: TestContext) => {
	const data = {
		name: 'termina',
		tags: ['ui', 'kit'],
		meta: {ok: true, count: 2, nothing: null},
		empty: {},
		none: [],
	};

	t.assert.strictEqual(frameOf(data), JSON.stringify(data, null, 2));
});

test('colors keys, strings, numbers, booleans, null, undefined and punctuation', (t: TestContext) => {
	const {lastFrame, unmount} = render(
		<JSONViewer
			data={{
				text: 'a',
				count: 1,
				flag: true,
				empty: null,
				missing: undefined,
				big: 2n,
			}}
		/>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.dim('{'),
			`  ${key('text')}${colon}${chalk.green('"a"')}${comma}`,
			`  ${key('count')}${colon}${chalk.yellow('1')}${comma}`,
			`  ${key('flag')}${colon}${chalk.magenta('true')}${comma}`,
			`  ${key('empty')}${colon}${chalk.gray('null')}${comma}`,
			`  ${key('missing')}${colon}${chalk.gray('undefined')}${comma}`,
			`  ${key('big')}${colon}${chalk.yellow('2n')}`,
			chalk.dim('}'),
		].join('\n'),
	);
	unmount();
});

test('colors the ..., [Circular], [Function] and Symbol markers as punctuation', (t: TestContext) => {
	function greet() {}
	const node: {self?: unknown} = {};
	node.self = node;
	const {lastFrame, unmount} = render(
		<JSONViewer data={{greet, id: Symbol('job'), node}} />,
	);

	// Ink merges adjacent runs that share a style, so the colon and each marker form one dim run.
	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.dim('{'),
			`  ${key('greet')}${chalk.dim(': [Function greet],')}`,
			`  ${key('id')}${chalk.dim(': Symbol(job),')}`,
			`  ${key('node')}${chalk.dim(': {')}`,
			`    ${key('self')}${chalk.dim(': [Circular]')}`,
			`  ${chalk.dim('}')}`,
			chalk.dim('}'),
		].join('\n'),
	);
	unmount();

	const shallow = render(<JSONViewer data={{a: {b: 1}}} maxDepth={0} />);

	t.assert.strictEqual(
		shallow.lastFrame(),
		[chalk.dim('{'), `  ${key('a')}${chalk.dim(': ...')}`, chalk.dim('}')].join(
			'\n',
		),
	);
	shallow.unmount();
});

test('prints top-level primitives and empty roots', (t: TestContext) => {
	t.assert.strictEqual(frameOf('text'), '"text"');
	t.assert.strictEqual(frameOf(false), 'false');
	t.assert.strictEqual(frameOf(null), 'null');
	t.assert.strictEqual(frameOf(undefined), 'undefined');
	t.assert.strictEqual(frameOf([]), '[]');
	t.assert.strictEqual(frameOf({}), '{}');
});

test('prints a bigint with a trailing n', (t: TestContext) => {
	t.assert.strictEqual(frameOf({total: 12n}), '{\n  "total": 12n\n}');
});

test('prints functions as [Function name] or [Function (anonymous)]', (t: TestContext) => {
	function greet() {}
	const anonymous = (() => () => {})();

	t.assert.strictEqual(frameOf({greet}), '{\n  "greet": [Function greet]\n}');
	t.assert.strictEqual(frameOf(anonymous), '[Function (anonymous)]');
});

test('prints a symbol value as Symbol(description)', (t: TestContext) => {
	t.assert.strictEqual(
		frameOf({id: Symbol('job')}),
		'{\n  "id": Symbol(job)\n}',
	);
});

test('prints a reference back to an ancestor as [Circular]', (t: TestContext) => {
	const node: {name: string; self?: unknown} = {name: 'root'};
	node.self = node;

	t.assert.strictEqual(
		frameOf(node),
		'{\n  "name": "root",\n  "self": [Circular]\n}',
	);
});

test('shows a cycle as [Circular] even where maxDepth would hide it', (t: TestContext) => {
	const child: {back?: unknown} = {};
	const root = {name: 'root', child};
	child.back = root;

	t.assert.strictEqual(
		frameOf(root, 1),
		'{\n  "name": "root",\n  "child": {\n    "back": [Circular]\n  }\n}',
	);
});

test('prints an object referenced twice in full both times when it is not a cycle', (t: TestContext) => {
	const shared = {x: 1};

	t.assert.strictEqual(
		frameOf({a: shared, b: shared}),
		'{\n  "a": {\n    "x": 1\n  },\n  "b": {\n    "x": 1\n  }\n}',
	);
});

test('replaces objects deeper than the default maxDepth of 8 with ...', (t: TestContext) => {
	let nested: unknown = 'leaf';
	for (let level = 0; level < 10; level++) {
		nested = {next: nested};
	}

	const frame = frameOf(nested);

	t.assert.ok(frame.includes('"next": ...'));
	t.assert.strictEqual(frame, frameOf(nested, 8));
	t.assert.notStrictEqual(frame, frameOf(nested, 7));
	t.assert.notStrictEqual(frame, frameOf(nested, 9));
});

test('replaces objects nested deeper than maxDepth with ...', (t: TestContext) => {
	t.assert.strictEqual(
		frameOf({a: {b: {c: 1}}}, 1),
		'{\n  "a": {\n    "b": ...\n  }\n}',
	);
});

test('shows only the top-level keys when maxDepth is 0', (t: TestContext) => {
	t.assert.strictEqual(
		frameOf({a: {b: 1}, c: 2}, 0),
		'{\n  "a": ...,\n  "c": 2\n}',
	);
});

test('replaces an empty container deeper than maxDepth with ... instead of {} or []', (t: TestContext) => {
	t.assert.strictEqual(
		frameOf({a: {b: []}}, 1),
		'{\n  "a": {\n    "b": ...\n  }\n}',
	);
});

test('a negative maxDepth replaces the root container and still prints primitives', (t: TestContext) => {
	t.assert.strictEqual(frameOf({a: 1}, -1), '...');
	t.assert.strictEqual(frameOf('text', -1), '"text"');
});

test('escapes strings and keys the way JSON.stringify does', (t: TestContext) => {
	t.assert.strictEqual(
		frameOf({'two\nlines': 'say "hi"\n'}),
		'{\n  "two\\nlines": "say \\"hi\\"\\n"\n}',
	);
});

test('prints NaN and Infinity by name instead of as null', (t: TestContext) => {
	t.assert.strictEqual(
		frameOf({nan: NaN, up: Infinity, down: -Infinity}),
		'{\n  "nan": NaN,\n  "up": Infinity,\n  "down": -Infinity\n}',
	);
});

test('prints a key whose value is undefined, and an array hole, as undefined', (t: TestContext) => {
	const sparse: unknown[] = [1];
	sparse[2] = 3;

	t.assert.strictEqual(frameOf({gone: undefined}), '{\n  "gone": undefined\n}');
	t.assert.strictEqual(frameOf(sparse), '[\n  1,\n  undefined,\n  3\n]');
});

test('prints only own enumerable string keys, so Date, Map and Set print as {}', (t: TestContext) => {
	t.assert.strictEqual(frameOf(new Date(0)), '{}');
	t.assert.strictEqual(frameOf(new Map([['a', 1]])), '{}');
	t.assert.strictEqual(frameOf(new Set([1])), '{}');
	t.assert.strictEqual(
		frameOf({[Symbol('hidden')]: 1, shown: 2}),
		'{\n  "shown": 2\n}',
	);
});

test('reads colors from a JSONViewer theme override, and undefined uses the null style', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		// The key is the component name, which the theme is looked up by.
		// eslint-disable-next-line @typescript-eslint/naming-convention -- The key is the component name, which the theme is looked up by.
		components: {JSONViewer: {styles: {null: () => ({bold: true})}}},
	});
	const {lastFrame, unmount} = render(
		<ThemeProvider theme={theme}>
			<JSONViewer data={{a: null, b: undefined}} />
		</ThemeProvider>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.dim('{'),
			`  ${key('a')}${colon}${chalk.bold('null')}${comma}`,
			`  ${key('b')}${colon}${chalk.bold('undefined')}`,
			chalk.dim('}'),
		].join('\n'),
	);
	unmount();
});

test('renders with piped stdin because it reads no keyboard input', (t: TestContext) => {
	const {lastFrame, unmount} = render(<JSONViewer data={{ok: true}} />, {
		isStdinPiped: true,
	});

	t.assert.strictEqual(stripAnsi(lastFrame() ?? ''), '{\n  "ok": true\n}');
	unmount();
});

test('ignores keyboard input', async (t: TestContext) => {
	const {lastFrame, stdin, unmount} = render(<JSONViewer data={{ok: true}} />);
	const frameBefore = lastFrame();

	stdin.write('x');
	stdin.write('\u{1B}[B');
	await delay(20);

	t.assert.strictEqual(lastFrame(), frameBefore);
	unmount();
});

test('renders the demo payload under its request line', (t: TestContext) => {
	const caption = 'GET /v1/orders/ord_1042 - 200 OK';
	const {lastFrame, unmount} = render(
		<Box flexDirection="column" gap={1}>
			<Text>{caption}</Text>
			<JSONViewer data={order} />
		</Box>,
	);

	t.assert.strictEqual(
		stripAnsi(lastFrame() ?? ''),
		`${caption}\n\n${JSON.stringify(order, null, 2)}`,
	);
	unmount();
});
