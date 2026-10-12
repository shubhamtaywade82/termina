import {Box, Text} from '@nemesis-oss/termina-core';
import {ProgressBar, StatusMessage} from '@nemesis-oss/termina-ui';
import type {Preview} from '../preview.js';

export const previews: readonly Preview[] = [
	{
		id: 'index-release-dashboard',
		title: 'Release panel with progress and status',
		columns: 56,
		caption:
			'A bordered panel titled Release 2.4.0 with an Upload ProgressBar at 75 percent, then a success, a warning, and an error StatusMessage.',
		element: (
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor="gray"
				paddingX={1}
				gap={1}
			>
				<Text bold>Release 2.4.0</Text>
				<Box gap={1}>
					<Text>Upload</Text>
					<ProgressBar value={75} />
				</Box>
				<StatusMessage variant="success">Tests passed (182 of 182)</StatusMessage>
				<StatusMessage variant="warning">2 packages are outdated</StatusMessage>
				<StatusMessage variant="error">Signing key expired</StatusMessage>
			</Box>
		),
	},
];
