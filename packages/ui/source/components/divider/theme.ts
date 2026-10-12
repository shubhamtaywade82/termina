import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		// A row sizes its children to their content, so the row needs a width for the rule to fill.
		// flexGrow would leave siblings unsqueezed, but it would also let the rule take spare height
		// in a fixed-height column.
		container: (): BoxProps => ({
			flexDirection: 'row',
			gap: 1,
			width: '100%',
		}),
		// Keeps the two-column lead from shrinking when a long title takes the row.
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
