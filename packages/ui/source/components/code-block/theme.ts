import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
		}),
		label: (): TextProps => ({
			dimColor: true,
		}),
		lineNumber: ({isHighlighted}: {isHighlighted: boolean}): TextProps => ({
			bold: isHighlighted,
			dimColor: !isHighlighted,
		}),
		code: ({isHighlighted}: {isHighlighted: boolean}): TextProps =>
			isHighlighted ? {backgroundColor: 'gray'} : {},
		gutter: (): BoxProps => ({
			flexShrink: 0,
			paddingRight: 1,
			marginRight: 1,
			borderStyle: 'single',
			borderTop: false,
			borderBottom: false,
			borderLeft: false,
			borderDimColor: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
