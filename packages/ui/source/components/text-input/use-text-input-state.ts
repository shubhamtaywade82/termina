import {useCallback, useMemo} from 'react';
import {
	reduceTextEdit,
	type TextEditAction,
	type TextEditState,
} from '../../lib/text-edit-reducer.js';
import {useControlledCaret} from '../../lib/use-controlled-caret.js';
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
	const commit = useCallback(
		(action: TextEditAction): TextEditState => {
			const {previous, next} = dispatch(action);

			if (next.value !== previous.value) {
				recordEdit(next);
				onChange?.(next.value);
			}

			return next;
		},
		[dispatch, recordEdit, onChange],
	);

	// A cursor move changes no value, so the parent has nothing to refuse: a controlled input takes it at once.
	const moveCursor = useCallback(
		(action: TextEditAction) => {
			const {next} = dispatch(action);
			moveCaret(next.cursorOffset);
		},
		[dispatch, moveCaret],
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
