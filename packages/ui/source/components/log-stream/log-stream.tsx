import React from 'react';
import {Text} from '@nemesis-oss/termina-core';
import {ScrollBox} from '../scroll-box/scroll-box.js';

export type LogStreamProps = {
	/**
	 * One entry per log record. An entry may contain newlines and wraps to the viewport width.
	 */
	readonly lines: readonly string[];

	/**
	 * Viewport height in rows.
	 */
	readonly height: number;

	/**
	 * Only the newest `maxLines` entries are kept. Every entry is laid out on each render, so an unbounded log would make each frame slower than the last.
	 *
	 * @default 1000
	 */
	readonly maxLines?: number;

	/**
	 * @default true
	 */
	readonly isActive?: boolean;
};

/**
A tail-following log viewer. It stays pinned to the newest entry until the user scrolls up, and it re-pins when the user scrolls back to the bottom.
*/
export const LogStream = ({
	lines,
	height,
	maxLines = 1000,
	isActive = true,
}: LogStreamProps) => {
	const firstIndex = Math.max(0, lines.length - maxLines);
	const visible = lines.slice(firstIndex);

	return (
		<ScrollBox height={height} followTail isActive={isActive}>
			{/* Keyed by position in the full log, so dropping the oldest entry does not shift every key and re-render every row. */}
			{visible.map((line, index) => (
				<Text key={firstIndex + index}>{line}</Text>
			))}
		</ScrollBox>
	);
};
