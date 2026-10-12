import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			gap: 1,
		}),
		key: (): TextProps => ({
			inverse: true,
		}),
		label: (): TextProps => ({
			dimColor: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
