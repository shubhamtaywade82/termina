import {Box, Text} from '@nemesis-oss/termina-core';
import {
	ProgressBar,
	Select,
	StatusMessage,
	TextInput,
	ThemeProvider,
	UnorderedList,
	defaultTheme,
	extendTheme,
} from '@nemesis-oss/termina-ui';
import type {Preview} from '../preview.js';

const environments = [
	{label: 'Development', value: 'development'},
	{label: 'Staging', value: 'staging'},
	{label: 'Production', value: 'production'},
];

const configFiles = [
	{label: 'config.json', value: 'json'},
	{label: 'config.yaml', value: 'yaml'},
	{label: 'package.json', value: 'package'},
];

const depthMarkerTheme = extendTheme(defaultTheme, {
	components: {
		UnorderedList: {
			config: () => ({
				marker: ['■', '–'],
			}),
		},
	},
});

export const previews: readonly Preview[] = [
	{
		id: 'progress-bar-empty',
		title: 'ProgressBar at 0',
		columns: 40,
		caption:
			'A ProgressBar with value 0, so no cells are completed and the full 40-column width is drawn as the dimmed light shade character.',
		element: <ProgressBar value={0} />,
	},
	{
		id: 'progress-bar-half',
		title: 'ProgressBar at 50',
		columns: 40,
		caption:
			'A ProgressBar with value 50, so the first 20 of its 40 columns are drawn as magenta solid squares and the other 20 as the dimmed light shade character.',
		element: <ProgressBar value={50} />,
	},
	{
		id: 'progress-bar-full',
		title: 'ProgressBar at 100',
		columns: 40,
		caption:
			'A ProgressBar with value 100, so all 40 columns are drawn as magenta solid squares and none are left as remaining cells.',
		element: <ProgressBar value={100} />,
	},
	{
		id: 'select-default-value',
		title: 'Select with defaultValue',
		columns: 40,
		caption:
			'A Select with three options and defaultValue staging, so Staging has a green label and a green check mark while the blue pointer stays on Development, the first option, because focus starts there.',
		element: <Select options={environments} defaultValue="staging" />,
	},
	{
		id: 'select-disabled',
		title: 'Disabled Select with defaultValue',
		columns: 40,
		caption:
			'A disabled Select with defaultValue staging, so no focus pointer is drawn and Staging keeps its green label and green check mark.',
		element: (
			<Select options={environments} defaultValue="staging" isDisabled />
		),
	},
	{
		id: 'select-highlight-text',
		title: 'Select with highlightText',
		columns: 40,
		caption:
			'A Select with highlightText set to config, so the word config is bold in config.json and config.yaml, and package.json has no bold text.',
		element: <Select options={configFiles} highlightText="config" />,
	},
	{
		id: 'text-input-placeholder',
		title: 'Empty TextInput with placeholder',
		columns: 40,
		caption:
			'An empty TextInput with the placeholder type a command, where the first letter t is drawn inverse with the cursor on it and the rest of the placeholder is dimmed.',
		element: <TextInput placeholder="type a command" />,
	},
	{
		id: 'text-input-value',
		title: 'TextInput with a value',
		columns: 40,
		caption:
			'A TextInput with defaultValue deploy, so the value is drawn with the cursor as an inverse space after the last letter.',
		element: <TextInput defaultValue="deploy" />,
	},
	{
		id: 'text-input-completion',
		title: 'TextInput with a suggestion',
		columns: 40,
		caption:
			'A TextInput with defaultValue de and suggestions deploy, destroy, and status, so the completion ploy follows de, with p drawn inverse as the cursor and loy dimmed.',
		element: (
			<TextInput
				defaultValue="de"
				suggestions={['deploy', 'destroy', 'status']}
			/>
		),
	},
	{
		id: 'status-message-variants',
		title: 'StatusMessage in each variant',
		columns: 40,
		caption:
			'Four StatusMessage rows, one for each variant, with the icon and color that name each kind: success in green, info in blue, warning in yellow, and error in red.',
		element: (
			<Box flexDirection="column" gap={1}>
				<StatusMessage variant="success">Saved 3 files</StatusMessage>
				<StatusMessage variant="info">Watching for changes</StatusMessage>
				<StatusMessage variant="warning">
					The timeout key is deprecated
				</StatusMessage>
				<StatusMessage variant="error">
					Upload failed: connection reset
				</StatusMessage>
			</Box>
		),
	},
	{
		id: 'status-message-wrap',
		title: 'StatusMessage that wraps',
		columns: 30,
		caption:
			'An error StatusMessage in a 26-column box, where the message wraps onto a second line that starts under the message text, not under the cross icon.',
		element: (
			<Box width={26}>
				<StatusMessage variant="error">
					Upload failed: connection reset by peer
				</StatusMessage>
			</Box>
		),
	},
	{
		id: 'unordered-list-nested',
		title: 'UnorderedList with nested items',
		columns: 40,
		caption:
			'A two-level UnorderedList with the default marker, where Keyboard input has the nested items Arrow keys and Enter to submit indented two columns under it.',
		element: (
			<UnorderedList>
				<UnorderedList.Item>
					<Text>Fast startup</Text>
				</UnorderedList.Item>
				<UnorderedList.Item>
					<Text>Keyboard input</Text>
					<UnorderedList>
						<UnorderedList.Item>
							<Text>Arrow keys</Text>
						</UnorderedList.Item>
						<UnorderedList.Item>
							<Text>Enter to submit</Text>
						</UnorderedList.Item>
					</UnorderedList>
				</UnorderedList.Item>
			</UnorderedList>
		),
	},
	{
		id: 'unordered-list-depth-markers',
		title: 'UnorderedList with depth markers',
		columns: 40,
		caption:
			'A three-level UnorderedList under a theme whose marker array is ■ and –, so depth 0 uses ■, and depths 1 and 2 use – because the last array entry is reused.',
		element: (
			<ThemeProvider theme={depthMarkerTheme}>
				<UnorderedList>
					<UnorderedList.Item>
						<Text>Top level</Text>
						<UnorderedList>
							<UnorderedList.Item>
								<Text>Nested</Text>
								<UnorderedList>
									<UnorderedList.Item>
										<Text>Deeper</Text>
									</UnorderedList.Item>
								</UnorderedList>
							</UnorderedList.Item>
						</UnorderedList>
					</UnorderedList.Item>
				</UnorderedList>
			</ThemeProvider>
		),
	},
];
