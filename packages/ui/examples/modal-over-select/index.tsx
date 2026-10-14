// A Select with a Modal over it. Run from packages/ui with:
//   node --import=tsx examples/modal-over-select/index.tsx
// Press m to open the dialog. While it is open, arrow keys do not move the Select. Escape closes the dialog, and the arrow keys move the Select again. Ctrl+C exits.
import React, {useState} from 'react';
import {Box, render, Text, useInput} from '@nemesis-oss/termina-core';
import {Modal, Select} from '../../source/index.js';

const fruits = [
	{label: 'Apple', value: 'apple'},
	{label: 'Banana', value: 'banana'},
	{label: 'Cherry', value: 'cherry'},
];

function Example() {
	const [isOpen, setIsOpen] = useState(false);
	const [chosen, setChosen] = useState('apple');

	useInput((input) => {
		if (input === 'm') {
			setIsOpen(true);
		}
	});

	return (
		<Box flexDirection="column" width={40} height={8}>
			<Text>{`Chosen: ${chosen}`}</Text>
			<Select
				options={fruits}
				defaultValue="apple"
				visibleOptionCount={3}
				onChange={setChosen}
			/>
			<Text>Press m to open the dialog.</Text>
			<Modal
				isOpen={isOpen}
				title="Dialog"
				width={36}
				onClose={() => {
					setIsOpen(false);
				}}
			>
				<Text>Arrows do not reach the Select.</Text>
				<Text>Press Escape to close.</Text>
			</Modal>
		</Box>
	);
}

render(<Example />, {alternateScreen: true});
