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

// slice(-width) returns every value when width is 0, so the start index is
// computed from the length instead.
const takeLast = (values: number[], count: number): number[] =>
	values.slice(Math.max(0, values.length - count));

const toBlock = (value: number, min: number, range: number): string => {
	// A zero range would divide by zero, so every value takes the lowest block.
	if (range === 0) {
		return BLOCKS.charAt(0);
	}

	const level = Math.round(((value - min) * (BLOCKS.length - 1)) / range);
	return BLOCKS.charAt(level);
};

const toBlocks = (values: number[]): string => {
	const min = values.reduce((lowest, value) => Math.min(lowest, value));
	const max = values.reduce((highest, value) => Math.max(highest, value));

	return values.map(value => toBlock(value, min, max - min)).join('');
};

export function Sparkline({data, width = data.length}: SparklineProps) {
	const {styles} = useComponentTheme<Theme>('Sparkline');
	const values = takeLast(data, width).map(toFiniteValue);

	if (values.length === 0) {
		return null;
	}

	return <Text {...styles.bars()}>{toBlocks(values)}</Text>;
}
