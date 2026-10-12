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
		cell: ({align}: {align: 'left' | 'right'}): BoxProps => ({
			flexShrink: 0,
			justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
		}),
		separator: (): TextProps => ({
			dimColor: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
