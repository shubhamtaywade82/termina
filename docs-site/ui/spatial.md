---
outline: [2, 3]
---

# Spatial Focus Geometry

`nearestInDirection` picks the candidate nearest to an origin rectangle in one of four directions. Use it when you have rectangles with ids, such as the panels on a screen, and need the neighbor for an arrow key. It is pure geometry. It does not read or change focus. Nothing in `@nemesis-oss/termina-core` or `@nemesis-oss/termina-ui` calls it. `FORK.md` lists wiring it to `useFocus` as not yet built. For the focus system, read [Keyboard and Focus](/guide/keyboard-and-focus).

## Exports

From `@nemesis-oss/termina-ui`: the function `nearestInDirection`, and the types `Rect`, `Direction`, and `FocusCandidate`. The three types are exported with `export type`.

## Types

```ts
type Rect = {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
};

type Direction = 'up' | 'down' | 'left' | 'right';

type FocusCandidate = {
	readonly id: string;
	readonly rect: Rect;
};
```

`x` and `width` count columns, and `y` and `height` count rows. The package tests describe their rectangles in cells, so use that unit.

## nearestInDirection

```ts
nearestInDirection(
	origin: Rect,
	candidates: readonly FocusCandidate[],
	direction: Direction,
): string | undefined
```

It returns the `id` of the nearest qualifying candidate. It returns `undefined` when no candidate qualifies, including when `candidates` is empty. It does not validate its arguments.

### How a candidate is chosen

1. **Center.** Each rectangle is reduced to its center, `x + width / 2` and `y + height / 2`. Only centers are compared. A candidate that overlaps the origin still qualifies when its center lies ahead of the origin's center.
2. **Half-plane.** A candidate qualifies when its center lies strictly ahead of the origin's center in `direction`. For `right`, the candidate's center x must be greater than the origin's center x. The test is a half-plane, not a cone. A candidate far off the axis still qualifies if it is ahead, and the distance rule decides between candidates. A candidate whose center has the same coordinate along `direction` as the origin's center does not qualify. This excludes the origin itself when it appears in `candidates`.
3. **Distance.** The distance is `Math.hypot(along, across)`. `along` is the offset in `direction`, and `across` is the offset perpendicular to it. The vertical offset is multiplied by the cell aspect ratio, 2, before either value is used, so one row counts as two columns.
4. **Ties.** The earliest candidate in `candidates` wins. The comparison is strict, so a later candidate at the same distance does not replace an earlier one.

The function does not check whether a candidate is visible, focusable, clipped, or enabled. Filter the list before you call it.

### Cell aspect ratio

The source declares `const cellAspectRatio = 2;` with the comment "A terminal cell is roughly twice as tall as it is wide." The constant is not exported and is not a parameter. Changing it means editing `packages/ui/source/lib/spatial.ts`.

The scaling changes the result when two candidates are at similar distances. With an origin of `{x: 0, y: 0, width: 2, height: 2}`, a candidate two rows straight below has distance 4. A candidate one row below and three columns over has distance about 3.6. For `down`, the function returns the second candidate.

## Worked example

This uses the 2 by 2 grid of 10 by 5 cells from the package tests.

```ts
import {nearestInDirection, type FocusCandidate, type Rect} from '@nemesis-oss/termina-ui';

const a: Rect = {x: 0, y: 0, width: 10, height: 5};
const b: Rect = {x: 12, y: 0, width: 10, height: 5};
const c: Rect = {x: 0, y: 6, width: 10, height: 5};
const d: Rect = {x: 12, y: 6, width: 10, height: 5};

const candidates: FocusCandidate[] = [
	{id: 'A', rect: a},
	{id: 'B', rect: b},
	{id: 'C', rect: c},
	{id: 'D', rect: d},
];

nearestInDirection(a, candidates, 'right'); // 'B'
nearestInDirection(a, candidates, 'down'); // 'C'
nearestInDirection(a, candidates, 'left'); // undefined
nearestInDirection(d, candidates, 'up'); // 'B'
```

The origin `a` is in `candidates`. It is never returned, because its center does not lie ahead of itself.

## What the caller supplies

The function returns an id and nothing else. The caller does the rest:

- It supplies the rectangles. The function does not read layout.
- It filters the candidates to the ones that may take focus.
- It maps the returned id to a focus change. The function reads no keys and changes no focus state.
