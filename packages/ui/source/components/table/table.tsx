import React from 'react';
import {Box, Text, type TextProps} from '@nemesis-oss/termina-core';
import stringWidth from 'string-width';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type TableColumn = {
	/**
	 * Key of the row field shown in this column.
	 */
	readonly key: string;

	/**
	 * Text shown in the header cell.
	 */
	readonly header: string;

	/**
	 * Alignment of the header and the cells in this column.
	 *
	 * @default 'left'
	 */
	readonly align?: 'left' | 'right';
};

export type TableRow = Record<string, string | number>;

export type TableProps = {
	/**
	 * Columns, in display order.
	 */
	readonly columns: TableColumn[];

	/**
	 * Rows, one line each. A row with no value for a column's key shows an empty cell.
	 */
	readonly rows: TableRow[];
};

type TableLineProps = {
	readonly columns: TableColumn[];
	readonly widths: number[];
	readonly values: string[];
	readonly textStyle?: TextProps;
};

const getCellText = (row: TableRow, key: string): string =>
	String(row[key] ?? '');

const getColumnWidth = (column: TableColumn, rows: TableRow[]): number => {
	let widest = stringWidth(column.header);

	for (const row of rows) {
		widest = Math.max(widest, stringWidth(getCellText(row, column.key)));
	}

	return widest;
};

const getRuleWidth = (widths: number[], gap: number): number => {
	const cellsWidth = widths.reduce((total, width) => total + width, 0);
	// Without the max, a table with no columns would ask repeat() for a negative count, which throws.
	return cellsWidth + gap * Math.max(widths.length - 1, 0);
};

function TableLine({columns, widths, values, textStyle}: TableLineProps) {
	const {styles} = useComponentTheme<Theme>('Table');

	return (
		<Box {...styles.row()}>
			{columns.map((column, index) => (
				<Box
					key={index}
					{...styles.cell({align: column.align ?? 'left'})}
					width={widths[index]}
				>
					<Text {...textStyle}>{values[index]}</Text>
				</Box>
			))}
		</Box>
	);
}

export function Table({columns, rows}: TableProps) {
	const {styles} = useComponentTheme<Theme>('Table');
	const widths = columns.map(column => getColumnWidth(column, rows));
	const ruleWidth = getRuleWidth(widths, styles.row().gap ?? 0);

	return (
		<Box {...styles.container()}>
			<TableLine
				columns={columns}
				widths={widths}
				values={columns.map(column => column.header)}
				textStyle={styles.header()}
			/>
			<Box {...styles.cell({align: 'left'})} width={ruleWidth}>
				<Text {...styles.separator()}>{'─'.repeat(ruleWidth)}</Text>
			</Box>
			{rows.map((row, index) => (
				<TableLine
					key={index}
					columns={columns}
					widths={widths}
					values={columns.map(column => getCellText(row, column.key))}
				/>
			))}
		</Box>
	);
}
