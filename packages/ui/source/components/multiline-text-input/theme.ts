import {type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		value: (): TextProps => ({}),
		cursor: (): TextProps => ({inverse: true}),
		placeholder: (): TextProps => ({dimColor: true}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
