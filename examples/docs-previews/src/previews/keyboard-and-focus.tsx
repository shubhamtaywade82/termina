import {Box, Text} from '@nemesis-oss/termina-core';
import type {Preview} from '../preview.js';

// The Field example in the Focus section draws its label with `inverse={isFocused}`. useFocus reports no focus under renderToString, because no focus manager is mounted, so these labels set the same prop directly to show both looks.
const FieldLabel = ({
	label,
	focused,
}: {
	readonly label: string;
	readonly focused: boolean;
}) => <Text inverse={focused}>{label}</Text>;

export const previews: readonly Preview[] = [
	{
		id: 'keyboard-and-focus-focused-field',
		title: 'Focused and unfocused field',
		columns: 40,
		caption:
			'Two field labels: Name is drawn with the inverse style on, and Email is drawn in the plain style.',
		element: (
			<Box flexDirection="column">
				<FieldLabel label="Name" focused />
				<FieldLabel label="Email" focused={false} />
			</Box>
		),
	},
];
