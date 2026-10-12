import React, {useRef, useState, type ReactNode} from 'react';
import {
	Box,
	type DOMElement,
	type MouseEvent,
	Text,
	useBoxMetrics,
	useInput,
} from '@nemesis-oss/termina-core';

export type ScrollBoxProps = {
	/**
	 * Viewport height in rows. Ink has no intrinsic scroll height, so the viewport is sized explicitly.
	 */
	readonly height: number;

	readonly children?: ReactNode;

	/**
	 * Controlled scroll offset, in rows from the top of the content. Omit it to let the box own its offset.
	 */
	readonly offset?: number;

	/**
	 * Called with the new offset whenever the user scrolls.
	 */
	readonly onScroll?: (offset: number) => void;

	/**
	 * Rows moved by one mouse wheel step.
	 *
	 * @default 3
	 */
	readonly wheelStep?: number;

	/**
	 * When false, keyboard and wheel input are ignored. Every active box reads the arrow keys, so with several on screen, activate only the focused one.
	 *
	 * @default true
	 */
	readonly isActive?: boolean;

	/**
	 * Stay pinned to the bottom while content grows. Scrolling up releases the pin; scrolling back to the bottom re-pins it.
	 *
	 * @default false
	 */
	readonly followTail?: boolean;

	/**
	 * @default true
	 */
	readonly showScrollbar?: boolean;
};

const clamp = (value: number, min: number, max: number): number =>
	Math.min(Math.max(value, min), max);

// Thumb rows are sized by the visible fraction of the content and placed by the scroll fraction.
const scrollbarRows = (
	height: number,
	contentHeight: number,
	offset: number,
	maxOffset: number,
): string[] => {
	const thumbSize = Math.max(1, Math.round((height * height) / contentHeight));
	const thumbTop = Math.round((offset / maxOffset) * (height - thumbSize));
	return Array.from({length: height}, (_, row) =>
		row >= thumbTop && row < thumbTop + thumbSize ? '█' : '│',
	);
};

/**
A fixed-height viewport over taller content. Arrow keys scroll by a row, PageUp and PageDown by a viewport, and Home and End jump to the edges. With `render(..., {mouse: true})`, the mouse wheel scrolls by `wheelStep` rows inside the viewport.

Keys are read only when stdin supports raw mode, so the box also renders under piped stdin and in CI.
*/
export const ScrollBox = ({
	height,
	children,
	offset,
	onScroll,
	wheelStep = 3,
	isActive = true,
	followTail = false,
	showScrollbar = true,
}: ScrollBoxProps) => {
	const contentRef = useRef<DOMElement>(null);
	const content = useBoxMetrics(contentRef);

	const [ownOffset, setOwnOffset] = useState(0);
	// Tracks the user scrolling away from the tail rather than the pin itself, so turning `followTail` on later pins at once.
	const [isTailReleased, setIsTailReleased] = useState(false);
	// Input events can arrive faster than React renders. Each scroll therefore moves from the latest offset, not from the one captured by the last render.
	const latestOffsetRef = useRef(0);

	const isControlled = offset !== undefined;
	const requestedOffset = isControlled ? offset : ownOffset;

	const contentHeight = content.height;
	const maxOffset = Math.max(0, contentHeight - height);
	const currentOffset =
		followTail && !isTailReleased
			? maxOffset
			: clamp(requestedOffset, 0, maxOffset);

	latestOffsetRef.current = currentOffset;

	const scrollTo = (target: number): void => {
		const next = clamp(target, 0, maxOffset);
		if (next === latestOffsetRef.current) {
			return;
		}

		latestOffsetRef.current = next;

		if (!isControlled) {
			setOwnOffset(next);
		}

		if (followTail) {
			setIsTailReleased(next < maxOffset);
		}

		onScroll?.(next);
	};

	useInput(
		(_input, key) => {
			if (key.upArrow) {
				scrollTo(latestOffsetRef.current - 1);
			} else if (key.downArrow) {
				scrollTo(latestOffsetRef.current + 1);
			} else if (key.pageUp) {
				scrollTo(latestOffsetRef.current - height);
			} else if (key.pageDown) {
				scrollTo(latestOffsetRef.current + height);
			} else if (key.home) {
				scrollTo(0);
			} else if (key.end) {
				scrollTo(maxOffset);
			}
		},
		{isActive},
	);

	const handleWheel = (event: MouseEvent): void => {
		if (event.button === 'wheelUp') {
			scrollTo(latestOffsetRef.current - wheelStep);
		} else if (event.button === 'wheelDown') {
			scrollTo(latestOffsetRef.current + wheelStep);
		}
	};

	const showTrack = showScrollbar && maxOffset > 0;

	return (
		<Box flexDirection="row" height={height}>
			<Box
				flexDirection="column"
				flexGrow={1}
				height={height}
				overflow="hidden"
				contentOffsetY={currentOffset}
				onWheel={isActive ? handleWheel : undefined}
			>
				<Box ref={contentRef} flexDirection="column" flexShrink={0}>
					{children}
				</Box>
			</Box>
			{showTrack ? (
				<Box flexDirection="column" width={1}>
					{scrollbarRows(height, contentHeight, currentOffset, maxOffset).map(
						(row, index) => (
							<Text key={index} dimColor>
								{row}
							</Text>
						),
					)}
				</Box>
			) : null}
		</Box>
	);
};
