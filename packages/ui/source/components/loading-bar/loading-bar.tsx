import React, {useEffect, useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import figures from 'figures';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type LoadingBarProps = {
	/**
	 * Width of the track, in cells. Fractions are rounded down. Zero and negative values draw an empty track.
	 *
	 * @default 20
	 */
	readonly width?: number;

	/**
	 * When false, the animation stops and the block stays at the start of the track.
	 *
	 * @default true
	 */
	readonly isActive?: boolean;

	/**
	 * Milliseconds between frames.
	 *
	 * @default 80
	 */
	readonly interval?: number;
};

type FrameCounterOptions = {
	readonly isActive: boolean;
	readonly interval: number;
};

const BLOCK_CELLS = 4;

const getBouncingPosition = (frame: number, maxPosition: number): number => {
	// The cycle below is zero when there is no room to move, and a modulo by zero is NaN.
	if (maxPosition === 0) {
		return 0;
	}

	const cycleLength = 2 * maxPosition;
	const offset = frame % cycleLength;
	return offset <= maxPosition ? offset : cycleLength - offset;
};

// Resets on deactivation, so each activation sweeps from the start instead of resuming mid-track.
const useFrameCounter = ({isActive, interval}: FrameCounterOptions): number => {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		if (!isActive) {
			setFrame(0);
			return undefined;
		}

		const timer = setInterval(() => {
			setFrame(previousFrame => previousFrame + 1);
		}, interval);

		return () => {
			clearInterval(timer);
		};
	}, [isActive, interval]);

	return frame;
};

export function LoadingBar({width = 20, isActive = true, interval = 80}: LoadingBarProps) {
	const frame = useFrameCounter({isActive, interval});
	const {styles} = useComponentTheme<Theme>('LoadingBar');

	// repeat() throws on a negative or infinite count, so those widths draw an empty track.
	const trackCells = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
	const blockCells = Math.min(BLOCK_CELLS, trackCells);
	const maxPosition = trackCells - blockCells;

	// The reset in useFrameCounter runs after this render, so reading the frame here would show the old position for one frame.
	const blockStart = isActive ? getBouncingPosition(frame, maxPosition) : 0;
	const trailingCells = trackCells - blockStart - blockCells;

	return (
		<Box {...styles.container()}>
			<Text>
				<Text {...styles.track()}>{figures.squareLightShade.repeat(blockStart)}</Text>
				<Text {...styles.block()}>{figures.square.repeat(blockCells)}</Text>
				<Text {...styles.track()}>{figures.squareLightShade.repeat(trailingCells)}</Text>
			</Text>
		</Box>
	);
}
