/* eslint-disable no-await-in-loop */
import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import figures from 'figures';
import {render} from './helpers/render.js';
import {
	TreeView,
	type TreeViewNode,
} from '../source/components/tree-view/index.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';

const down = '\u001B[B';
const up = '\u001B[A';
const right = '\u001B[C';
const left = '\u001B[D';
const enter = '\r';

const tree: TreeViewNode[] = [
	{
		label: 'src',
		children: [
			{
				label: 'components',
				children: [{label: 'Button.tsx'}, {label: 'Input.tsx'}],
			},
			{label: 'index.ts'},
		],
	},
	{
		label: 'docs',
		children: [{label: 'guides', children: [{label: 'intro.md'}]}],
	},
	{label: 'package.json'},
];

type Instance = ReturnType<typeof render>;

const guide = (text: string): string => chalk.dim(text);

const labelText = (text: string, isFocused: boolean): string =>
	isFocused ? chalk.blue(text) : text;

const leafLine = (guideText: string, text: string, isFocused = false): string =>
	`${guide(guideText)}  ${labelText(text, isFocused)}`;

const branchLine = (
	guideText: string,
	text: string,
	{isExpanded, isFocused = false}: {isExpanded: boolean; isFocused?: boolean},
): string => {
	const triangle = `${isExpanded ? figures.triangleDown : figures.triangleRight} `;
	if (isExpanded) {
		return `${guide(guideText)}${triangle}${labelText(text, isFocused)}`;
	}

	// A collapsed triangle is dimmed like the guide, so Ink writes both as one dimmed run.
	return `${chalk.dim(`${guideText}${triangle}`)}${labelText(text, isFocused)}`;
};

const frame = (lines: string[]): string => lines.join('\n');

const fullTreeLines = (focusedIndex: number): string[] => [
	branchLine('', 'src', {isExpanded: true, isFocused: focusedIndex === 0}),
	branchLine('├ ', 'components', {
		isExpanded: true,
		isFocused: focusedIndex === 1,
	}),
	leafLine('│ ├ ', 'Button.tsx', focusedIndex === 2),
	leafLine('│ └ ', 'Input.tsx', focusedIndex === 3),
	leafLine('└ ', 'index.ts', focusedIndex === 4),
	branchLine('', 'docs', {isExpanded: true, isFocused: focusedIndex === 5}),
	branchLine('└ ', 'guides', {isExpanded: true, isFocused: focusedIndex === 6}),
	leafLine('  └ ', 'intro.md', focusedIndex === 7),
	leafLine('', 'package.json', focusedIndex === 8),
];

const collapsedLines = [
	branchLine('', 'src', {isExpanded: false, isFocused: true}),
	branchLine('', 'docs', {isExpanded: false}),
	leafLine('', 'package.json'),
];

const componentsCollapsedLines = [
	branchLine('', 'src', {isExpanded: true}),
	branchLine('├ ', 'components', {isExpanded: false, isFocused: true}),
	leafLine('└ ', 'index.ts'),
	branchLine('', 'docs', {isExpanded: true}),
	branchLine('└ ', 'guides', {isExpanded: true}),
	leafLine('  └ ', 'intro.md'),
	leafLine('', 'package.json'),
];

// A short pause before the first key lets the component attach its key listener.
const press = async (instance: Instance, keys: string[]): Promise<void> => {
	await delay(20);
	for (const key of keys) {
		instance.stdin.write(key);
		await delay(15);
	}

	await delay(20);
};

const recordSelections = () => {
	const selections: Array<[string, string[]]> = [];
	const onSelect = (label: string, path: string[]) => {
		selections.push([label, path]);
	};

	return {selections, onSelect};
};

test('renders every branch expanded, with the first row focused', (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(0)));
	instance.unmount();
});

test('defaultExpanded={false} starts every branch collapsed', (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} defaultExpanded={false} />);

	t.assert.strictEqual(instance.lastFrame(), frame(collapsedLines));
	instance.unmount();
});

test('Down moves focus to the next visible row', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [down]);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(1)));
	instance.unmount();
});

test('Up and Down stop at the first and last rows instead of wrapping', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [up]);
	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(0)));

	await press(instance, Array(9).fill(down));
	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(8)));
	instance.unmount();
});

test('Right expands a collapsed branch and keeps focus on it', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} defaultExpanded={false} />);
	await press(instance, [right]);

	t.assert.strictEqual(
		instance.lastFrame(),
		frame([
			branchLine('', 'src', {isExpanded: true, isFocused: true}),
			branchLine('├ ', 'components', {isExpanded: false}),
			leafLine('└ ', 'index.ts'),
			branchLine('', 'docs', {isExpanded: false}),
			leafLine('', 'package.json'),
		]),
	);
	instance.unmount();
});

test('Right on an expanded branch moves focus to its first child', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [right]);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(1)));
	instance.unmount();
});

test('Right on a leaf does nothing', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [down, down, right]);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(2)));
	instance.unmount();
});

test('Left collapses an expanded branch and keeps focus on it', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [down, left]);

	t.assert.strictEqual(instance.lastFrame(), frame(componentsCollapsedLines));
	instance.unmount();
});

test('Left on a collapsed branch moves focus to its parent', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [down, left, left]);

	t.assert.strictEqual(
		instance.lastFrame(),
		frame([
			branchLine('', 'src', {isExpanded: true, isFocused: true}),
			branchLine('├ ', 'components', {isExpanded: false}),
			leafLine('└ ', 'index.ts'),
			branchLine('', 'docs', {isExpanded: true}),
			branchLine('└ ', 'guides', {isExpanded: true}),
			leafLine('  └ ', 'intro.md'),
			leafLine('', 'package.json'),
		]),
	);
	instance.unmount();
});

test('Left on a leaf moves focus to its parent branch', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [down, down, left]);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(1)));
	instance.unmount();
});

test('Left on a leaf moves focus to a parent further up the tree', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [down, down, down, down, left]);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(0)));
	instance.unmount();
});

test('Left on a top-level branch that is collapsed does nothing', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} defaultExpanded={false} />);
	await press(instance, [left]);

	t.assert.strictEqual(instance.lastFrame(), frame(collapsedLines));
	instance.unmount();
});

test('Left on a top-level leaf does nothing', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [...Array(8).fill(down), left]);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(8)));
	instance.unmount();
});

test('Enter toggles a branch and reports it on every press', async (t: TestContext) => {
	const {selections, onSelect} = recordSelections();
	const instance = render(<TreeView nodes={tree} onSelect={onSelect} />);
	await press(instance, [down, enter]);

	t.assert.strictEqual(instance.lastFrame(), frame(componentsCollapsedLines));
	t.assert.deepStrictEqual(selections, [['components', ['src', 'components']]]);

	await press(instance, [enter]);
	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(1)));
	t.assert.deepStrictEqual(selections, [
		['components', ['src', 'components']],
		['components', ['src', 'components']],
	]);
	instance.unmount();
});

test('Enter toggles a branch when onSelect is not given', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [down, enter]);

	t.assert.strictEqual(instance.lastFrame(), frame(componentsCollapsedLines));
	instance.unmount();
});

test('Enter on a leaf reports it and leaves the tree unchanged', async (t: TestContext) => {
	const {selections, onSelect} = recordSelections();
	const instance = render(<TreeView nodes={tree} onSelect={onSelect} />);
	await press(instance, [down, down, enter]);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(2)));
	t.assert.deepStrictEqual(selections, [
		['Button.tsx', ['src', 'components', 'Button.tsx']],
	]);
	instance.unmount();
});

test('arrow keys never call onSelect', async (t: TestContext) => {
	const {selections, onSelect} = recordSelections();
	const instance = render(<TreeView nodes={tree} onSelect={onSelect} />);
	await press(instance, [down, up, right, left]);

	t.assert.deepStrictEqual(selections, []);
	instance.unmount();
});

test('any other key is ignored', async (t: TestContext) => {
	const {selections, onSelect} = recordSelections();
	const instance = render(<TreeView nodes={tree} onSelect={onSelect} />);
	await press(instance, ['x', '\u001B']);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(0)));
	t.assert.deepStrictEqual(selections, []);
	instance.unmount();
});

test('isActive={false} ignores keys and still shows the tree with focus', async (t: TestContext) => {
	const {selections, onSelect} = recordSelections();
	const instance = render(
		<TreeView nodes={tree} isActive={false} onSelect={onSelect} />,
	);
	await press(instance, [down, enter]);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(0)));
	t.assert.deepStrictEqual(selections, []);
	instance.unmount();
});

test('renders under piped stdin, where key input is not read', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />, {isStdinPiped: true});
	await press(instance, [down]);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(0)));
	instance.unmount();
});

test('renders nothing for empty nodes, and keys do nothing', async (t: TestContext) => {
	const {selections, onSelect} = recordSelections();
	const instance = render(<TreeView nodes={[]} onSelect={onSelect} />);
	await press(instance, [down, enter]);

	t.assert.strictEqual(instance.lastFrame(), '');
	t.assert.deepStrictEqual(selections, []);
	instance.unmount();
});

test('a branch with an empty children array renders as a leaf', async (t: TestContext) => {
	const {selections, onSelect} = recordSelections();
	const instance = render(
		<TreeView
			nodes={[{label: 'notes', children: []}, {label: 'todo'}]}
			onSelect={onSelect}
		/>,
	);
	await press(instance, [right, enter]);

	t.assert.strictEqual(
		instance.lastFrame(),
		frame([leafLine('', 'notes', true), leafLine('', 'todo')]),
	);
	t.assert.deepStrictEqual(selections, [['notes', ['notes']]]);
	instance.unmount();
});

test('defaultExpanded is read once, so a later change does not flip branches', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} defaultExpanded={false} />);
	instance.rerender(<TreeView nodes={tree} defaultExpanded />);
	await delay(20);

	t.assert.strictEqual(instance.lastFrame(), frame(collapsedLines));
	instance.unmount();
});

test('a branch added after mount starts with the mount-time default', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} defaultExpanded={false} />);
	instance.rerender(
		<TreeView
			nodes={[...tree, {label: 'extras', children: [{label: 'todo.md'}]}]}
			defaultExpanded
		/>,
	);
	await delay(20);

	t.assert.strictEqual(
		instance.lastFrame(),
		frame([...collapsedLines, branchLine('', 'extras', {isExpanded: false})]),
	);
	instance.unmount();
});

test('expansion survives a rerender that keeps the same label paths', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, [down, left]);
	instance.rerender(<TreeView nodes={structuredClone(tree)} />);
	await delay(20);

	t.assert.strictEqual(instance.lastFrame(), frame(componentsCollapsedLines));
	instance.unmount();
});

test('focus moves to the last row when nodes shrink past it', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await press(instance, Array(8).fill(down));
	instance.rerender(<TreeView nodes={tree.slice(0, 1)} />);
	await delay(20);

	t.assert.strictEqual(
		instance.lastFrame(),
		frame([
			branchLine('', 'src', {isExpanded: true}),
			branchLine('├ ', 'components', {isExpanded: true}),
			leafLine('│ ├ ', 'Button.tsx'),
			leafLine('│ └ ', 'Input.tsx'),
			leafLine('└ ', 'index.ts', true),
		]),
	);
	instance.unmount();
});

test('sibling nodes with the same label expand and collapse together', async (t: TestContext) => {
	const duplicates: TreeViewNode[] = [
		{label: 'notes', children: [{label: 'a.md'}]},
		{label: 'notes', children: [{label: 'b.md'}]},
	];
	const instance = render(<TreeView nodes={duplicates} />);
	await press(instance, [enter]);

	t.assert.strictEqual(
		instance.lastFrame(),
		frame([
			branchLine('', 'notes', {isExpanded: false, isFocused: true}),
			branchLine('', 'notes', {isExpanded: false}),
		]),
	);
	instance.unmount();
});

test('a leaf() style colors leaf labels, and the focus color wins on the focused leaf', async (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {TreeView: {styles: {leaf: () => ({color: 'green'})}}},
	});
	const greenLeaf = (guideText: string, text: string) =>
		`${guide(guideText)}  ${chalk.green(text)}`;
	const instance = render(
		<ThemeProvider theme={theme}>
			<TreeView nodes={tree} />
		</ThemeProvider>,
	);
	await press(instance, [down, down]);

	t.assert.strictEqual(
		instance.lastFrame(),
		frame([
			branchLine('', 'src', {isExpanded: true}),
			branchLine('├ ', 'components', {isExpanded: true}),
			leafLine('│ ├ ', 'Button.tsx', true),
			greenLeaf('│ └ ', 'Input.tsx'),
			greenLeaf('└ ', 'index.ts'),
			branchLine('', 'docs', {isExpanded: true}),
			branchLine('└ ', 'guides', {isExpanded: true}),
			greenLeaf('  └ ', 'intro.md'),
			greenLeaf('', 'package.json'),
		]),
	);
	instance.unmount();
});

test('keys sent back to back each move focus, without waiting for a render', async (t: TestContext) => {
	const instance = render(<TreeView nodes={tree} />);
	await delay(20);
	instance.stdin.write(down);
	instance.stdin.write(down);
	await delay(30);

	t.assert.strictEqual(instance.lastFrame(), frame(fullTreeLines(2)));
	instance.unmount();
});
