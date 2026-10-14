import {EventEmitter} from 'node:events';
import process from 'node:process';
import {createContext} from 'react';

export type PublicProps = {
	/**
	The stdin stream passed to `render()` in `options.stdin`, or `process.stdin` by default. Useful if your app needs to handle user input.
	*/
	readonly stdin: NodeJS.ReadableStream;

	/**
	Ink exposes this function via own `<StdinContext>` to be able to handle Ctrl+C, that's why you should use Ink's `setRawMode` instead of `process.stdin.setRawMode`. If the `stdin` stream passed to Ink does not support setRawMode, this function does nothing.
	*/
	readonly setRawMode: (isEnabled: boolean) => void;

	/**
	A boolean flag determining if the current `stdin` supports `setRawMode`. A component using `setRawMode` might want to use `isRawModeSupported` to nicely fall back in environments where raw mode is not supported.
	*/
	readonly isRawModeSupported: boolean;
};

export type Props = PublicProps & {
	/**
	Enable or disable bracketed paste mode on the terminal. When enabled, pasted text is wrapped in escape sequences that allow it to be distinguished from typed input.
	*/
	readonly setBracketedPasteMode: (isEnabled: boolean) => void;

	/**
	Enable or disable SGR mouse tracking. Reference-counted: tracking stays on while any `useMouse` hook is mounted.
	*/
	readonly setMouseTracking: (isEnabled: boolean) => void;

	readonly internal_exitOnCtrlC: boolean;

	readonly internal_eventEmitter: EventEmitter;

	// Pushes a keyboard capture onto the stack. `depth` is how many captures enclose it, counting itself. The returned function removes that entry.
	readonly registerCapture: (owner: symbol, depth: number) => () => void;

	// Whether input for `owner` may be delivered now. `undefined` is app-level input, which has no owner.
	readonly canReceive: (owner: symbol | undefined) => boolean;
};

/**
`StdinContext` is a React context that exposes the input stream.
*/
// eslint-disable-next-line @typescript-eslint/naming-convention
const StdinContext = createContext<Props>({
	stdin: process.stdin,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	internal_eventEmitter: new EventEmitter(),
	setRawMode() {},
	setBracketedPasteMode() {},
	setMouseTracking() {},
	isRawModeSupported: false,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	internal_exitOnCtrlC: true,
	registerCapture: () => () => {},
	canReceive: () => true,
});

StdinContext.displayName = 'InternalStdinContext';

export default StdinContext;
