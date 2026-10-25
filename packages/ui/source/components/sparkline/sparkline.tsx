import React from 'react';
import {Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type SparklineProps = {
	/**
	 * Values to draw, one column each, from left to right.
	 *
	 * Non-finite values (NaN, Infinity, -Infinity) count as 0.
	 */
	readonly data: number[];

	/**
	 * Number of trailing values to draw. Earlier values are not drawn.
	 *
	 * @default All values
	 */
	readonly width?: number;
};

const BLOCKS = '▁▂▃▄▅▆▇█';

const toFiniteValue = (value: number): number =>
	Number.isFinite(value) ? value : 0;

// Slice(-width) returns every value when width is 0, so the start index is
// computed from the length instead.
const takeLast = (values: number[], count: number): number[] =>
	values.slice(Math.max(0, values.length - count));

const toBlock = (value: number, min: number, max: number): string => {
	// An equal min and max would divide by zero, so every value takes the lowest block.
	if (min === max) {
		return BLOCKS.charAt(0);
	}

	// Halving each term first keeps the differences finite near Number.MAX_VALUE.
	const fraction = (value / 2 - min / 2) / (max / 2 - min / 2);
	return BLOCKS.charAt(Math.round(fraction * (BLOCKS.length - 1)));
};

const toBlocks = (values: number[]): string => {
	let min = Infinity;
	let max = -Infinity;
	for (const value of values) {
		min = Math.min(min, value);
		max = Math.max(max, value);
	}

	return values.map((value) => toBlock(value, min, max)).join('');
};

export function Sparkline({data, width = data.length}: SparklineProps) {
	const {styles} = useComponentTheme<Theme>('Sparkline');
	const values = takeLast(data, width).map((value) => toFiniteValue(value));

	return values.length === 0 ? null : (
		<Text {...styles.bars()}>{toBlocks(values)}</Text>
	);
}
