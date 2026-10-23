import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
		}),
		header: (): TextProps => ({
			bold: true,
		}),
		row: (): BoxProps => ({
			flexDirection: 'row',
			gap: 2,
			minHeight: 1,
		}),
		// Cells shrink, down to one column, when the row is wider than the container. Their text truncates, so a row stays one line.
		cell: ({align}: {align: 'left' | 'right'}): BoxProps => ({
			flexShrink: 1,
			minWidth: 1,
			justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
		}),
		separator: (): TextProps => ({
			dimColor: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
