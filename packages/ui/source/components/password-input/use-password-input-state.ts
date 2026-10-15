import {useCallback} from 'react';
import {
	reduceTextEdit,
	type TextEditAction,
	type TextEditState,
} from '../../lib/text-edit-reducer.js';
import {useChangeNotifier} from '../../lib/use-change-notifier.js';
import {useControlledCaret} from '../../lib/use-controlled-caret.js';
import {useSyncedReducer} from '../../lib/use-synced-reducer.js';

export type UseTextInputStateProps = {
	/**
	 * Initial value when uncontrolled. Read once, so later changes have no effect. Ignored when `value` is set.
	 */
	defaultValue?: string;

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
	defaultValue = '',
	value: controlledValue,
	onChange,
	onSubmit,
}: UseTextInputStateProps) => {
	const {
		state: editor,
		latest,
		dispatch,
	} = useSyncedReducer(reduceTextEdit, () => {
		const initial = controlledValue ?? defaultValue;
		return {value: initial, cursorOffset: initial.length};
	});

	const {controlled, recordEdit, moveCaret} = useControlledCaret({
		value: controlledValue,
		initialCursor: (controlledValue ?? defaultValue).length,
		latest,
	});

	// A controlled value is the prop. The caret is the shown one, clamped to the value.
	const state: TextEditState = controlled ?? editor;

	// Notifies from the edit itself, not from an effect. Effects are keyed to the callback and to the last edit, which repeats calls on re-render and merges edits in one drain.
	const notify = useChangeNotifier(onChange);
	const commit = useCallback(
		(action: TextEditAction): TextEditState => {
			const {previous, next} = dispatch(action);

			if (next.value !== previous.value) {
				recordEdit(next);
				notify(next.value);
			}

			return next;
		},
		[dispatch, recordEdit, notify],
	);

	// A cursor move changes no value, so the parent has nothing to refuse: a controlled input takes it at once.
	const moveCursor = useCallback(
		(action: TextEditAction) => {
			const {next} = dispatch(action);
			moveCaret(next.cursorOffset);
		},
		[dispatch, moveCaret],
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
