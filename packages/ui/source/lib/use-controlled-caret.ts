import {
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
	type RefObject,
} from 'react';
import {clampToBoundary} from './grapheme.js';
import {type TextEditState} from './text-edit-reducer.js';

export type UseControlledCaretProps = {
	// The controlled value, or undefined when the input is uncontrolled.
	value: string | undefined;

	// The caret offset before the first commit.
	initialCursor: number;

	// The edit state the handlers read. The hook refreshes it at each commit.
	latest: RefObject<TextEditState>;
};

export type ControlledCaret = {
	// The edit state of a controlled input: the parent's value and the shown caret, clamped to it. Undefined when the input is uncontrolled.
	controlled: TextEditState | undefined;

	// Records an edit the handler has just applied. The caret moves only once the parent stores that edit.
	recordEdit: (next: TextEditState) => void;

	// Moves the caret of a controlled input. A cursor move changes no value, so the parent has nothing to refuse.
	moveCaret: (cursorOffset: number) => void;
};

// For a controlled input, the caret is the one the user left. An edit moves it only after the parent stores that edit, so a key the parent rejects leaves the caret where it was.
export const useControlledCaret = ({
	value,
	initialCursor,
	latest,
}: UseControlledCaretProps): ControlledCaret => {
	const isControlled = value !== undefined;
	const [shownCursor, setShownCursor] = useState(initialCursor);
	const pendingEditRef = useRef<TextEditState | undefined>(undefined);
	// The controlled value at the previous commit. A changed value means the parent stored an edit, even one it transformed.
	const committedValueRef = useRef<string | undefined>(undefined);

	// Runs after every commit, once the parent has answered the last edit.
	// eslint-disable-next-line react-hooks/exhaustive-deps -- The effect must run after every commit, so it has no dependency list. An edit is accepted when the parent stored its value and dropped otherwise. Either way the next key starts from what the parent holds, not from the refused edit.
	useLayoutEffect(() => {
		if (value === undefined) {
			return;
		}

		const pending = pendingEditRef.current;
		pendingEditRef.current = undefined;
		const isStored = value !== committedValueRef.current;
		committedValueRef.current = value;
		const cursor = pending && isStored ? pending.cursorOffset : shownCursor;
		const clamped = clampToBoundary(value, cursor);

		latest.current = {value, cursorOffset: clamped};

		if (clamped !== shownCursor) {
			setShownCursor(clamped);
		}
	});

	const recordEdit = useCallback(
		(next: TextEditState) => {
			if (isControlled) {
				pendingEditRef.current = next;
			}
		},
		[isControlled],
	);

	const moveCaret = useCallback(
		(cursorOffset: number) => {
			if (isControlled) {
				setShownCursor(cursorOffset);
			}
		},
		[isControlled],
	);

	return {
		controlled:
			value === undefined
				? undefined
				: {value, cursorOffset: clampToBoundary(value, shownCursor)},
		recordEdit,
		moveCaret,
	};
};
