import {Box, Text} from '@nemesis-oss/termina-core';
import type {Preview} from '../preview.js';

// The same frame at two widths. The paragraph wraps to the width the root has, so a narrow width shows the rows a reader sees after a resize. The header and footer keep the frame recognisable.
const paragraph =
	'This paragraph wraps to the width of the terminal. A narrower terminal wraps it onto more rows, so the frame grows taller.';

const Frame = () => (
	<Box flexDirection="column" borderStyle="round" paddingX={1}>
		<Text bold>status</Text>
		<Text>{paragraph}</Text>
		<Text color="gray">press q to quit</Text>
	</Box>
);

export const previews: readonly Preview[] = [
	{
		id: 'resize-wide',
		title: 'Frame.tsx, 60 columns',
		columns: 60,
		caption: 'The frame at 60 columns, where the paragraph wraps to three rows and the whole frame is seven rows tall.',
		element: <Frame />,
	},
	{
		id: 'resize-narrow',
		title: 'Frame.tsx, 34 columns',
		columns: 34,
		caption: 'The same frame at 34 columns, where the same paragraph wraps to five rows and the whole frame is nine rows tall.',
		element: <Frame />,
	},
];
