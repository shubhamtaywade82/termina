import {use, useCallback} from 'react';
import FocusContext from '../components/FocusContext.js';
import FocusScopeContext from '../components/FocusScopeContext.js';

type Output = {
	/**
	Focus the first active focusable component in the scope of the nearest active `KeyboardCapture`. Outside every capture, it focuses the first component that is not in a capture.
	*/
	focusFirstInScope: () => void;
};

/**
A React hook for the focus scope of the nearest active `KeyboardCapture`. Call it in a component rendered inside the capture. That component can call `focusFirstInScope` when it opens, so focus moves into the dialog.

```
import {useEffect} from 'react';
import {KeyboardCapture, Text, useFocusScope} from '@nemesis-oss/termina-core';

const DialogBody = () => {
	const {focusFirstInScope} = useFocusScope();

	useEffect(() => {
		focusFirstInScope();
	}, [focusFirstInScope]);

	return <Text>Dialog</Text>;
};

const Dialog = () => (
	<KeyboardCapture>
		<DialogBody />
	</KeyboardCapture>
);
```
*/
const useFocusScope = (): Output => {
	const scope = use(FocusScopeContext);
	const {focusFirstInScope} = use(FocusContext);

	const focusFirstInCurrentScope = useCallback(() => {
		focusFirstInScope(scope);
	}, [focusFirstInScope, scope]);

	return {focusFirstInScope: focusFirstInCurrentScope};
};

export default useFocusScope;
