import React from 'react';
import {Text} from '@fork/core';
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
	const visible = lines.length > maxLines ? lines.slice(-maxLines) : lines;

	return (
		<ScrollBox height={height} followTail isActive={isActive}>
			{visible.map((line, index) => (
				<Text key={index}>{line}</Text>
			))}
		</ScrollBox>
	);
};
