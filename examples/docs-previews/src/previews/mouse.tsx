import {Box, Text} from '@nemesis-oss/termina-core';
import type {Preview} from '../preview.js';

// The click counter from the Enabling mouse section, before any click. The onClick handler is left out because it does not change the frame. Box has no prop that draws a pressed or active style (aria-state changes only screen-reader output), so the frame shows only the normal state.
const clicks = 0;

export const previews: readonly Preview[] = [
	{
		id: 'mouse-button-default',
		title: 'Button before any click',
		columns: 40,
		caption:
			'A round-bordered Box that reads Clicked 0 times, with Press q to quit below it, which is the click counter before any click.',
		element: (
			<Box flexDirection="column">
				<Box borderStyle="round" paddingX={1}>
					<Text>Clicked {clicks} times</Text>
				</Box>
				<Text>Press q to quit</Text>
			</Box>
		),
	},
];
