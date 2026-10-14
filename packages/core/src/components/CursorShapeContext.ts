import {createContext} from 'react';
import {type CursorShape} from '../cursor-shape.js';

export type Props = {
	/**
	Request `shape` for the cursor under `id`. Pass `undefined` to release the request.
	*/
	readonly set: (id: string, shape: CursorShape | undefined) => void;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const CursorShapeContext = createContext<Props>({
	set() {},
});

CursorShapeContext.displayName = 'InternalCursorShapeContext';

export default CursorShapeContext;
