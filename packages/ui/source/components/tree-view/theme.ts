import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
		}),
		node: ({isFocused}: {readonly isFocused: boolean}): TextProps =>
			isFocused ? {color: 'blue'} : {},
		guide: (): TextProps => ({
			dimColor: true,
		}),
		branch: ({isExpanded}: {readonly isExpanded: boolean}): TextProps => ({
			dimColor: !isExpanded,
		}),
		leaf: (): TextProps => ({}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
