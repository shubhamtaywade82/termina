import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'row',
			gap: 2,
		}),
		title: (): TextProps => ({
			bold: true,
		}),
		subtitle: (): TextProps => ({
			dimColor: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
