import {type TextProps} from '@fork/core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		input: ({isFocused}): TextProps => ({
			dimColor: !isFocused,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
