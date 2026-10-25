import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import figures from 'figures';
import {type ComponentTheme} from '../../theme.js';

type Config = {
	marker: string | string[];
};

const theme = {
	styles: {
		list: (): BoxProps => ({
			flexDirection: 'column',
		}),
		listItem: (): BoxProps => ({
			gap: 1,
		}),
		marker: (): TextProps => ({
			dimColor: true,
		}),
		content: (): BoxProps => ({
			flexDirection: 'column',
			flexGrow: 1,
			flexShrink: 1,
		}),
	},
	config: (): Config => ({
		marker: figures.line,
	}),
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
