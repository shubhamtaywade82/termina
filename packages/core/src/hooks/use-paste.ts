import {use, useEffect, useEffectEvent} from 'react';
import KeyboardCaptureContext from '../components/KeyboardCaptureContext.js';
import reconciler from '../reconciler.js';
import {useStdinContext} from './use-stdin.js';

type Options = {
	/**
	Enable or disable the paste handler. Useful when multiple components use `usePaste` and only one should be active at a time.

	@default true
	*/
	isActive?: boolean;
};

/**
A React hook that calls `handler` whenever the user pastes text in the terminal. Bracketed paste mode (`\x1b[?2004h`) is automatically enabled while the hook is active, so pasted text arrives as a single string rather than being misinterpreted as individual key presses.

`usePaste` and `useInput` can be used together in the same component. They operate on separate event channels, so paste content is never forwarded to `useInput` handlers when `usePaste` is active.

```
import {useInput, usePaste} from '@nemesis-oss/termina-core';

const MyInput = () => {
	useInput((input, key) => {
		// Only receives typed characters and key events, not pasted text.
		if (key.return) {
			// Submit
		}
	});

	usePaste((text) => {
		// Receives the full pasted string, including newlines.
		console.log('Pasted:', text);
	});

	return …
};
```
*/
const usePaste = (
	handler: (text: string) => void,
	options: Options = {},
): void => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const {setRawMode, isRawModeSupported, setBracketedPasteMode, internal_eventEmitter, canReceive} =
		useStdinContext();
	const keyboardCapture = use(KeyboardCaptureContext);

	useEffect(() => {
		// Piped stdin cannot enter raw mode, so the hook stays idle there instead of throwing.
		if (options.isActive === false || !isRawModeSupported) {
			return;
		}

		setRawMode(true);
		setBracketedPasteMode(true);

		return () => {
			setRawMode(false);
			setBracketedPasteMode(false);
		};
	}, [options.isActive, isRawModeSupported, setRawMode, setBracketedPasteMode]);

	const handlePaste = useEffectEvent((text: string) => {
		// Paste inside a capture reaches only the top capture's listeners. Paste outside every capture waits until no capture is active.
		if (!canReceive(keyboardCapture?.owner)) {
			return;
		}

		// Use discreteUpdates to assign DiscreteEventPriority to state
		// updates triggered by paste, matching the priority of useInput.
		// @ts-expect-error Types require 5 arguments (fn, a, b, c, d) but only fn is needed at runtime.
		reconciler.discreteUpdates(() => {
			handler(text);
		});
	});

	useEffect(() => {
		if (options.isActive === false) {
			return;
		}

		internal_eventEmitter.on('paste', handlePaste);

		return () => {
			internal_eventEmitter.removeListener('paste', handlePaste);
		};
	}, [options.isActive, internal_eventEmitter]);
};

export default usePaste;
