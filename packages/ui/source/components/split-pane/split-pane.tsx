import React, {type ReactNode, useRef} from 'react';
import {
	Box,
	type BoxProps,
	type DOMElement,
	useBoxMetrics,
	useFocus,
	useInput,
} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';
import {type SplitPaneLayout, useSplitPaneLayout} from './use-split-pane.js';

export type SplitPaneProps = {
	/**
	 * How the two panes are laid out. `'row'` places them side by side, and `'column'` stacks them.
	 *
	 * @default 'row'
	 */
	readonly direction?: 'row' | 'column';

	/**
	 * Share of the length that the first pane takes, from 0 to 1. The length is the width when the panes sit side by side, and the height when they stack. The one-cell divider is counted in the length. Setting it makes the ratio controlled: a resize key calls `onRatioChange`, and the divider moves only when the parent passes a new `ratio`.
	 */
	readonly ratio?: number;

	/**
	 * Starting ratio when the ratio is not controlled. Resize keys then move the divider without any parent.
	 *
	 * @default 0.5
	 */
	readonly defaultRatio?: number;

	/**
	 * Called with the new ratio after a resize key moves the divider.
	 */
	readonly onRatioChange?: (ratio: number) => void;

	/**
	 * Fewest cells that either pane may take when the panes sit side by side. A resize key stops at this size. Stacked panes are not clamped.
	 *
	 * @default 10
	 */
	readonly minSize?: number;

	/**
	 * Width below which a `'row'` layout stacks the panes as a column. The panes also stack when the width cannot hold both minimum sizes.
	 *
	 * @default 60
	 */
	readonly breakpoint?: number;

	/**
	 * Whether the pane takes focus with Tab, and whether Ctrl+Left and Ctrl+Right move the divider while it has focus.
	 *
	 * @default false
	 */
	readonly resizable?: boolean;

	/**
	 * Exactly two elements, the first pane and the second pane. Any other count throws.
	 */
	readonly children: ReactNode;
};

const percent = (ratio: number): string => `${ratio * 100}%`;

// Side by side, the first pane is sized in cells once the width is known. Before that, and when the panes stack, it takes the ratio as a percentage of the root. A stacked pane is not clamped to minSize.
function firstPaneBox(layout: SplitPaneLayout): BoxProps {
	return layout.isSideBySide
		? {width: layout.firstSize ?? percent(layout.ratio)}
		: {height: percent(layout.ratio)};
}

/**
 * Two panes split by a one-cell divider. The panes sit side by side when the width allows, and stack below the breakpoint.
 *
 * With `resizable`, the pane takes focus with Tab. While it has focus and the panes sit side by side, Ctrl+Left and Ctrl+Right move the divider one cell, and neither pane goes below `minSize`.
 *
 * A stacked first pane takes its share of the height as a percentage, so the parent must give the split pane a height when the panes may stack.
 *
 * ```
 * import {Text} from '@nemesis-oss/termina-core';
 * import {SplitPane} from '@nemesis-oss/termina-ui';
 *
 * const Example = () => (
 * <SplitPane defaultRatio={0.3} resizable>
 * <Text>Files</Text>
 * <Text>Editor</Text>
 * </SplitPane>
 * );
 * ```
 */
export function SplitPane({
	direction = 'row',
	ratio,
	defaultRatio = 0.5,
	onRatioChange,
	minSize = 10,
	breakpoint = 60,
	resizable = false,
	children,
}: SplitPaneProps) {
	const {styles} = useComponentTheme<Theme>('SplitPane');
	const {isFocused} = useFocus({isActive: resizable});
	const ref = useRef<DOMElement>(null);
	const {width, hasMeasured} = useBoxMetrics(ref);
	const layout = useSplitPaneLayout({
		direction,
		ratio,
		defaultRatio,
		onRatioChange,
		minSize,
		breakpoint,
		width,
		hasMeasured,
	});

	useInput(
		(_input, key) => {
			if (!key.ctrl) {
				return;
			}

			if (key.leftArrow) {
				layout.move(-1);
			} else if (key.rightArrow) {
				layout.move(1);
			}
		},
		{isActive: isFocused},
	);

	// The array is only counted and each element is rendered once in its own pane, so the keys that toArray assigns are never used to match elements across renders.
	// eslint-disable-next-line @eslint-react/no-children-to-array
	const panes = React.Children.toArray(children);
	if (panes.length !== 2) {
		throw new Error(
			`SplitPane needs exactly two children, got ${panes.length}.`,
		);
	}

	const [first, second] = panes;
	const divider = layout.isSideBySide
		? styles.verticalDivider({isFocused})
		: styles.horizontalDivider({isFocused});

	return (
		<Box
			ref={ref}
			{...styles.container()}
			flexDirection={layout.isSideBySide ? 'row' : 'column'}
		>
			<Box {...firstPaneBox(layout)} flexShrink={0} overflow="hidden">
				{first}
			</Box>
			<Box {...divider} />
			<Box flexGrow={1} flexShrink={1} overflow="hidden">
				{second}
			</Box>
		</Box>
	);
}
