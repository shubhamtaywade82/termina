import {use, useEffect, useEffectEvent} from 'react';
import KeyboardCaptureContext from '../components/KeyboardCaptureContext.js';
import reconciler from '../reconciler.js';
import {type MouseEvent} from '../mouse.js';
import {useStdinContext} from './use-stdin.js';

type Options = {
	/**
	Enable or disable the mouse handler. Useful when multiple components use `useMouse` and only one should be active at a time.

	@default true
	*/
	isActive?: boolean;
};

/**
A React hook that calls `handler` for every mouse report: presses, releases, drags, and wheel steps.

Mouse tracking (`?1000h`, `?1002h`, `?1006h`) is enabled while at least one active `useMouse` is mounted, and it is released when the last one unmounts or the terminal is suspended. Mouse reports are never forwarded to `useInput`.

```
import {useMouse} from '@nemesis-oss/termina-core';

const Clickable = () => {
	useMouse(event => {
		if (event.action === 'wheel' && event.button === 'wheelUp') {
			// Scroll up
		}
	});

	return …
};
```
*/
const useMouse = (
	handler: (event: MouseEvent) => void,
	options: Options = {},
): void => {
	const {
		setRawMode,
		isRawModeSupported,
		setMouseTracking,
		internal_eventEmitter: eventEmitter,
		canReceive,
	} = useStdinContext();
	const keyboardCapture = use(KeyboardCaptureContext);

	useEffect(() => {
		// Piped stdin cannot enter raw mode, so the hook stays idle there instead of throwing.
		if (!isRawModeSupported || options.isActive === false) {
			return;
		}

		// Reports only arrive while stdin is read, and stdin is read only in raw mode. Taking raw mode here is what makes a mouse-only component work without useInput.
		setRawMode(true);
		setMouseTracking(true);

		return () => {
			setMouseTracking(false);
			setRawMode(false);
		};
	}, [options.isActive, isRawModeSupported, setRawMode, setMouseTracking]);

	const handleMouse = useEffectEvent((event: MouseEvent) => {
		// Reports inside a capture reach only the top capture's listeners. Reports outside every capture wait until no capture is active.
		if (!canReceive(keyboardCapture?.owner)) {
			return;
		}

		// Same priority as useInput and usePaste, so a click is handled in the same batch as the state it changes.
		// @ts-expect-error Types require 5 arguments (fn, a, b, c, d) but only fn is needed at runtime.
		reconciler.discreteUpdates(() => {
			handler(event);
		});
	});

	useEffect(() => {
		if (options.isActive === false) {
			return;
		}

		eventEmitter.on('mouse', handleMouse);

		return () => {
			eventEmitter.removeListener('mouse', handleMouse);
		};
	}, [options.isActive, eventEmitter]);
};

export default useMouse;
