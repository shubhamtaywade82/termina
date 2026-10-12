import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'row',
		}),
		track: (): TextProps => ({
			dimColor: true,
		}),
		block: (): TextProps => ({
			color: 'magenta',
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
