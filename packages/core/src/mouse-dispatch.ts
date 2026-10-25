import Yoga from 'yoga-layout';
import {type DOMElement} from './dom.js';
import {type MouseEvent} from './mouse.js';
import {
	type Bounds,
	boundsOf,
	clipForChildren,
	isInside,
	contentOffset,
} from './visible-box.js';

export type MouseHandlers = {
	onClick?: (event: MouseEvent) => void;
	onMouseDown?: (event: MouseEvent) => void;
	onMouseUp?: (event: MouseEvent) => void;
	onWheel?: (event: MouseEvent) => void;
};

type HandlerName = keyof MouseHandlers;

type Point = {readonly x: number; readonly y: number};

// Returns the deepest element under (x, y) whose box, and every clipping ancestor's box, contains the point. Layout coordinates do not include an ancestor's `contentOffsetX/Y`, so each child origin subtracts it, as the renderer does.
const hitNode = (
	node: DOMElement,
	point: Point,
	origin: Point,
	clip: Bounds | undefined,
): DOMElement | undefined => {
	const layout = node.yogaNode;
	if (!layout || layout.getDisplay() === Yoga.DISPLAY_NONE) {
		return undefined;
	}

	const box = boundsOf(
		origin.x + layout.getComputedLeft(),
		origin.y + layout.getComputedTop(),
		layout.getComputedWidth(),
		layout.getComputedHeight(),
	);
	if (
		!isInside(box, point.x, point.y) ||
		(clip && !isInside(clip, point.x, point.y))
	) {
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

		const hit = hitNode(
			child,
			point,
			{x: childOriginX, y: childOriginY},
			childClip,
		);
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
	const hit = hitNode(root, {x, y}, {x: 0, y: 0}, undefined);
	for (let node: DOMElement | undefined = hit; node; node = node.parentNode) {
		// The handler table has a fixed key set, and a missing name reads as undefined.
		// eslint-disable-next-line unicorn/no-computed-property-existence-check -- Reading the table by name is the check.
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

	private call(
		node: DOMElement | undefined,
		name: HandlerName,
		event: MouseEvent,
	): void {
		node?.internal_mouseHandlers?.[name]?.(event);
	}

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
				event.button === 'left'
					? findHandler(root, x, y, 'onClick')
					: undefined;
			return;
		}

		if (event.action !== 'release') {
			return;
		}

		this.call(findHandler(root, x, y, 'onMouseUp'), 'onMouseUp', event);
		const releaseTarget = findHandler(root, x, y, 'onClick');
		const {pressTarget} = this;
		this.pressTarget = undefined;
		if (
			releaseTarget &&
			releaseTarget === pressTarget &&
			event.button === 'left'
		) {
			this.call(releaseTarget, 'onClick', event);
		}
	}
}

/**
True when the terminal cell (x, y), 1-based as reported, lands on `element` or on one of its descendants.

Layout rectangles alone cannot answer this. An element can sit inside a clipping ancestor, or be scrolled out of view by `contentOffset`, and the hit walk applies both. Something drawn over the element, such as a modal, also answers false.
*/
export const isElementAt = (
	element: DOMElement,
	x: number,
	y: number,
): boolean => {
	let root = element;
	while (root.parentNode) {
		root = root.parentNode;
	}

	const hit = hitNode(root, {x: x - 1, y: y - 1}, {x: 0, y: 0}, undefined);
	for (let node: DOMElement | undefined = hit; node; node = node.parentNode) {
		if (node === element) {
			return true;
		}
	}

	return false;
};
