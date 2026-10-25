export const showCursor = '[?25h';
export const hideCursor = '[?25l';
export const enterAltScreen = '[?1049h';
export const exitAltScreen = '[?1049l';
const kittyPop = '[<u';
const mouseOff = '\u{1B}[?1006l\u{1B}[?1002l\u{1B}[?1000l';

const delay = async (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

// Polls until the condition holds. The process and the pty deliver output asynchronously, so a fixed delay would be flaky.
export const waitFor = async (isMet: () => boolean, timeoutMs = 3000) => {
	const deadline = Date.now() + timeoutMs;

	while (!isMet()) {
		if (Date.now() > deadline) {
			throw new Error('Timed out waiting for the terminal state');
		}

		// eslint-disable-next-line no-await-in-loop
		await delay(20);
	}
};

// Output written after the fixture reported it was ready, so the check covers only the exit path.
export const afterReady = (output: string): string =>
	output.slice(output.lastIndexOf('__READY__'));

const restorations: Record<string, string> = {
	'left the alternate screen': exitAltScreen,
	'showed the cursor': showCursor,
	'turned mouse tracking off': mouseOff,
	'popped the kitty keyboard protocol': kittyPop,
};

// Names the restorations missing from the output, so a failure says what was left undone.
export const missingRestorations = (output: string): string[] =>
	Object.entries(restorations)
		.filter(([, sequence]) => !output.includes(sequence))
		.map(([name]) => name);
