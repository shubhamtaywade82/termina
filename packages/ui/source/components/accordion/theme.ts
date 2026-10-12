import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
		}),
		title: ({isFocused}: {readonly isFocused: boolean}): TextProps => ({
			color: isFocused ? 'blue' : undefined,
		}),
		icon: ({isOpen}: {readonly isOpen: boolean}): TextProps => ({
			dimColor: !isOpen,
		}),
		content: (): BoxProps => ({
			flexDirection: 'column',
			paddingLeft: 2,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
