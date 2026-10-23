import {useEffect, use, useId, useState, type RefObject} from 'react';
import FocusContext from '../components/FocusContext.js';
import FocusScopeContext from '../components/FocusScopeContext.js';
import {type DOMElement} from '../dom.js';
import useStdin from './use-stdin.js';

type Input = {
	/**
	Enable or disable this component's focus, while still maintaining its position in the list of focusable components.
	*/
	isActive?: boolean;

	/**
	Auto-focus this component if there's no active (focused) component right now.
	*/
	autoFocus?: boolean;

	/**
	Assign an ID to this component, so it can be programmatically focused with `focus(id)`. The ID must be unique among focusable components.
	*/
	id?: string;

	/**
	The `Box` this component renders, so `focusDirection` in `useFocusManager` can place it on screen. Without a ref, the component takes part only in Tab order.
	*/
	// eslint-disable-next-line @typescript-eslint/no-restricted-types -- React ref objects are typed with null until the element mounts.
	ref?: RefObject<DOMElement | null>;
};

type Output = {
	/**
	Determines whether this component is focused.
	*/
	isFocused: boolean;

	/**
	Allows focusing a specific element with the provided `id`.
	*/
	focus: (id: string) => void;
};

/**
A React hook that returns focus state and focus controls for the current component.
A component that uses the `useFocus` hook becomes "focusable" to Ink, so when the user presses <kbd>Tab</kbd>, Ink will switch focus to this component. If there are multiple components that execute the `useFocus` hook, focus will be given to them in registration order. Reordering keyed components does not change their registration order.
*/
const useFocus = ({
	isActive = true,
	autoFocus = false,
	id: customId,
	ref,
}: Input = {}): Output => {
	const {isRawModeSupported, setRawMode} = useStdin();
	const {
		activeId,
		add,
		remove,
		setScope,
		setElement,
		activate,
		deactivate,
		focus,
	} = use(FocusContext);
	const scope = use(FocusScopeContext);

	const generatedId = useId();
	const id = customId ?? generatedId;
	// Each hook instance registers under its own token, so a shared id cannot make one registration remove another.
	const [token] = useState(() => Symbol('focus-registration'));

	useEffect(() => {
		add(id, {autoFocus, token});

		return () => {
			remove(token);
		};
	}, [id, autoFocus, token, add, remove]);

	// The scope is set in its own effect. A change of scope then updates this registration in place, instead of re-registering it at the end of the focus order.
	useEffect(() => {
		setScope(token, scope);
	}, [scope, token, setScope]);

	// Like the scope, the element is updated in place, so a new ref does not move this component in the focus order.
	useEffect(() => {
		setElement(token, ref);
	}, [ref, token, setElement]);

	useEffect(() => {
		// Reapply active state when autoFocus changes and re-registers this component.
		if (isActive) {
			activate(id);
		} else {
			deactivate(id);
		}
	}, [isActive, id, autoFocus, activate, deactivate]);

	useEffect(() => {
		if (!isRawModeSupported || !isActive) {
			return;
		}

		setRawMode(true);

		return () => {
			setRawMode(false);
		};
	}, [isActive, isRawModeSupported, setRawMode]);

	return {
		isFocused: activeId === id,
		focus,
	};
};

export default useFocus;
