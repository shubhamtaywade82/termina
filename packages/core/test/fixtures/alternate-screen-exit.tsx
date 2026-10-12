import process from 'node:process';
import React, {useEffect} from 'react';
import {render, Text, useApp, useInput} from '../../src/index.js';

// Runs on the alternate screen and leaves it either through the app's own `q` binding or through the default Ctrl+C handling. The pty test checks what the terminal is left with in both cases.
function Screen() {
	const {exit} = useApp();

	useInput(input => {
		if (input === 'q') {
			exit();
		}
	});

	useEffect(() => {
		process.stdout.write('__READY__');
	}, []);

	return <Text>alternate screen</Text>;
}

render(<Screen />, {alternateScreen: true});
