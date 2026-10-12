import {type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		key: (): TextProps => ({
			color: 'cyan',
		}),
		string: (): TextProps => ({
			color: 'green',
		}),
		number: (): TextProps => ({
			color: 'yellow',
		}),
		boolean: (): TextProps => ({
			color: 'magenta',
		}),
		null: (): TextProps => ({
			color: 'gray',
		}),
		punctuation: (): TextProps => ({
			dimColor: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
