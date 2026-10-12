import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
			gap: 1,
		}),
		heading: ({level}: {level: number}): TextProps => {
			if (level === 1) {
				return {bold: true, underline: true, color: 'cyan'};
			}

			if (level === 2) {
				return {bold: true, color: 'cyan'};
			}

			return {bold: true};
		},
		paragraph: (): TextProps => ({}),
		listBullet: (): TextProps => ({
			dimColor: true,
		}),
		code: (): TextProps => ({
			color: 'yellow',
		}),
		codeBlock: (): BoxProps => ({
			paddingLeft: 2,
		}),
		blockquote: (): BoxProps => ({
			borderStyle: 'single',
			borderTop: false,
			borderBottom: false,
			borderRight: false,
			borderDimColor: true,
			paddingLeft: 1,
		}),
		bold: (): TextProps => ({
			bold: true,
		}),
		italic: (): TextProps => ({
			italic: true,
		}),
		link: (): TextProps => ({
			color: 'blue',
			underline: true,
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
