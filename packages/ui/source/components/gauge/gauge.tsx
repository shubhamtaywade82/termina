import React from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import figures from 'figures';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type GaugeProps = {
	/**
	 * Percent to show, from 0 to 100.
	 *
	 * Values outside the range are clamped to it, and NaN counts as 0.
	 * The shown percent is rounded to a whole number. The bar and the
	 * color use the exact value.
	 */
	readonly value: number;

	/**
	 * Text drawn before the bar.
	 */
	readonly label?: string;

	/**
	 * Number of cells in the bar.
	 *
	 * @default 20
	 */
	readonly width?: number;

	/**
	 * Draw the percent after the bar.
	 *
	 * @default true
	 */
	readonly showValue?: boolean;
};

// NaN passes through Math.min and Math.max unchanged, so it is mapped to 0 first.
const clampPercent = (value: number): number =>
	Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));

export function Gauge({value, label, width = 20, showValue = true}: GaugeProps) {
	const {styles, config} = useComponentTheme<Theme>('Gauge');
	const percent = clampPercent(value);
	const {color} = config({value: percent});
	const filledCount = Math.round((percent / 100) * width);

	return (
		<Box {...styles.container()}>
			{label ? <Text {...styles.label()}>{label}</Text> : null}
			<Text>
				<Text {...styles.filled({color})}>
					{figures.square.repeat(filledCount)}
				</Text>
				<Text {...styles.empty()}>
					{figures.squareLightShade.repeat(width - filledCount)}
				</Text>
			</Text>
			{showValue && <Text {...styles.value()}>{Math.round(percent)}%</Text>}
		</Box>
	);
}
