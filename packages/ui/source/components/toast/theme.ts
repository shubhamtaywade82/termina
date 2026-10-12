import {type BoxProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			paddingX: 1,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
