import {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {clampToBoundary} from '../../lib/grapheme.js';
import {
	reduceTextEdit,
	type TextEditAction,
	type TextEditState,
} from '../../lib/text-edit-reducer.js';
import {useSyncedReducer} from '../../lib/use-synced-reducer.js';

export type UseTextInputStateProps = {
	/**
	 * Default input value.
	 */
	defaultValue?: string;

	/**
	 * Controlled input value. When set, the parent owns the value: edits are reported through `onChange`, and the input shows this value until the parent changes it.
	 */
	value?: string;

	/**
	 * Suggestions to autocomplete the input value.
	 */
	suggestions?: string[];

	/**
	 * Callback when input value changes.
	 */
	onChange?: (value: string) => void;

	/**
	 * Callback when enter is pressed. First argument is input value.
	 */
	onSubmit?: (value: string) => void;
};

export type TextInputState = TextEditState & {
	/**
	 * Suggested auto completion.
	 */
	suggestion: string | undefined;

	/**
	 * Move cursor to the left.
	 */
	moveCursorLeft: () => void;

	/**
	 * Move cursor to the right.
	 */
	moveCursorRight: () => void;

	/**
	 * Insert text.
	 */
	insert: (text: string) => void;

	/**
	 * Delete the grapheme before the cursor (Backspace).
	 */
	delete: () => void;

	/**
	 * Delete the grapheme after the cursor (Delete).
	 */
	deleteForward: () => void;

	/**
	 * Submit input value.
	 */
	submit: () => void;
};

// The first suggestion that extends the value, with the value itself removed. Empty values have no suggestion.
const findSuggestion = (
	value: string,
	suggestions: string[] | undefined,
): string | undefined => {
	if (value.length === 0) {
		return;
	}

	return suggestions
		?.find(suggestion => suggestion.startsWith(value))
		?.replace(value, '');
};

export const useTextInputState = ({
	defaultValue = '',
	value: controlledValue,
	suggestions,
	onChange,
	onSubmit,
}: UseTextInputStateProps) => {
	const isControlled = controlledValue !== undefined;
	const {
		state: editor,
		latest,
		dispatch,
	} = useSyncedReducer(reduceTextEdit, () => {
		const initial = controlledValue ?? defaultValue;
		return {value: initial, cursorOffset: initial.length};
	});

	// For a controlled input, the caret is the one the user left. An edit moves it only after the parent stores that edit, so a key the parent rejects leaves the caret where it was.
	const [shownCursor, setShownCursor] = useState(
		() => (controlledValue ?? defaultValue).length,
	);
	const pendingEdit = useRef<TextEditState | undefined>(undefined);
	// The controlled value at the previous commit. A changed value means the parent stored an edit, even one it transformed.
	const committedValue = useRef<string | undefined>(undefined);

	// A controlled value is the prop. The caret is the shown one, clamped to the value.
	const state: TextEditState =
		controlledValue === undefined
			? editor
			: {
					value: controlledValue,
					cursorOffset: clampToBoundary(controlledValue, shownCursor),
				};

	// Runs after every commit, once the parent has answered the last edit. An edit is accepted when the parent stored its value and dropped otherwise. Either way the next key starts from what the parent holds, not from the refused edit.
	useLayoutEffect(() => {
		if (controlledValue === undefined) {
			return;
		}

		const pending = pendingEdit.current;
		pendingEdit.current = undefined;
		const isStored = controlledValue !== committedValue.current;
		committedValue.current = controlledValue;
		const cursor = pending && isStored ? pending.cursorOffset : shownCursor;
		const clamped = clampToBoundary(controlledValue, cursor);

		latest.current = {value: controlledValue, cursorOffset: clamped};

		if (clamped !== shownCursor) {
			setShownCursor(clamped);
		}
	});

	// Notifies from the edit itself, not from an effect. Effects are keyed to the callback and to the last edit, which repeats calls on re-render and merges edits in one drain.
	const commit = useCallback(
		(action: TextEditAction): TextEditState => {
			const {previous, next} = dispatch(action);

			if (next.value !== previous.value) {
				if (isControlled) {
					pendingEdit.current = next;
				}

				onChange?.(next.value);
			}

			return next;
		},
		[dispatch, isControlled, onChange],
	);

	// A cursor move changes no value, so the parent has nothing to refuse: a controlled input takes it at once.
	const moveCursor = useCallback(
		(action: TextEditAction) => {
			const {next} = dispatch(action);

			if (isControlled) {
				setShownCursor(next.cursorOffset);
			}
		},
		[dispatch, isControlled],
	);

	const suggestion = useMemo(
		() => findSuggestion(state.value, suggestions),
		[state.value, suggestions],
	);

	const moveCursorLeft = useCallback(() => {
		moveCursor({
			type: 'move-cursor-left',
		});
	}, [moveCursor]);

	const moveCursorRight = useCallback(() => {
		moveCursor({
			type: 'move-cursor-right',
		});
	}, [moveCursor]);

	const insert = useCallback(
		(text: string) => {
			commit({
				type: 'insert',
				text,
			});
		},
		[commit],
	);

	const deleteCharacter = useCallback(() => {
		commit({
			type: 'delete',
		});
	}, [commit]);

	const deleteForward = useCallback(() => {
		commit({
			type: 'delete-forward',
		});
	}, [commit]);

	const submit = useCallback(() => {
		// Read the latest value, not the render's closure, so Enter after a burst submits what the burst produced.
		const current = latest.current;
		const completion = findSuggestion(current.value, suggestions);

		if (completion) {
			const next = commit({type: 'append', text: completion});
			onSubmit?.(next.value);
			return;
		}

		onSubmit?.(current.value);
	}, [commit, latest, onSubmit, suggestions]);

	return {
		...state,
		suggestion,
		moveCursorLeft,
		moveCursorRight,
		insert,
		delete: deleteCharacter,
		deleteForward,
		submit,
	};
};
