import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

export type TokenCounterStatus = 'ok' | 'warning' | 'over';

const STATUS_COLORS: Record<TokenCounterStatus, string> = {
	ok: 'green',
	warning: 'yellow',
	over: 'red',
};

const theme = {
	styles: {
		container: (): BoxProps => ({
			gap: 1,
		}),
		count: ({status}: {status: TokenCounterStatus}): TextProps => ({
			color: STATUS_COLORS[status],
		}),
		label: (): TextProps => ({}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
