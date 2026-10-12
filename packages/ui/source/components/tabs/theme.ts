import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		tabBar: (): BoxProps => ({
			flexDirection: 'row',
			gap: 2,
		}),
		tab: ({isActive}: {readonly isActive: boolean}): TextProps => ({
			bold: isActive,
			color: isActive ? 'blue' : undefined,
		}),
		panel: (): BoxProps => ({
			flexDirection: 'column',
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
