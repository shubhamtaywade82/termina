import {Box, Text} from '@nemesis-oss/termina-core';
import type {Preview} from '../preview.js';

// The same JSX as the counter in the page's first app. renderToString does not run timers, so the frame is drawn at a fixed count.
const Counter = ({count}: {readonly count: number}) => (
	<Box borderStyle="round" paddingX={1}>
		<Text color="green">Ticks: {count}</Text>
	</Box>
);

export const previews: readonly Preview[] = [
	{
		id: 'getting-started-counter',
		title: 'app.tsx, third tick',
		columns: 40,
		caption: 'The frame the counter app draws at the third tick. The app exits right after it.',
		element: <Counter count={3} />,
	},
];
