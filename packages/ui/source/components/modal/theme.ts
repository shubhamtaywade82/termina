import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
			borderStyle: 'round',
			borderColor: 'blue',
			backgroundColor: 'black',
			paddingX: 1,
		}),
		title: (): TextProps => ({
			bold: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
