import process from 'node:process';
import React from 'react';
import {render, Text} from '../../src/index.js';

// Holds the alternate screen without useInput, so the terminal stays in cooked mode and Ctrl+Z reaches the process as SIGTSTP. The interval keeps the event loop alive; without it Node runs beforeExit and Ink unmounts at once.
const keepAlive = setInterval(() => {}, 1000);
const app = render(<Text>alternate screen</Text>, {alternateScreen: true});
process.stdout.write('__READY__');

await app.waitUntilExit();
clearInterval(keepAlive);
