import {useState} from 'react';

// One cell between the two panes.
const dividerSize = 1;

const clampRatio = (value: number): number => Math.min(1, Math.max(0, value));

// The first pane's cells out of `total`. The second pane gets the rest, less the divider, and both keep at least `minSize`. The caller only uses this when `total` can hold both minimums.
export const clampFirstSize = (
	wanted: number,
	total: number,
	minSize: number,
): number => Math.min(Math.max(wanted, minSize), total - dividerSize - minSize);

export type SplitPaneLayoutOptions = {
	readonly direction: 'row' | 'column';
	readonly ratio: number | undefined;
	readonly defaultRatio: number;
	readonly onRatioChange: ((ratio: number) => void) | undefined;
	readonly minSize: number;
	readonly breakpoint: number;
	// Width of the split pane, and whether a layout has measured it yet.
	readonly width: number;
	readonly hasMeasured: boolean;
};

export type SplitPaneLayout = {
	// True when the panes sit side by side. False when they stack, either because the direction is column or because the width is below the breakpoint.
	readonly isSideBySide: boolean;
	// The ratio in use, clamped to 0 to 1. It is not clamped to minSize here.
	readonly ratio: number;
	// The first pane's width in cells once the width is measured and the panes sit side by side. Undefined before that, when the ratio applies as a percentage.
	readonly firstSize: number | undefined;
	// Moves the divider by `delta` cells. It does nothing at a minimum, and when the panes are stacked or not yet measured.
	readonly move: (delta: number) => void;
};

export const useSplitPaneLayout = ({
	direction,
	ratio: controlledRatio,
	defaultRatio,
	onRatioChange,
	minSize,
	breakpoint,
	width,
	hasMeasured,
}: SplitPaneLayoutOptions): SplitPaneLayout => {
	const [uncontrolledRatio, setUncontrolledRatio] = useState(defaultRatio);
	const isControlled = controlledRatio !== undefined;
	const ratio = clampRatio(isControlled ? controlledRatio : uncontrolledRatio);

	// Both panes and the divider need this much width. A narrower row stacks, so a side-by-side layout never breaks minSize.
	const sideBySideWidth = Math.max(breakpoint, 2 * minSize + dividerSize);
	// Before the first layout the width is unknown, so the panes are not stacked yet.
	const isSideBySide =
		direction === 'row' && (!hasMeasured || width >= sideBySideWidth);
	const firstSize =
		isSideBySide && hasMeasured
			? clampFirstSize(Math.round(ratio * width), width, minSize)
			: undefined;

	const move = (delta: number) => {
		if (firstSize === undefined) {
			return;
		}

		const next = clampFirstSize(firstSize + delta, width, minSize);
		if (next === firstSize) {
			return;
		}

		const nextRatio = next / width;
		if (!isControlled) {
			setUncontrolledRatio(nextRatio);
		}

		onRatioChange?.(nextRatio);
	};

	return {isSideBySide, ratio, firstSize, move};
};
