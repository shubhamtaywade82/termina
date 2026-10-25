import {use} from 'react';
import FocusContext, {type Props} from '../components/FocusContext.js';

type Output = {
	/**
	Enable focus management for all components.
	*/
	enableFocus: Props['enableFocus'];

	/**
	Disable focus management for all components. The currently active component (if there's one) will lose its focus.
	*/
	disableFocus: Props['disableFocus'];

	/**
	Switch focus to the next focusable component. If there's no active component right now, focus will be given to the first focusable component. If the active component is the last in the list of focusable components, focus will be switched to the first focusable component. While a `KeyboardCapture` is active, only the focusable components inside its scope are considered.
	*/
	focusNext: Props['focusNext'];

	/**
	Switch focus to the previous focusable component. If there's no active component right now, focus will be given to the last focusable component. If the active component is the first in the list of focusable components, focus will be switched to the last focusable component. While a `KeyboardCapture` is active, only the focusable components inside its scope are considered.
	*/
	focusPrevious: Props['focusPrevious'];

	/**
	Switch focus to the nearest focusable component in `direction` from the focused one. Distance is measured between the centers of the components' on-screen rectangles, with a terminal row counting as two columns. Only components that are active, in reach, and at least partly drawn can take focus, so a component clipped out of a scroll view is skipped. A component takes part only when it passes a `ref` to `useFocus`. When no component lies that way, or none is focused, focus does not change. The function reads no keys, so pair it with `useInput`.
	*/
	focusDirection: Props['focusDirection'];

	/**
	Switch focus to the element with provided `id`. If there's no element with that `id`, focus is not changed.
	*/
	focus: Props['focus'];

	/**
	The ID of the currently focused component, or `undefined` if no component is focused.

	@example
	```tsx
	import {Text, useFocusManager} from '@nemesis-oss/termina-core';

	const Example = () => {
		const {activeId} = useFocusManager();

		return <Text>Focused: {activeId ?? 'none'}</Text>;
	};
	```
	*/
	activeId: Props['activeId'];
};

/**
A React hook that returns methods to enable or disable focus management for all components or manually switch focus to the next or previous components.
*/
const useFocusManager = (): Output => {
	const focusContext = use(FocusContext);

	return {
		enableFocus: focusContext.enableFocus,
		disableFocus: focusContext.disableFocus,
		focusNext: focusContext.focusNext,
		focusPrevious: focusContext.focusPrevious,
		focusDirection: focusContext.focusDirection,
		focus: focusContext.focus,
		activeId: focusContext.activeId,
	};
};

export default useFocusManager;
