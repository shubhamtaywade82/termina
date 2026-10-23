/**
A rectangle in layout cells. `x` and `width` count columns, and `y` and `height` count rows.
*/
export type Rect = {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type FocusCandidate = {
	readonly id: string;
	readonly rect: Rect;
};

// A terminal cell is about twice as tall as it is wide, so one row of distance counts as two columns.
const cellAspectRatio = 2;

const centerOf = (rect: Rect): {x: number; y: number} => ({
	x: rect.x + rect.width / 2,
	y: rect.y + rect.height / 2,
});

// The distance a candidate lies along `direction` and across it, or `undefined` when its center is not strictly ahead of the origin's center. Rows are scaled by the aspect ratio before either value is used.
const measureAhead = (
	dx: number,
	dy: number,
	direction: Direction,
): {along: number; across: number} | undefined => {
	if (direction === 'right') {
		return dx > 0 ? {along: dx, across: dy * cellAspectRatio} : undefined;
	}

	if (direction === 'left') {
		return dx < 0 ? {along: -dx, across: dy * cellAspectRatio} : undefined;
	}

	if (direction === 'down') {
		return dy > 0 ? {along: dy * cellAspectRatio, across: dx} : undefined;
	}

	return dy < 0 ? {along: -dy * cellAspectRatio, across: dx} : undefined;
};

/**
Returns the `id` of the candidate nearest to `origin` in `direction`, or `undefined` when no candidate lies ahead.

A candidate lies ahead when its center is strictly past the origin's center in `direction`. The half-plane is not a cone, so a candidate far off the axis still qualifies, and the distance decides. The distance is `Math.hypot(along, across)`, with vertical offsets scaled by the cell aspect ratio. When two candidates are equally near, the earlier one in `candidates` wins. The origin itself never qualifies, because its center is not ahead of itself.

The function does not check that a candidate can take focus. Filter the list first.
*/
export const nearestInDirection = (
	origin: Rect,
	candidates: readonly FocusCandidate[],
	direction: Direction,
): string | undefined => {
	const from = centerOf(origin);
	let nearestId: string | undefined;
	let nearestDistance = Infinity;

	for (const candidate of candidates) {
		const to = centerOf(candidate.rect);
		const ahead = measureAhead(to.x - from.x, to.y - from.y, direction);

		if (ahead === undefined) {
			continue;
		}

		const distance = Math.hypot(ahead.along, ahead.across);

		if (!(distance < nearestDistance)) {
			continue;
		}

		nearestDistance = distance;
		nearestId = candidate.id;
	}

	return nearestId;
};
