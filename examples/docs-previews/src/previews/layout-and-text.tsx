import {Box, Newline, Spacer, Text} from '@nemesis-oss/termina-core';
import type {Preview} from '../preview.js';

// The StatusBar example from the page's Flex layout section. A row with a border and padding, and a Spacer that takes the space between its two texts.
const StatusBar = () => (
	<Box width={40} paddingX={1} borderStyle="single">
		<Text bold>termina</Text>
		<Spacer />
		<Text color="gray">ready</Text>
	</Box>
);

// The Screen example from the page's Flex layout section. A column of fixed-height rows whose body takes the rows that remain.
const Screen = () => (
	<Box flexDirection="column" height={8} borderStyle="round">
		<Box height={1}>
			<Text>header</Text>
		</Box>
		<Box flexGrow={1} paddingX={1}>
			<Text>The body takes the rows that remain.</Text>
		</Box>
		<Box height={1}>
			<Text color="gray">footer</Text>
		</Box>
	</Box>
);

// The Message example from the Text section. A column 20 columns wide, a truncated line, and a Text that a Newline splits in two.
const Message = () => (
	<Box flexDirection="column" width={20}>
		<Text color="green" bold>
			Build passed
		</Text>
		<Text dimColor wrap="truncate">
			{'3 suites, 42 tests, and a long trailing summary'}
		</Text>
		<Text>
			line one
			<Newline />
			line two
		</Text>
	</Box>
);

export const previews: readonly Preview[] = [
	{
		id: 'layout-and-text-status-bar',
		title: 'StatusBar.tsx, row with Spacer',
		columns: 40,
		caption: 'A single-bordered row 40 columns wide, with termina at the left, ready at the right, and one column of padding on each side.',
		element: <StatusBar />,
	},
	{
		id: 'layout-and-text-column-screen',
		title: 'Screen.tsx, header, body, footer',
		columns: 40,
		caption: 'A rounded box 8 rows tall with a one-row header, a body that takes the remaining rows, and a one-row footer.',
		element: <Screen />,
	},
	{
		id: 'layout-and-text-newline-truncate',
		title: 'Message.tsx, Newline and truncation',
		columns: 30,
		caption: 'A column 20 columns wide with a bold green line, a dimmed line cut to one row with an ellipsis, and a Text that a Newline splits into two rows.',
		element: <Message />,
	},
];
