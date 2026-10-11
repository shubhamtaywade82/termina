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

// A terminal cell is roughly twice as tall as it is wide, so one row of vertical distance is worth two columns of horizontal distance when the metric is Euclidean.
const cellAspectRatio = 2;

const center = (rect: Rect): {x: number; y: number} => ({
	x: rect.x + rect.width / 2,
	y: rect.y + rect.height / 2,
});

/**
Returns the id of the candidate nearest to `origin` in `direction`, or `undefined` when none lies that way.

A candidate qualifies when its center lies strictly in the direction's half-plane. Among qualifying candidates the distance is Euclidean, with vertical distance scaled by the cell aspect ratio so that visual distance is what gets compared. Ties go to the earlier candidate, which keeps document order as the tie-breaker.
*/
export const nearestInDirection = (
	origin: Rect,
	candidates: readonly FocusCandidate[],
	direction: Direction,
): string | undefined => {
	const from = center(origin);
	const isVertical = direction === 'up' || direction === 'down';
	const sign = direction === 'right' || direction === 'down' ? 1 : -1;

	let best: {id: string; distance: number} | undefined;
	for (const candidate of candidates) {
		const to = center(candidate.rect);
		const dx = to.x - from.x;
		const dy = (to.y - from.y) * cellAspectRatio;

		const along = isVertical ? dy : dx;
		const across = isVertical ? dx : dy;
		if (sign * along <= 0) {
			continue;
		}

		const distance = Math.hypot(along, across);
		if (best === undefined || distance < best.distance) {
			best = {id: candidate.id, distance};
		}
	}

	return best?.id;
};
