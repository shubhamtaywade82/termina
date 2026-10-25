import {type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		input: ({isFocused}: {readonly isFocused: boolean}): TextProps => ({
			dimColor: !isFocused,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
