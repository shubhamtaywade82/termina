import {useCallback, useLayoutEffect} from 'react';
import {clampToBoundary} from '../../lib/grapheme.js';
import {
	reduceTextEdit,
	type TextEditAction,
	type TextEditState,
} from '../../lib/text-edit-reducer.js';
import {useSyncedReducer} from '../../lib/use-synced-reducer.js';

export type UseTextInputStateProps = {
	/**
	 * Controlled input value. When set, the parent owns the value: edits are reported through `onChange`, and the input shows this value until the parent changes it.
	 */
	value?: string;

	/**
	 * Callback when value updates.
	 */
	onChange?: (value: string) => void;

	/**
	 * Callback when `Enter` is pressed. First argument is a value of the input.
	 */
	onSubmit?: (value: string) => void;
};

export type PasswordInputState = TextEditState & {
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

export const usePasswordInputState = ({
	value: controlledValue,
	onChange,
	onSubmit,
}: UseTextInputStateProps) => {
	const isControlled = controlledValue !== undefined;
	const {
		state: uncontrolled,
		latest,
		dispatch,
	} = useSyncedReducer(reduceTextEdit, () => {
		const initial = controlledValue ?? '';
		return {value: initial, cursorOffset: initial.length};
	});

	// A controlled value is the prop. The cursor stays in local state, clamped to wherever the value now ends.
	const state: TextEditState =
		controlledValue === undefined
			? uncontrolled
			: {
					value: controlledValue,
					cursorOffset: clampToBoundary(
						controlledValue,
						uncontrolled.cursorOffset,
					),
				};

	// Runs after the reducer's own refresh, so a controlled input reads the prop, not the last uncontrolled edit.
	useLayoutEffect(() => {
		if (isControlled) {
			latest.current = state;
		}
	});

	// Notifies from the edit itself, not from an effect. Effects are keyed to the callback and to the last edit, which repeats calls on re-render and merges edits in one drain.
	const commit = useCallback(
		(action: TextEditAction): TextEditState => {
			const {previous, next} = dispatch(action);

			if (next.value !== previous.value) {
				onChange?.(next.value);
			}

			return next;
		},
		[dispatch, onChange],
	);

	const moveCursorLeft = useCallback(() => {
		dispatch({
			type: 'move-cursor-left',
		});
	}, [dispatch]);

	const moveCursorRight = useCallback(() => {
		dispatch({
			type: 'move-cursor-right',
		});
	}, [dispatch]);

	const insert = useCallback(
		(text: string) => {
			commit({
				type: 'insert',
				text,
			});
		},
		[commit],
	);

	const deleteForward = useCallback(() => {
		commit({
			type: 'delete-forward',
		});
	}, [commit]);

	const deleteCharacter = useCallback(() => {
		commit({
			type: 'delete',
		});
	}, [commit]);

	const submit = useCallback(() => {
		// Read the latest value, not the render's closure, so Enter after a burst submits what the burst produced.
		onSubmit?.(latest.current.value);
	}, [latest, onSubmit]);

	return {
		...state,
		moveCursorLeft,
		moveCursorRight,
		insert,
		delete: deleteCharacter,
		deleteForward,
		submit,
	};
};
