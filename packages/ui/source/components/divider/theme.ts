import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		// A row parent sizes its children to their content, so the rule needs an explicit width to fill it.
		container: (): BoxProps => ({
			flexDirection: 'row',
			gap: 1,
			width: '100%',
		}),
		// Keeps the lead and the rule at their width when a long title takes the row.
		line: (): BoxProps => ({
			borderStyle: 'single',
			borderBottom: false,
			borderLeft: false,
			borderRight: false,
			borderColor: 'gray',
			flexShrink: 0,
		}),
		title: (): TextProps => ({
			bold: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
