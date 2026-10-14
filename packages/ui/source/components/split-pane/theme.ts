import {type BoxProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

// The divider is one cell thick. A side-by-side layout draws it as a vertical rule on the left edge of the second pane, and a stacked layout draws it as a horizontal rule on its top edge. The rule takes its length from the row or column it sits in.
const theme = {
	styles: {
		container: (): BoxProps => ({
			flexGrow: 1,
		}),
		verticalDivider: ({
			isFocused,
		}: {
			readonly isFocused: boolean;
		}): BoxProps => ({
			borderStyle: 'single',
			borderTop: false,
			borderBottom: false,
			borderRight: false,
			borderColor: isFocused ? 'blue' : 'gray',
			width: 1,
			flexShrink: 0,
		}),
		horizontalDivider: ({
			isFocused,
		}: {
			readonly isFocused: boolean;
		}): BoxProps => ({
			borderStyle: 'single',
			borderLeft: false,
			borderBottom: false,
			borderRight: false,
			borderColor: isFocused ? 'blue' : 'gray',
			height: 1,
			flexShrink: 0,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
