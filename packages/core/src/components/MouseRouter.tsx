import {useState} from 'react';
import {type DOMElement} from '../dom.js';
import useMouse from '../hooks/use-mouse.js';
import useStdin from '../hooks/use-stdin.js';
import {MouseDispatcher} from '../mouse-dispatch.js';

// Mounted only when `render(..., {mouse: true})` is set. Mounting it turns mouse tracking on, and unmounting turns it off.
const MouseRouter = ({root}: {readonly root: DOMElement}) => {
	const [dispatcher] = useState(() => new MouseDispatcher());
	// Mouse reports need raw mode. Piped stdin cannot provide it, so the app renders without mouse support instead of throwing.
	const {isRawModeSupported} = useStdin();

	useMouse(
		event => {
			dispatcher.dispatch(root, event);
		},
		{isActive: isRawModeSupported},
	);

	return null;
};

export default MouseRouter;
