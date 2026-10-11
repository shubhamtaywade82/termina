import {useState} from 'react';
import {type DOMElement} from '../dom.js';
import useMouse from '../hooks/use-mouse.js';
import {MouseDispatcher} from '../mouse-dispatch.js';

// Mounted only when `render(..., {mouse: true})` is set. Mounting it turns mouse tracking on, and unmounting turns it off.
const MouseRouter = ({root}: {readonly root: DOMElement}) => {
	const [dispatcher] = useState(() => new MouseDispatcher());

	useMouse(event => {
		dispatcher.dispatch(root, event);
	});

	return null;
};

export default MouseRouter;
