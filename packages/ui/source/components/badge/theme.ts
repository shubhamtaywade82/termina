import {type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: ({color}: Pick<TextProps, 'color'>): TextProps => ({
			backgroundColor: color,
		}),
		label: (): TextProps => ({
			color: 'black',
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
