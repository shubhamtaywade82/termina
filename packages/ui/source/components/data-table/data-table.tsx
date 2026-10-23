import React, {type ReactNode} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import figures from 'figures';
import stringWidth from 'string-width';
import {useComponentTheme} from '../../theme.js';
import {useFittedColumnWidths} from '../../lib/use-fitted-column-widths.js';
import {type TableColumn, type TableRow} from '../table/index.js';
import {
	getCellText,
	getSortDirection,
	sortRows,
	useDataTableState,
	type DataTableSortDirection,
	type DataTableState,
} from './data-table-state.js';
import {type Theme} from './theme.js';

export type DataTableProps = {
	/**
	 * Columns, in display order. Every column can be sorted.
	 */
	readonly columns: TableColumn[];

	/**
	 * Rows, one line each. A row with no value for a column's key shows an empty cell.
	 */
	readonly rows: TableRow[];

	/**
	 * Number of rows shown at once. The header is always shown.
	 *
	 * @default 5
	 */
	readonly visibleRowCount?: number;

	/**
	 * When false, key input is ignored. The table still renders.
	 *
	 * @default true
	 */
	readonly isActive?: boolean;

	/**
	 * Called with the focused row when Enter is pressed. The row is the object from `rows`, even when the table is sorted.
	 */
	readonly onSelect?: (row: TableRow) => void;
};

type Measure = {
	readonly columns: TableColumn[];
	readonly widths: number[];
	readonly tableWidth: number;
};

// Room for the space and arrow that a sorted header adds. Every header reserves it, so sorting never changes a column's width.
const SORT_INDICATOR_WIDTH = stringWidth(` ${figures.arrowUp}`);

// Measures every row, not only the visible ones, so scrolling does not move the columns.
const getColumnWidth = (column: TableColumn, rows: TableRow[]): number => {
	let widest = stringWidth(column.header) + SORT_INDICATOR_WIDTH;

	for (const row of rows) {
		widest = Math.max(widest, stringWidth(getCellText(row, column.key)));
	}

	return widest;
};

const getTableWidth = (widths: number[], gap: number): number => {
	const cellsWidth = widths.reduce((total, width) => total + width, 0);
	// Without the max, a table with no columns would get a negative width, and repeat() throws on it.
	return cellsWidth + gap * Math.max(widths.length - 1, 0);
};

type LineProps = {
	readonly measure: Measure;
	readonly isFocused: boolean;
	readonly cells: ReactNode[];
};

// Each cell is a box sized to its column, so header and body lines line up. The row is the table's width, which fits the container: see `fitColumnWidths`.
function Line({measure, isFocused, cells}: LineProps) {
	const {styles} = useComponentTheme<Theme>('DataTable');

	return (
		<Box {...styles.row({isFocused})} width={measure.tableWidth}>
			{cells.map((cell, index) => (
				<Box
					key={index}
					{...styles.cell()}
					width={measure.widths[index]}
					justifyContent={
						measure.columns[index]?.align === 'right' ? 'flex-end' : 'flex-start'
					}
				>
					{cell}
				</Box>
			))}
		</Box>
	);
}

type HeaderCellProps = {
	readonly label: string;
	readonly isFocused: boolean;
	readonly sortDirection: DataTableSortDirection | undefined;
};

// The indicator is nested in the label's text, so truncating the cell shortens the label and keeps the arrow on the same line.
function HeaderCell({label, isFocused, sortDirection}: HeaderCellProps) {
	const {styles} = useComponentTheme<Theme>('DataTable');
	const glyph =
		sortDirection === 'descending' ? figures.arrowDown : figures.arrowUp;

	return (
		<Text {...styles.headerCell({isFocused})} wrap="truncate-end">
			{label}
			{sortDirection !== undefined && (
				<Text {...styles.sortIndicator()}>{` ${glyph}`}</Text>
			)}
		</Text>
	);
}

function Header({measure, state}: {readonly measure: Measure; readonly state: DataTableState}) {
	const {styles} = useComponentTheme<Theme>('DataTable');

	return (
		<>
			<Line
				measure={measure}
				isFocused={false}
				cells={measure.columns.map((column, index) => (
					<HeaderCell
						label={column.header}
						isFocused={index === state.focusedColumn}
						sortDirection={getSortDirection(state.sort, column.key)}
					/>
				))}
			/>
			{measure.tableWidth > 0 && (
				// A one-row clip, not truncation: an ellipsis would make the rule read as text.
				<Box height={1} overflow="hidden">
					<Text {...styles.separator()}>{'─'.repeat(measure.tableWidth)}</Text>
				</Box>
			)}
		</>
	);
}

type BodyProps = {
	readonly measure: Measure;
	readonly rows: TableRow[];
	readonly state: DataTableState;
	readonly visibleRowCount: number;
};

function Body({measure, rows, state, visibleRowCount}: BodyProps) {
	const firstRowIndex = state.scrollTop;
	const visibleRows = rows.slice(firstRowIndex, firstRowIndex + visibleRowCount);

	return (
		<>
			{visibleRows.map((row, offset) => {
				const rowIndex = firstRowIndex + offset;

				return (
					<Line
						key={rowIndex}
						measure={measure}
						isFocused={rowIndex === state.focusedRow}
						cells={measure.columns.map(column => (
							<Text wrap="truncate-end">{getCellText(row, column.key)}</Text>
						))}
					/>
				);
			})}
		</>
	);
}

export function DataTable({
	columns,
	rows,
	visibleRowCount = 5,
	isActive = true,
	onSelect,
}: DataTableProps) {
	// Below one row the focused row would be hidden, and a fraction makes the slice and the scroll math disagree.
	const windowRowCount = Math.max(Math.floor(visibleRowCount), 1);
	const state = useDataTableState({columns, rows, visibleRowCount: windowRowCount, isActive, onSelect});
	const {styles} = useComponentTheme<Theme>('DataTable');
	const gap = styles.row({isFocused: false}).gap ?? 0;
	// The widest columns shrink until the row fits the container.
	const {ref: containerRef, widths} = useFittedColumnWidths(
		columns.map(column => getColumnWidth(column, rows)),
		gap,
	);
	const measure: Measure = {
		columns,
		widths,
		tableWidth: getTableWidth(widths, gap),
	};

	return (
		<Box ref={containerRef} {...styles.container()}>
			<Header measure={measure} state={state} />
			<Body
				measure={measure}
				rows={sortRows(rows, state.sort)}
				state={state}
				visibleRowCount={windowRowCount}
			/>
		</Box>
	);
}
