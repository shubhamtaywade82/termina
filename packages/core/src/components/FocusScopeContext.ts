import {createContext} from 'react';

// The focus scope of the nearest active `KeyboardCapture`, or `undefined` outside every capture. A focusable reads it when it registers, so Tab can stay inside a capture.
// eslint-disable-next-line @typescript-eslint/naming-convention
const FocusScopeContext = createContext<symbol | undefined>(undefined);

FocusScopeContext.displayName = 'InternalFocusScopeContext';

export default FocusScopeContext;
