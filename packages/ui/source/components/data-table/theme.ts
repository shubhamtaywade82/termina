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
		// Cells shrink, down to one column, when the row is wider than the container. Their text truncates, so a row stays one line.
		cell: (): BoxProps => ({
			flexShrink: 1,
			minWidth: 1,
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
