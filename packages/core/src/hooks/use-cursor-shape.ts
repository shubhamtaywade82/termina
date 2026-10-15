import {use, useId, useLayoutEffect} from 'react';
import CursorShapeContext from '../components/CursorShapeContext.js';
import {type CursorShape} from '../cursor-shape.js';

/**
A React hook that sets the terminal cursor shape while the component is mounted. The shape returns to the terminal's own default when the component unmounts.

When several components request a shape, the most recent request is the one shown. Releasing it shows the request before it.

The shape is steady (it does not blink). Ink writes it only on an interactive terminal, so output that is not a terminal is unaffected. It is reset before `suspendTerminal()` hands the terminal to a child process, and set again when Ink takes it back.

```
import {useCursorShape} from '@nemesis-oss/termina-core';

const Prompt = () => {
	useCursorShape('bar');

	return …;
};
```
*/
const useCursorShape = (shape: CursorShape): void => {
	const id = useId();
	const {set} = use(CursorShapeContext);

	useLayoutEffect(() => {
		set(id, shape);

		return () => {
			set(id, undefined);
		};
	}, [id, set, shape]);
};

export default useCursorShape;
