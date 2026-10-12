import {Box} from '@nemesis-oss/termina-core';
import {
	Alert,
	Badge,
	ProgressBar,
	Spinner,
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
		id: 'overview-tour',
		title: 'Four components, default states',
		columns: 56,
		caption:
			'An info Alert with a title, a Badge whose label is uppercased to BETA on the default magenta background, a ProgressBar at 40 percent, and a Spinner labeled Deploying at its first animation frame.',
		element: (
			<Box flexDirection="column" gap={1}>
				<Alert variant="info" title="Deploy">
					Choose a target, then enter a tag.
				</Alert>
				<Badge>beta</Badge>
				<ProgressBar value={40} />
				<Spinner label="Deploying" />
			</Box>
		),
	},
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
