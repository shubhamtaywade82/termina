import {Box, Text} from '@nemesis-oss/termina-core';
import {
	Alert,
	Badge,
	ConfirmInput,
	EmailInput,
	MultiSelect,
	OrderedList,
	PasswordInput,
} from '@nemesis-oss/termina-ui';
import type {Preview} from '../preview.js';

const ignore = () => {};

const toppings = [
	{label: 'Cheese', value: 'cheese'},
	{label: 'Ham', value: 'ham'},
	{label: 'Pineapple', value: 'pineapple'},
	{label: 'Olives', value: 'olives'},
	{label: 'Peppers', value: 'peppers'},
	{label: 'Onions', value: 'onions'},
];

export const previews: readonly Preview[] = [
	{
		id: 'alert-warning-title',
		title: 'Alert, warning variant with title',
		columns: 60,
		caption:
			'A warning Alert with the bold title Deprecated command above its message, inside a yellow rounded border with a warning icon, in a 60-column Box.',
		element: (
			<Box width={60}>
				<Alert variant="warning" title="Deprecated command">
					The sync command is deprecated. Run update instead.
				</Alert>
			</Box>
		),
	},
	{
		id: 'alert-error-no-title',
		title: 'Alert, error variant without title',
		columns: 40,
		caption:
			'An error Alert with no title, so its message is the only text inside a red rounded border with a cross icon, wrapped to the 40-column Box.',
		element: (
			<Box width={40}>
				<Alert variant="error">
					Could not reach the registry. Check your network and try again.
				</Alert>
			</Box>
		),
	},
	{
		id: 'badge-default',
		title: 'Badge with default color',
		columns: 30,
		caption:
			'A Badge with no color prop, so the label beta is uppercased to BETA on the default magenta background.',
		element: <Badge>beta</Badge>,
	},
	{
		id: 'badge-pass-fail',
		title: 'Badge rows, green and red',
		columns: 40,
		caption:
			'Two check rows: PASS on a green background beside lint, and FAIL on a red background beside unit tests.',
		element: (
			<Box flexDirection="column">
				<Box gap={1}>
					<Badge color="green">pass</Badge>
					<Text>lint</Text>
				</Box>
				<Box gap={1}>
					<Badge color="red">fail</Badge>
					<Text>unit tests</Text>
				</Box>
			</Box>
		),
	},
	{
		id: 'confirm-input-default',
		title: 'ConfirmInput, default confirm choice',
		columns: 40,
		caption:
			'The question Delete the build cache? followed by the Y/n hint of a ConfirmInput with the default confirm choice.',
		element: (
			<Box gap={1}>
				<Text>Delete the build cache?</Text>
				<ConfirmInput onConfirm={ignore} onCancel={ignore} />
			</Box>
		),
	},
	{
		id: 'confirm-input-cancel-default',
		title: 'ConfirmInput, default cancel choice',
		columns: 40,
		caption:
			'The same question with defaultChoice set to cancel, so the hint after it is y/N.',
		element: (
			<Box gap={1}>
				<Text>Delete the build cache?</Text>
				<ConfirmInput
					defaultChoice="cancel"
					onConfirm={ignore}
					onCancel={ignore}
				/>
			</Box>
		),
	},
	{
		id: 'confirm-input-disabled',
		title: 'ConfirmInput, disabled',
		columns: 40,
		caption:
			'A disabled ConfirmInput after the question Delete the build cache?, whose Y/n hint is dimmed.',
		element: (
			<Box gap={1}>
				<Text>Delete the build cache?</Text>
				<ConfirmInput isDisabled onConfirm={ignore} onCancel={ignore} />
			</Box>
		),
	},
	{
		id: 'email-input-placeholder',
		title: 'EmailInput, empty with placeholder',
		columns: 40,
		caption:
			'An empty EmailInput under the label Email address, showing the placeholder name@example.com, with its first character drawn as the cursor and the rest dimmed.',
		element: (
			<Box flexDirection="column" gap={1}>
				<Text>Email address</Text>
				<EmailInput placeholder="name@example.com" />
			</Box>
		),
	},
	{
		id: 'email-input-domain-suggestion',
		title: 'EmailInput, domain suggestion',
		columns: 40,
		caption:
			'An EmailInput holding jane@gm, followed by the dimmed completion ail.com, which completes gmail.com, with the first character of the completion drawn as the cursor.',
		element: (
			<Box flexDirection="column" gap={1}>
				<Text>Email address</Text>
				<EmailInput defaultValue="jane@gm" />
			</Box>
		),
	},
	{
		id: 'multi-select-default-selection',
		title: 'MultiSelect with defaultValue',
		columns: 40,
		caption:
			'Five of the six toppings, with Cheese and Olives selected and each showing a tick, and the pointer on Cheese as the focused row; Onions is below the visible rows.',
		element: (
			<MultiSelect
				options={toppings}
				defaultValue={['cheese', 'olives']}
				onSubmit={ignore}
			/>
		),
	},
	{
		id: 'multi-select-highlight-text',
		title: 'MultiSelect with highlightText',
		columns: 40,
		caption:
			'The five visible toppings with highlightText set to e, so the first e in each visible label that contains one is bold, and no topping is selected.',
		element: <MultiSelect options={toppings} highlightText="e" />,
	},
	{
		id: 'ordered-list-nested-steps',
		title: 'OrderedList with nested items',
		columns: 48,
		caption:
			'Three numbered steps, where the middle step has two nested items numbered 2.1. and 2.2. indented under its text.',
		element: (
			<OrderedList>
				<OrderedList.Item>
					<Text>Install dependencies</Text>
				</OrderedList.Item>

				<OrderedList.Item>
					<Text>Build the packages</Text>

					<OrderedList>
						<OrderedList.Item>
							<Text>Build core</Text>
						</OrderedList.Item>

						<OrderedList.Item>
							<Text>Build ui</Text>
						</OrderedList.Item>
					</OrderedList>
				</OrderedList.Item>

				<OrderedList.Item>
					<Text>Run the tests</Text>
				</OrderedList.Item>
			</OrderedList>
		),
	},
	{
		id: 'ordered-list-ten-items',
		title: 'OrderedList with ten items',
		columns: 48,
		caption:
			'Ten numbered items, where the markers 1. through 9. start with a space so that the item text lines up with the marker 10.',
		element: (
			<OrderedList>
				<OrderedList.Item>
					<Text>Clone the repository</Text>
				</OrderedList.Item>
				<OrderedList.Item>
					<Text>Install dependencies</Text>
				</OrderedList.Item>
				<OrderedList.Item>
					<Text>Build the packages</Text>
				</OrderedList.Item>
				<OrderedList.Item>
					<Text>Run the linter</Text>
				</OrderedList.Item>
				<OrderedList.Item>
					<Text>Run the type checker</Text>
				</OrderedList.Item>
				<OrderedList.Item>
					<Text>Run the unit tests</Text>
				</OrderedList.Item>
				<OrderedList.Item>
					<Text>Start the dev server</Text>
				</OrderedList.Item>
				<OrderedList.Item>
					<Text>Open the docs</Text>
				</OrderedList.Item>
				<OrderedList.Item>
					<Text>Commit the change</Text>
				</OrderedList.Item>
				<OrderedList.Item>
					<Text>Push the branch</Text>
				</OrderedList.Item>
			</OrderedList>
		),
	},
	{
		id: 'password-input-placeholder',
		title: 'PasswordInput, empty with placeholder',
		columns: 40,
		caption:
			'An empty PasswordInput under the label API key, showing the unmasked placeholder Paste your key, with its first character drawn as the cursor and the rest dimmed.',
		element: (
			<Box flexDirection="column" gap={1}>
				<Text>API key</Text>
				<PasswordInput placeholder="Paste your key" />
			</Box>
		),
	},
	{
		id: 'password-input-disabled-placeholder',
		title: 'PasswordInput, disabled with placeholder',
		columns: 40,
		caption:
			'A disabled PasswordInput under the label API key, showing the placeholder Paste your key dimmed, with no cursor.',
		element: (
			<Box flexDirection="column" gap={1}>
				<Text>API key</Text>
				<PasswordInput isDisabled placeholder="Paste your key" />
			</Box>
		),
	},
];
