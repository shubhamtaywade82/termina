import {type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		text: (): TextProps => ({}),
		cursor: (): TextProps => ({
			color: 'blue',
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
