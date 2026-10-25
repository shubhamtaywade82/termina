import React, {useState} from 'react';
import {Box, Text, render, useApp, useInput} from '@nemesis-oss/termina-core';
import {Header, KeyHint, Select, StatusMessage} from '@nemesis-oss/termina-ui';

const actions = [
	{label: 'Build', value: 'build'},
	{label: 'Test', value: 'test'},
	{label: 'Deploy', value: 'deploy'},
];

// Core supplies the renderer, input and app control. UI supplies the components. Press q to quit.
function Starter() {
	const {exit} = useApp();
	const [lastAction, setLastAction] = useState<string>();

	useInput(input => {
		if (input === 'q') {
			exit();
		}
	});

	return (
		<Box flexDirection="column" gap={1} paddingX={1}>
			<Header title="Starter" subtitle="a termina app with core and ui" />
			<Text>Choose an action</Text>
			<Select
				options={actions}
				onChange={value => {
					setLastAction(value);
				}}
			/>
			{lastAction === undefined ? (
				<StatusMessage variant="info">Nothing selected yet.</StatusMessage>
			) : (
				<StatusMessage variant="success">{`Selected ${lastAction}.`}</StatusMessage>
			)}
			<Box gap={3}>
				<KeyHint keys="↑↓" label="move" />
				<KeyHint keys="enter" label="choose" />
				<KeyHint keys="q" label="quit" />
			</Box>
		</Box>
	);
}

render(<Starter />);
