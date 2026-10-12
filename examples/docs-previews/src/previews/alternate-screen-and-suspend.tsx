import {Box, Text} from '@nemesis-oss/termina-core';
import type {Preview} from '../preview.js';

// A fixture layout that uses the Example's initial status text. It is a box ten rows tall with a one-row header, a flexible body and a one-row footer. The status line is a prop, so the frame shows the state the app is in.
const NotesViewer = ({status}: {readonly status: string}) => (
	<Box flexDirection="column" height={10} borderStyle="round">
		<Box height={1} paddingX={1}>
			<Text bold>notes.txt</Text>
		</Box>
		<Box flexGrow={1} paddingX={1}>
			<Text>{status}</Text>
		</Box>
		<Box height={1} paddingX={1}>
			<Text color="gray">e edit  q quit</Text>
		</Box>
	</Box>
);

export const previews: readonly Preview[] = [
	{
		id: 'alternate-screen-and-suspend-viewer-idle',
		title: 'notes viewer, initial status',
		columns: 48,
		caption: 'A rounded box ten rows tall with notes.txt in a one-row header, the status line press e to edit notes.txt, q to quit in a body that takes the remaining rows, and key hints in a one-row footer; the alternate-screen sequences are not part of this frame.',
		element: <NotesViewer status="press e to edit notes.txt, q to quit" />,
	},
];
