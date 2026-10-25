import {useCallback, useLayoutEffect, useRef} from 'react';
import {
	reduceMultilineEdit,
	type MultilineEditAction,
	type MultilineEditState,
} from '../../lib/multiline-edit-reducer.js';
import {type TextEditState} from '../../lib/text-edit-reducer.js';
import {useControlledCaret} from '../../lib/use-controlled-caret.js';
import {useSyncedReducer} from '../../lib/use-synced-reducer.js';

export type UseMultilineTextInputStateProps = {
	/**
	 * Default input value.
	 */
	defaultValue?: string;

	/**
	 * Controlled input value. When set, the parent owns the value: edits are reported through `onChange`, and the input shows this value until the parent changes it.
	 */
	value?: string;

	/**
	 * Callback when input value changes.
	 */
	onChange?: (value: string) => void;

	/**
	 * Callback when Ctrl+D is pressed. First argument is input value.
	 */
	onSubmit?: (value: string) => void;
};

export type MultilineTextInputState = MultilineEditState & {
	/**
	 * Applies an edit or a move. An edit that changes the value is reported through `onChange`. A move changes only the caret.
	 */
	commit: (action: MultilineEditAction) => void;

	/**
	 * Submit input value.
	 */
	submit: () => void;
};

export const useMultilineTextInputState = ({
	defaultValue = '',
	value: controlledValue,
	onChange,
	onSubmit,
}: UseMultilineTextInputStateProps): MultilineTextInputState => {
	const initial = controlledValue ?? defaultValue;
	const {
		state: editor,
		latest,
		dispatch,
	} = useSyncedReducer(reduceMultilineEdit, () => ({
		value: initial,
		cursorOffset: initial.length,
		goalColumn: undefined,
		top: 0,
	}));

	// The caret hook writes its committed value and caret into this ref. It is kept apart from the editor's ref, because the hook replaces the whole object it is given, and the editor also holds the goal column and the viewport.
	const caretRef = useRef<TextEditState>({
		value: initial,
		cursorOffset: initial.length,
	});

	const {controlled, recordEdit, moveCaret} = useControlledCaret({
		value: controlledValue,
		initialCursor: initial.length,
		latest: caretRef,
	});

	// Runs after the caret hook in the same commit. Copies the committed value and caret into the editor state, so the next handler reads what the parent holds, and keeps the goal column and the viewport.
	useLayoutEffect(() => {
		if (controlledValue === undefined) {
			return;
		}

		latest.current = {
			...latest.current,
			value: caretRef.current.value,
			cursorOffset: caretRef.current.cursorOffset,
		};
	});

	// Notifies from the edit itself, not from an effect. Effects are keyed to the callback and to the last edit, which repeats calls on re-render and merges edits in one drain.
	const commit = useCallback(
		(action: MultilineEditAction) => {
			const {previous, next} = dispatch(action);

			if (next.value !== previous.value) {
				recordEdit(next);
				onChange?.(next.value);
			} else if (next.cursorOffset !== previous.cursorOffset) {
				// A move changes no value, so the parent has nothing to refuse: a controlled input takes it at once.
				moveCaret(next.cursorOffset);
			}
		},
		[dispatch, recordEdit, moveCaret, onChange],
	);

	const submit = useCallback(() => {
		// Read the latest value, not the render's closure, so Ctrl+D after a burst submits what the burst produced.
		onSubmit?.(latest.current.value);
	}, [latest, onSubmit]);

	// A controlled value is the prop. The caret is the shown one, clamped to the value.
	const state: MultilineEditState =
		controlled === undefined ? editor : {...editor, ...controlled};

	return {
		...state,
		commit,
		submit,
	};
};
