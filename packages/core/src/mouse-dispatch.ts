import Yoga from 'yoga-layout';
import {type DOMElement} from './dom.js';
import {type MouseEvent} from './mouse.js';

export type MouseHandlers = {
	onClick?: (event: MouseEvent) => void;
	onMouseDown?: (event: MouseEvent) => void;
	onMouseUp?: (event: MouseEvent) => void;
	onWheel?: (event: MouseEvent) => void;
};

type HandlerName = keyof MouseHandlers;

// Half-open edges, so an infinite edge means "unclipped" without special cases.
type Bounds = {readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number};

const boundsOf = (x: number, y: number, width: number, height: number): Bounds => ({
	x1: x,
	y1: y,
	x2: x + width,
	y2: y + height,
});

const contains = (bounds: Bounds, x: number, y: number): boolean =>
	x >= bounds.x1 && x < bounds.x2 && y >= bounds.y1 && y < bounds.y2;

// A node's children are clipped to its box on each axis where it has `overflow: hidden`. Clips only narrow as the walk descends.
const clipForChildren = (node: DOMElement, box: Bounds, clip: Bounds | undefined): Bounds | undefined => {
	const clipsX = node.style.overflowX === 'hidden';
	const clipsY = node.style.overflowY === 'hidden';
	if (!clipsX && !clipsY) {
		return clip;
	}

	return {
		x1: clipsX ? Math.max(clip?.x1 ?? -Infinity, box.x1) : (clip?.x1 ?? -Infinity),
		y1: clipsY ? Math.max(clip?.y1 ?? -Infinity, box.y1) : (clip?.y1 ?? -Infinity),
		x2: clipsX ? Math.min(clip?.x2 ?? Infinity, box.x2) : (clip?.x2 ?? Infinity),
		y2: clipsY ? Math.min(clip?.y2 ?? Infinity, box.y2) : (clip?.y2 ?? Infinity),
	};
};

const contentOffset = (value: number | undefined): number =>
	typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0;

// Returns the deepest element under (x, y) whose box, and every clipping ancestor's box, contains the point. Layout coordinates do not include an ancestor's `contentOffsetX/Y`, so each child origin subtracts it, as the renderer does.
const hitNode = (
	node: DOMElement,
	x: number,
	y: number,
	originX: number,
	originY: number,
	clip: Bounds | undefined,
): DOMElement | undefined => {
	const layout = node.yogaNode;
	if (!layout || layout.getDisplay() === Yoga.DISPLAY_NONE) {
		return undefined;
	}

	const box = boundsOf(
		originX + layout.getComputedLeft(),
		originY + layout.getComputedTop(),
		layout.getComputedWidth(),
		layout.getComputedHeight(),
	);
	if (!contains(box, x, y) || (clip && !contains(clip, x, y))) {
		return undefined;
	}

	const childClip = clipForChildren(node, box, clip);
	const childOriginX = box.x1 - contentOffset(node.style.contentOffsetX);
	const childOriginY = box.y1 - contentOffset(node.style.contentOffsetY);

	for (let index = node.childNodes.length - 1; index >= 0; index--) {
		const child = node.childNodes[index];
		if (!child || child.nodeName === '#text') {
			continue;
		}

		const hit = hitNode(child as DOMElement, x, y, childOriginX, childOriginY, childClip);
		if (hit) {
			return hit;
		}
	}

	return node;
};

// Walks from the hit element toward the root and returns the first element that handles `name`. As with DOM bubbling, the closest handler wins.
const findHandler = (
	root: DOMElement,
	x: number,
	y: number,
	name: HandlerName,
): DOMElement | undefined => {
	const hit = hitNode(root, x, y, 0, 0, undefined);
	for (let node: DOMElement | undefined = hit; node; node = node.parentNode as DOMElement | undefined) {
		if (node.internal_mouseHandlers?.[name]) {
			return node;
		}
	}

	return undefined;
};

/**
Routes SGR mouse reports to `<Box>` handlers by hit-testing the layout.

A click is a left-button press and release that resolve to the same `onClick` element. Dragging off a button therefore cancels the click. Other buttons reach only `onMouseDown` and `onMouseUp`.

Coordinates are assumed to start at the terminal's top-left, which is why routing is only mounted on the alternate screen. `<Static>` output above the app would still shift hits.
*/
export class MouseDispatcher {
	private pressTarget: DOMElement | undefined;

	public dispatch(root: DOMElement, event: MouseEvent): void {
		// Reports are 1-based, layout is 0-based.
		const x = event.x - 1;
		const y = event.y - 1;

		if (event.action === 'wheel') {
			this.call(findHandler(root, x, y, 'onWheel'), 'onWheel', event);
			return;
		}

		if (event.action === 'press') {
			this.call(findHandler(root, x, y, 'onMouseDown'), 'onMouseDown', event);
			this.pressTarget =
				event.button === 'left' ? findHandler(root, x, y, 'onClick') : undefined;
			return;
		}

		if (event.action === 'release') {
			this.call(findHandler(root, x, y, 'onMouseUp'), 'onMouseUp', event);
			const releaseTarget = findHandler(root, x, y, 'onClick');
			const pressTarget = this.pressTarget;
			this.pressTarget = undefined;
			if (event.button === 'left' && releaseTarget && releaseTarget === pressTarget) {
				this.call(releaseTarget, 'onClick', event);
			}
		}
	}

	private call(node: DOMElement | undefined, name: HandlerName, event: MouseEvent): void {
		node?.internal_mouseHandlers?.[name]?.(event);
	}
}

/**
True when the terminal cell (x, y), 1-based as reported, lands on `element` or on one of its descendants.

Layout rectangles alone cannot answer this. An element can sit inside a clipping ancestor, or be scrolled out of view by `contentOffset`, and the hit walk applies both. Something drawn over the element, such as a modal, also answers false.
*/
export const isElementAt = (element: DOMElement, x: number, y: number): boolean => {
	let root = element;
	while (root.parentNode) {
		root = root.parentNode as DOMElement;
	}

	const hit = hitNode(root, x - 1, y - 1, 0, 0, undefined);
	for (let node: DOMElement | undefined = hit; node; node = node.parentNode as DOMElement | undefined) {
		if (node === element) {
			return true;
		}
	}

	return false;
};
