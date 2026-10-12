import React from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme, type TokenCounterStatus} from './theme.js';

export type TokenCounterProps = {
	/**
	 * Tokens used.
	 */
	readonly count: number;

	/**
	 * Token budget. When set, the counter shows the count against the limit and the percent used. Use a value greater than 0.
	 */
	readonly limit?: number;

	/**
	 * Unit name shown after the count.
	 *
	 * @default 'tokens'
	 */
	readonly label?: string;
};

const WARNING_FROM_RATIO = 0.8;
const OVER_FROM_RATIO = 1;

const formatNumber = (value: number): string => value.toLocaleString('en-US');

function formatUsage(count: number, limit: number | undefined): string {
	if (limit === undefined) {
		return formatNumber(count);
	}

	return `${formatNumber(count)} / ${formatNumber(limit)}`;
}

// Uses the exact ratio: a rounded percent would turn 99.9% usage red.
function getStatus(
	count: number,
	limit: number | undefined,
): TokenCounterStatus {
	// Without a limit there is no budget to warn about, so the normal style applies.
	if (limit === undefined) {
		return 'ok';
	}

	const ratio = count / limit;

	if (ratio >= OVER_FROM_RATIO) {
		return 'over';
	}

	return ratio >= WARNING_FROM_RATIO ? 'warning' : 'ok';
}

export function TokenCounter({
	count,
	limit,
	label = 'tokens',
}: TokenCounterProps) {
	const {styles} = useComponentTheme<Theme>('TokenCounter');
	const status = getStatus(count, limit);

	return (
		<Box {...styles.container()}>
			<Text {...styles.count({status})}>{formatUsage(count, limit)}</Text>
			<Text {...styles.label()}>{label}</Text>
			{limit !== undefined && (
				<Text {...styles.count({status})}>
					({Math.round((count / limit) * 100)}%)
				</Text>
			)}
		</Box>
	);
}
