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
		filled: ({color}: {color: string}): TextProps => ({
			color,
		}),
		empty: (): TextProps => ({
			dimColor: true,
		}),
		value: (): TextProps => ({}),
	},
	config: ({value}: {value: number}) => {
		if (value >= RED_FROM_PERCENT) {
			return {color: 'red'};
		}

		if (value >= YELLOW_FROM_PERCENT) {
			return {color: 'yellow'};
		}

		return {color: 'green'};
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
