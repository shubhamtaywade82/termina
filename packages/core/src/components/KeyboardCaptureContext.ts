import {createContext} from 'react';

export type Props = {
	/**
	Identifies the nearest active `KeyboardCapture`. Input listeners below it receive events only while this owner is the top of the capture stack.
	*/
	readonly owner: symbol;

	/**
	Identifies the focus scope of the nearest active `KeyboardCapture`. Focus navigation uses it to keep Tab inside the capture.
	*/
	readonly scope: symbol;

	/**
	How many captures enclose this one, counting itself. The capture stack takes the deepest entry as the top, because layout effects run child first and push order cannot express nesting.
	*/
	readonly depth: number;
};

// Undefined outside every active capture, so listeners there are app-level.
// eslint-disable-next-line @typescript-eslint/naming-convention
const KeyboardCaptureContext = createContext<Props | undefined>(undefined);

KeyboardCaptureContext.displayName = 'InternalKeyboardCaptureContext';

export default KeyboardCaptureContext;
