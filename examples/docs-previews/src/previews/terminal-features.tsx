import {Box, Text} from '@nemesis-oss/termina-core';
import type {Preview} from '../preview.js';

// The docs generator sets FORCE_COLOR=3 before the package loads, so chalk and detectTerminalCapabilities both select the truecolor level when this frame is rendered.
export const previews: readonly Preview[] = [
	{
		id: 'terminal-features-color-truecolor',
		title: 'Colors at truecolor',
		columns: 48,
		caption:
			'Three colored lines rendered with chalk at its truecolor level, which the docs generator forces with FORCE_COLOR=3: a named green, a hex orange, and an RGB blue.',
		element: (
			<Box flexDirection="column">
				<Text color="green">green: named color</Text>
				<Text color="#ff8800">#ff8800: hex color</Text>
				<Text color="rgb(0, 160, 255)">rgb(0, 160, 255): RGB color</Text>
			</Box>
		),
	},
];
