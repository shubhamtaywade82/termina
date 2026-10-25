import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const YELLOW_FROM_PERCENT = 70;
const RED_FROM_PERCENT = 90;

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'row',
			gap: 1,
		}),
		label: (): TextProps => ({}),
		filled: (): TextProps => ({}),
		empty: (): TextProps => ({
			dimColor: true,
		}),
		value: (): TextProps => ({}),
	},
	config({value}: {value: number}) {
		return value >= RED_FROM_PERCENT
			? {color: 'red'}
			: {color: value >= YELLOW_FROM_PERCENT ? 'yellow' : 'green'};
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
