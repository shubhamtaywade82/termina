import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
			borderStyle: 'round',
			borderColor: 'blue',
			gap: 1,
			paddingX: 1,
		}),
		title: (): TextProps => ({
			bold: true,
		}),
		body: (): BoxProps => ({
			flexDirection: 'column',
		}),
		footer: (): TextProps => ({
			dimColor: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
