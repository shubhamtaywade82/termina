import {Box, Text} from '@nemesis-oss/termina-core';
import type {Preview} from '../preview.js';

// The element from the 'render box with border' test in packages/core/test/render-to-string.tsx. The test renders it at 20 columns and asserts that renderToString returns the boxen output for the same text and border.
const BorderedBox = () => (
	<Box borderStyle="single" width={20}>
		<Text>Bordered</Text>
	</Box>
);

export const previews: readonly Preview[] = [
	{
		id: 'testing-bordered-box',
		title: 'render-to-string.tsx, render box with border',
		columns: 30,
		caption: 'A single-bordered box 20 columns wide around the text Bordered, which is the string the test compares with boxen output for the same width and border.',
		element: <BorderedBox />,
	},
];
