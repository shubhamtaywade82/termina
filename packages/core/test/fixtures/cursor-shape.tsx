import process from 'node:process';
import React from 'react';
import {render, Text, useCursorShape} from '../../src/index.js';

// Holds a bar cursor for the whole run. The argument 'timer' exits after a short delay. Anything else keeps running until a signal ends the process.
function Screen() {
	useCursorShape('bar');
	return <Text>cursor shape</Text>;
}

const instance = render(<Screen />);
process.stdout.write('__READY__');

if (process.argv[2] === 'timer') {
	setTimeout(() => {
		instance.unmount();
	}, 50);
} else {
	setInterval(() => {}, 1000);
}
