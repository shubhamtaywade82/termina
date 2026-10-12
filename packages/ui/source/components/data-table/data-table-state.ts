import {useRef, useState} from 'react';
import {useInput, useStdin, type Key} from '@nemesis-oss/termina-core';
import {type TableColumn, type TableRow} from '../table/index.js';

export type DataTableSortDirection = 'ascending' | 'descending';

export type DataTableSort = {
	readonly key: string;
	readonly direction: DataTableSortDirection;
};

export type DataTableState = {
	// Index into the sorted rows, which can differ from the index in `rows`.
	readonly focusedRow: number;
	readonly scrollTop: number;
	readonly focusedColumn: number;
	readonly sort: DataTableSort | undefined;
};

type Layout = {
	readonly columns: TableColumn[];
	readonly rowCount: number;
	readonly visibleRowCount: number;
};

const INITIAL_STATE: DataTableState = {
	focusedRow: 0,
	scrollTop: 0,
	focusedColumn: 0,
	sort: undefined,
};

// Own keys only, so a column keyed "constructor" does not read Object.prototype.
export const getCellText = (row: TableRow, key: string): string => {
	const value = Object.hasOwn(row, key) ? row[key] : undefined;
	return String(value ?? '');
};

// Blank text is excluded first, because Number('') is 0.
const parseNumber = (text: string): number | undefined => {
	if (text.trim() === '') {
		return undefined;
	}

	const value = Number(text);
	return Number.isFinite(value) ? value : undefined;
};

const compareCells = (left: string, right: string): number => {
	const leftNumber = parseNumber(left);
	const rightNumber = parseNumber(right);

	if (leftNumber !== undefined && rightNumber !== undefined) {
		return leftNumber - rightNumber;
	}

	return left.toLowerCase().localeCompare(right.toLowerCase());
};

// The sign goes on the comparator, not on the sorted result, so equal rows keep their order in both directions.
export const sortRows = (
	rows: TableRow[],
	sort: DataTableSort | undefined,
): TableRow[] => {
	if (sort === undefined) {
		return rows;
	}

	const direction = sort.direction === 'ascending' ? 1 : -1;

	return rows.toSorted(
		(left, right) =>
			direction *
			compareCells(getCellText(left, sort.key), getCellText(right, sort.key)),
	);
};

export const getSortDirection = (
	sort: DataTableSort | undefined,
	key: string,
): DataTableSortDirection | undefined =>
	sort?.key === key ? sort.direction : undefined;

const clamp = (value: number, maxValue: number): number =>
	Math.min(Math.max(value, 0), Math.max(maxValue, 0));

// Rows and columns can shrink after mount, so stored positions are clamped to what exists now.
const clampState = (state: DataTableState, layout: Layout): DataTableState => ({
	...state,
	focusedRow: clamp(state.focusedRow, layout.rowCount - 1),
	scrollTop: clamp(state.scrollTop, layout.rowCount - layout.visibleRowCount),
	focusedColumn: clamp(state.focusedColumn, layout.columns.length - 1),
});

const moveFocusedRow = (
	state: DataTableState,
	step: number,
	layout: Layout,
): DataTableState => {
	const focusedRow = clamp(state.focusedRow + step, layout.rowCount - 1);
	// The window moves only when focus leaves it, so rows stay put while focus moves inside them.
	const scrollTop =
		focusedRow < state.scrollTop
			? focusedRow
			: Math.max(state.scrollTop, focusedRow - layout.visibleRowCount + 1);

	return {...state, focusedRow, scrollTop};
};

const moveFocusedColumn = (
	state: DataTableState,
	step: number,
	layout: Layout,
): DataTableState => ({
	...state,
	focusedColumn: clamp(state.focusedColumn + step, layout.columns.length - 1),
});

const getNextSort = (
	sort: DataTableSort | undefined,
	key: string,
): DataTableSort | undefined => {
	if (sort?.key !== key) {
		return {key, direction: 'ascending'};
	}

	return sort.direction === 'ascending'
		? {key, direction: 'descending'}
		: undefined;
};

const sortByFocusedColumn = (
	state: DataTableState,
	layout: Layout,
): DataTableState => {
	const column = layout.columns.at(state.focusedColumn);

	if (column === undefined) {
		return state;
	}

	return {...state, sort: getNextSort(state.sort, column.key)};
};

const applyKey = (
	state: DataTableState,
	layout: Layout,
	input: string,
	key: Key,
): DataTableState => {
	// Ctrl and Alt chords carry the plain letter as `input`, so Ctrl+s would otherwise sort.
	if (key.ctrl || key.meta) {
		return state;
	}

	if (key.upArrow || key.downArrow) {
		return moveFocusedRow(state, key.downArrow ? 1 : -1, layout);
	}

	if (key.leftArrow || key.rightArrow) {
		return moveFocusedColumn(state, key.rightArrow ? 1 : -1, layout);
	}

	return input === 's' ? sortByFocusedColumn(state, layout) : state;
};

const selectFocusedRow = (
	state: DataTableState,
	rows: TableRow[],
	onSelect?: (row: TableRow) => void,
): void => {
	// toSorted copies the array, not the row objects, so onSelect receives the object from `rows`.
	const row = sortRows(rows, state.sort).at(state.focusedRow);

	if (row !== undefined) {
		onSelect?.(row);
	}
};

export type UseDataTableStateProps = {
	readonly columns: TableColumn[];
	readonly rows: TableRow[];
	readonly visibleRowCount: number;
	readonly isActive: boolean;
	readonly onSelect?: (row: TableRow) => void;
};

export function useDataTableState({columns, rows, visibleRowCount, isActive, onSelect}: UseDataTableStateProps): DataTableState {
	const {isRawModeSupported} = useStdin();
	const [state, setState] = useState(INITIAL_STATE);
	// Key events can outpace renders, so each one reads the newest state, not the one from the last render.
	const latestStateRef = useRef(state);
	const layout: Layout = {columns, rowCount: rows.length, visibleRowCount};

	useInput(
		(input, key) => {
			const current = clampState(latestStateRef.current, layout);

			if (key.return) {
				selectFocusedRow(current, rows, onSelect);
				return;
			}

			const next = applyKey(current, layout, input, key);
			latestStateRef.current = next;
			setState(next);
		},
		{isActive: isActive && isRawModeSupported},
	);

	return clampState(state, layout);
}
