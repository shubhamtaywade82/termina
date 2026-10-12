import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
		}),
		headerCell: ({isFocused}: {readonly isFocused: boolean}): TextProps => ({
			bold: true,
			underline: isFocused,
		}),
		row: ({isFocused}: {readonly isFocused: boolean}): BoxProps => ({
			flexDirection: 'row',
			gap: 2,
			minHeight: 1,
			backgroundColor: isFocused ? 'blue' : undefined,
		}),
		cell: (): BoxProps => ({
			flexShrink: 0,
		}),
		separator: (): TextProps => ({
			dimColor: true,
		}),
		sortIndicator: (): TextProps => ({
			color: 'cyan',
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
