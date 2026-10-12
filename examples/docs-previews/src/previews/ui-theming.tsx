import {
	ProgressBar,
	ThemeProvider,
	defaultTheme,
	extendTheme,
} from '@nemesis-oss/termina-ui';
import type {Preview} from '../preview.js';

const hashTheme = extendTheme(defaultTheme, {
	components: {
		ProgressBar: {
			config: () => ({
				completedCharacter: '#',
				remainingCharacter: '-',
			}),
		},
	},
});

export const previews: readonly Preview[] = [
	{
		id: 'theming-default-progress-bar',
		title: 'ProgressBar with defaultTheme',
		columns: 40,
		caption:
			'A ProgressBar at 40 percent under defaultTheme, with the default characters and the filled cells in magenta.',
		element: (
			<ThemeProvider theme={defaultTheme}>
				<ProgressBar value={40} />
			</ThemeProvider>
		),
	},
	{
		id: 'theming-extended-progress-bar-config',
		title: 'ProgressBar with extendTheme override',
		columns: 40,
		caption:
			'The same 40 percent ProgressBar after the ProgressBar.config entry is overridden in extendTheme, so filled cells are # and empty cells are -.',
		element: (
			<ThemeProvider theme={hashTheme}>
				<ProgressBar value={40} />
			</ThemeProvider>
		),
	},
];
