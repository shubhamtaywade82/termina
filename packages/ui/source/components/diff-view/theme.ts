import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
		}),
		header: (): TextProps => ({
			bold: true,
		}),
		hunk: (): TextProps => ({
			color: 'cyan',
		}),
		added: (): TextProps => ({
			color: 'green',
		}),
		removed: (): TextProps => ({
			color: 'red',
		}),
		context: (): TextProps => ({}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
