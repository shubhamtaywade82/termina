import process from 'node:process';
import React from 'react';
import {render, Text, useInput, useMouse} from '../../src/index.js';

// Holds the alternate screen with raw input, mouse tracking and the kitty keyboard protocol on, so every exit path has all three to restore. The argument picks how the app ends: 'throw' raises an uncaught error once ready. Anything else waits for a signal.
function Screen() {
	useInput(() => {});
	useMouse(() => {});
	return <Text>alternate screen</Text>;
}

render(<Screen />, {
	alternateScreen: true,
	kittyKeyboard: {mode: 'enabled'},
});
process.stdout.write('__READY__');

if (process.argv[2] === 'throw') {
	setTimeout(() => {
		throw new Error('uncaught boom');
	}, 20);
}
