import React, {use, useLayoutEffect, useMemo, useState} from 'react';
import KeyboardCaptureContext, {
	type Props as CaptureValue,
} from './components/KeyboardCaptureContext.js';
import {useStdinContext} from './hooks/use-stdin.js';

export type Props = {
	/**
	Whether the capture is active. While it is `false`, its children behave as if this capture were not there.

	@default true
	*/
	readonly isActive?: boolean;

	readonly children?: React.ReactNode;
};

/**
Pushes the capture onto the app's stack while `isActive` is true, and pops it on release or unmount. Returns the value that describes this capture to its children.
*/
const useKeyboardCapture = ({
	isActive,
	depth,
}: {
	readonly isActive: boolean;
	readonly depth: number;
}): CaptureValue => {
	const {registerCapture} = useStdinContext();
	const [owner] = useState(() => Symbol('keyboard-capture'));
	const [scope] = useState(() => Symbol('keyboard-capture-scope'));

	// A layout effect runs in the same commit as the render, so the capture is in place before the next input event is read, and its cleanup pops it on release or unmount.
	useLayoutEffect(
		() => (isActive ? registerCapture(owner, depth) : undefined),
		[isActive, depth, registerCapture, owner],
	);

	return useMemo(() => ({owner, scope, depth}), [owner, scope, depth]);
};

/**
A React component that makes the input inside it the only input the app delivers while it is active. Keys, paste and mouse reports go to the `useInput`, `usePaste` and `useMouse` listeners inside the capture. Listeners outside it receive nothing. Captures nest: the innermost active capture decides.

Ctrl+C still exits the app, and Escape does not clear focus while a capture is active. Suspending the terminal keeps the capture.

```
import {KeyboardCapture, Text, useInput} from '@nemesis-oss/termina-core';

const DialogBody = () => {
	// Receives keys only while the dialog is the innermost capture.
	useInput(input => {
		console.log(input);
	});

	return <Text>Dialog</Text>;
};

const Dialog = () => (
	<KeyboardCapture>
		<DialogBody />
	</KeyboardCapture>
);
```
*/
const KeyboardCapture = ({
	isActive = true,
	children,
}: Props): React.ReactNode => {
	const outer = use(KeyboardCaptureContext);
	const captured = useKeyboardCapture({
		isActive,
		depth: (outer?.depth ?? 0) + 1,
	});
	// An inactive capture passes its parent's value through, so its children keep the owner they had before.
	const value = useMemo(
		() => (isActive ? captured : outer),
		[isActive, captured, outer],
	);

	return (
		<KeyboardCaptureContext value={value}>{children}</KeyboardCaptureContext>
	);
};

export default KeyboardCapture;
