import Yoga from 'yoga-layout';
import {type DOMElement, type DOMNode} from './dom.js';

// Half-open edges, so an infinite edge means "unclipped" without special cases.
export type Bounds = {
	readonly x1: number;
	readonly y1: number;
	readonly x2: number;
	readonly y2: number;
};

export const boundsOf = (
	x: number,
	y: number,
	width: number,
	height: number,
): Bounds => ({
	x1: x,
	y1: y,
	x2: x + width,
	y2: y + height,
});

export const isInside = (bounds: Bounds, x: number, y: number): boolean =>
	x >= bounds.x1 && x < bounds.x2 && y >= bounds.y1 && y < bounds.y2;

// A node's children are clipped to its box on each axis where it has `overflow: hidden`. Clips only narrow as the walk descends.
export const clipForChildren = (
	node: DOMElement,
	box: Bounds,
	clip: Bounds | undefined,
): Bounds | undefined => {
	const isClipsX = node.style.overflowX === 'hidden';
	const isClipsY = node.style.overflowY === 'hidden';
	if (!isClipsX && !isClipsY) {
		return clip;
	}

	return {
		x1: isClipsX
			? Math.max(clip?.x1 ?? -Infinity, box.x1)
			: (clip?.x1 ?? -Infinity),
		y1: isClipsY
			? Math.max(clip?.y1 ?? -Infinity, box.y1)
			: (clip?.y1 ?? -Infinity),
		x2: isClipsX
			? Math.min(clip?.x2 ?? Infinity, box.x2)
			: (clip?.x2 ?? Infinity),
		y2: isClipsY
			? Math.min(clip?.y2 ?? Infinity, box.y2)
			: (clip?.y2 ?? Infinity),
	};
};

export const contentOffset = (value: number | undefined): number =>
	typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0;

const intersect = (a: Bounds, b: Bounds | undefined): Bounds | undefined => {
	const bounds = b ?? {
		x1: -Infinity,
		y1: -Infinity,
		x2: Infinity,
		y2: Infinity,
	};
	const x1 = Math.max(a.x1, bounds.x1);
	const y1 = Math.max(a.y1, bounds.y1);
	const x2 = Math.min(a.x2, bounds.x2);
	const y2 = Math.min(a.y2, bounds.y2);

	return x1 < x2 && y1 < y2 ? {x1, y1, x2, y2} : undefined;
};

/**
The part of `element` that is drawn on screen, in layout coordinates, or `undefined` when none of it is. The walk runs from the root down, so each box takes its parent's content offset, and each element is cut by every `overflow: hidden` ancestor. `isElementAt` and focus both read this, so a click and a focus move agree about what is visible.
*/
export const visibleBoundsOf = (element: DOMElement): Bounds | undefined => {
	const chain: DOMElement[] = [];
	for (let node: DOMNode | undefined = element; node; node = node.parentNode) {
		chain.unshift(node);
	}

	let originX = 0;
	let originY = 0;
	// The clip from the ancestors of the node being visited, and the clip its children get.
	let ancestorClip: Bounds | undefined;
	let childClip: Bounds | undefined;
	let box: Bounds | undefined;

	for (const node of chain) {
		const layout = node.yogaNode;
		if (!layout || layout.getDisplay() === Yoga.DISPLAY_NONE) {
			return undefined;
		}

		ancestorClip = childClip;
		box = boundsOf(
			originX + layout.getComputedLeft(),
			originY + layout.getComputedTop(),
			layout.getComputedWidth(),
			layout.getComputedHeight(),
		);
		childClip = clipForChildren(node, box, ancestorClip);
		originX = box.x1 - contentOffset(node.style.contentOffsetX);
		originY = box.y1 - contentOffset(node.style.contentOffsetY);
	}

	return box && intersect(box, ancestorClip);
};
