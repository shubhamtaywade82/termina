import React, {useRef, useState} from 'react';
import {
	Box,
	type Key,
	Text,
	useInput,
	useStdin,
} from '@nemesis-oss/termina-core';
import figures from 'figures';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type TreeViewNode = {
	/** Text shown for the node. Sibling labels should be unique, because expansion is kept by label path. */
	readonly label: string;

	/** Child nodes. A node with at least one child is a branch. An empty array makes a leaf. */
	readonly children?: TreeViewNode[];
};

export type TreeViewProps = {
	/** Tree data, in display order. */
	readonly nodes: TreeViewNode[];

	/**
	 * Whether branches start expanded. Read once at mount, so a later change does not flip branches the user has not toggled.
	 *
	 * @default true
	 */
	readonly defaultExpanded?: boolean;

	/** Called when Enter is pressed on any node. `path` holds the labels from the root to the node, including its own label. */
	readonly onSelect?: (label: string, path: string[]) => void;

	/**
	 * When false, key input is ignored. The tree still renders.
	 *
	 * @default true
	 */
	readonly isActive?: boolean;
};

type TreeViewRow = {
	readonly label: string;
	readonly path: string[];
	readonly guide: string;
	readonly isBranch: boolean;
	readonly isExpanded: boolean;
};

// Stores toggles rather than expansion, so a branch that was never toggled takes the mount-time default when it appears.
type TreeViewState = {focusedIndex: number; toggledKeys: ReadonlySet<string>};

const initialState: TreeViewState = {focusedIndex: 0, toggledKeys: new Set()};

type RowContext = {toggledKeys: ReadonlySet<string>; startsExpanded: boolean};

// Root nodes have no connector, so they add no guide cell for their descendants.
type ParentPosition = {path: string[]; continuation: string};

const guideCellsFor = (isLast: boolean) =>
	isLast
		? {connector: '└ ', continuation: '  '}
		: {connector: '├ ', continuation: '│ '};

const createRow = (
	node: TreeViewNode,
	parent: ParentPosition,
	isLast: boolean,
	context: RowContext,
): TreeViewRow => {
	const path = [...parent.path, node.label];
	// JSON keeps labels that contain a separator from colliding.
	const pathKey = JSON.stringify(path);

	return {
		label: node.label,
		path,
		guide: parent.path.length === 0 ? '' : parent.continuation + guideCellsFor(isLast).connector,
		isBranch: (node.children ?? []).length > 0,
		isExpanded: context.toggledKeys.has(pathKey) !== context.startsExpanded,
	};
};

const collectRows = (
	nodes: readonly TreeViewNode[],
	context: RowContext,
	parent: ParentPosition = {path: [], continuation: ''},
): TreeViewRow[] =>
	nodes.flatMap((node, index) => {
		const isLast = index === nodes.length - 1;
		const row = createRow(node, parent, isLast, context);
		if (!row.isBranch || !row.isExpanded) {
			return [row];
		}

		const isRoot = parent.path.length === 0;
		const {continuation} = guideCellsFor(isLast);
		return [
			row,
			...collectRows(node.children ?? [], context, {
				path: row.path,
				continuation: isRoot ? parent.continuation : parent.continuation + continuation,
			}),
		];
	});

const clampIndex = (index: number, rowCount: number): number =>
	Math.max(0, Math.min(index, rowCount - 1));

const withToggledRow = (
	state: TreeViewState,
	row: TreeViewRow,
): TreeViewState => {
	const pathKey = JSON.stringify(row.path);
	const toggledKeys = new Set(state.toggledKeys);
	if (toggledKeys.has(pathKey)) {
		toggledKeys.delete(pathKey);
	} else {
		toggledKeys.add(pathKey);
	}

	return {...state, toggledKeys};
};

// An expanded branch always has a child, and that child is the row right after it.
const applyRightArrow = (
	state: TreeViewState,
	focusedIndex: number,
	row: TreeViewRow,
): TreeViewState => {
	if (!row.isBranch) {
		return state;
	}

	return row.isExpanded
		? {...state, focusedIndex: focusedIndex + 1}
		: withToggledRow(state, row);
};

// Rows come out depth-first, so the parent is the nearest row above one level shallower.
const applyLeftArrow = (
	state: TreeViewState,
	rows: readonly TreeViewRow[],
	focusedIndex: number,
	row: TreeViewRow,
): TreeViewState => {
	if (row.isBranch && row.isExpanded) {
		return withToggledRow(state, row);
	}

	const parentIndex = rows
		.slice(0, focusedIndex)
		.findLastIndex(candidate => candidate.path.length === row.path.length - 1);

	return parentIndex === -1 ? state : {...state, focusedIndex: parentIndex};
};

const applyKey = (
	state: TreeViewState,
	key: Key,
	rows: readonly TreeViewRow[],
): TreeViewState => {
	const focusedIndex = clampIndex(state.focusedIndex, rows.length);
	const row = rows[focusedIndex];
	if (row === undefined) {
		return state;
	}

	if (key.upArrow) {
		return {...state, focusedIndex: clampIndex(focusedIndex - 1, rows.length)};
	}

	if (key.downArrow) {
		return {...state, focusedIndex: clampIndex(focusedIndex + 1, rows.length)};
	}

	if (key.rightArrow) {
		return applyRightArrow(state, focusedIndex, row);
	}

	if (key.leftArrow) {
		return applyLeftArrow(state, rows, focusedIndex, row);
	}

	return key.return && row.isBranch ? withToggledRow(state, row) : state;
};

const useTreeViewState = (nodes: TreeViewNode[], defaultExpanded: boolean, onSelect: TreeViewProps['onSelect'], isActive: boolean) => {
	const {isRawModeSupported} = useStdin();
	// Read once, so a later change does not flip branches the user has not toggled.
	const [startsExpanded] = useState(defaultExpanded);
	const [state, setState] = useState(initialState);
	// Keys pressed before a render must build on the newest state, not on the state from the last render.
	const latestStateRef = useRef(state);

	useInput(
		(_input, key) => {
			const current = latestStateRef.current;
			const keyRows = collectRows(nodes, {toggledKeys: current.toggledKeys, startsExpanded});
			const focusedRow = keyRows[clampIndex(current.focusedIndex, keyRows.length)];
			if (key.return && focusedRow) {
				onSelect?.(focusedRow.label, focusedRow.path);
			}

			latestStateRef.current = applyKey(current, key, keyRows);
			setState(latestStateRef.current);
		},
		{isActive: isActive && isRawModeSupported},
	);

	const rows = collectRows(nodes, {toggledKeys: state.toggledKeys, startsExpanded});
	return {rows, focusedIndex: clampIndex(state.focusedIndex, rows.length)};
};

type TreeViewLineProps = {
	readonly row: TreeViewRow;
	readonly isFocused: boolean;
};

function TreeViewLine({row, isFocused}: TreeViewLineProps) {
	const {styles} = useComponentTheme<Theme>('TreeView');
	const nodeStyle = styles.node({isFocused});
	// Leaf styles go under node styles, so an unfocused leaf can differ from a branch and focus still wins.
	const labelStyle = row.isBranch ? nodeStyle : {...styles.leaf(), ...nodeStyle};
	const glyph = row.isExpanded ? figures.triangleDown : figures.triangleRight;

	return (
		<Text>
			<Text {...styles.guide()}>{row.guide}</Text>
			{row.isBranch ? (
				<Text {...styles.branch({isExpanded: row.isExpanded})}>{`${glyph} `}</Text>
			) : '  '}
			<Text {...labelStyle}>{row.label}</Text>
		</Text>
	);
}

export function TreeView({
	nodes,
	defaultExpanded = true,
	onSelect,
	isActive = true,
}: TreeViewProps) {
	const {rows, focusedIndex} = useTreeViewState(
		nodes,
		defaultExpanded,
		onSelect,
		isActive,
	);
	const {styles} = useComponentTheme<Theme>('TreeView');

	// Rows hold no state, and two siblings can share a path, so the position is the key.
	return (
		<Box {...styles.container()}>
			{rows.map((row, index) => (
				<TreeViewLine
					key={index}
					row={row}
					isFocused={index === focusedIndex}
				/>
			))}
		</Box>
	);
}
