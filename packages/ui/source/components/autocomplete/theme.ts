import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
		}),
		input: (): TextProps => ({}),
		option: ({isHighlighted}: {isHighlighted: boolean}): TextProps => ({
			color: isHighlighted ? 'blue' : undefined,
		}),
		noMatches: (): TextProps => ({
			dimColor: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
