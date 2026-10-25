import {type BoxProps, type TextProps} from '@nemesis-oss/termina-core';
import {type ComponentTheme} from '../../theme.js';

export type StepperStatus = 'done' | 'current' | 'pending';

const theme = {
	styles: {
		container: (): BoxProps => ({
			flexDirection: 'column',
		}),
		icon({status}: {status: StepperStatus}): TextProps {
			return status === 'pending'
				? {dimColor: true}
				: {color: status === 'done' ? 'green' : 'blue'};
		},
		label: ({status}: {status: StepperStatus}): TextProps => ({
			bold: status === 'current',
		}),
	},
} satisfies ComponentTheme;

export default theme;
export type Theme = typeof theme;
