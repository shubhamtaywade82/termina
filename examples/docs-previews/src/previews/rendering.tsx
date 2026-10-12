import {Box, Static, Text} from '@nemesis-oss/termina-core';
import type {Preview} from '../preview.js';

// The Build component from the page's Static example, with its state passed in as props. `done` is what `setDone` would have collected, and `current` is the step the live line names.
const Build = ({done, current}: {readonly done: readonly string[]; readonly current: string}) => (
	<Box flexDirection="column">
		<Static items={[...done]}>
			{step => <Text key={step} color="green">{`ok ${step}`}</Text>}
		</Static>
		<Text>{`running ${current}`}</Text>
	</Box>
);

const modes = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] as const;

// One row per justifyContent value. Each row has a label column and a bordered Box whose two children are laid out along the row.
const JustifyModes = () => (
	<Box flexDirection="column">
		{modes.map(mode => (
			<Box key={mode} alignItems="center">
				<Box width={16}>
					<Text color="gray">{mode}</Text>
				</Box>
				<Box width={32} justifyContent={mode} borderStyle="single">
					<Text color="cyan">[a]</Text>
					<Text color="magenta">[b]</Text>
				</Box>
			</Box>
		))}
	</Box>
);

export const previews: readonly Preview[] = [
	{
		id: 'rendering-static-live-region',
		title: 'Build.tsx, two steps done',
		columns: 40,
		caption: 'Two completed steps sit above the live line, which names the step that is still running.',
		element: <Build done={['install', 'compile']} current="test" />,
	},
	{
		id: 'rendering-flex-justify',
		title: 'JustifyModes.tsx, justifyContent values',
		columns: 48,
		caption: 'Each row places two children in a bordered Box with one justifyContent value, from flex-start at the top to space-evenly at the bottom.',
		element: <JustifyModes />,
	},
];
