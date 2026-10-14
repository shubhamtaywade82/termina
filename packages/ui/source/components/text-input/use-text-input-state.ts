import {useCallback} from 'react';
import {useTextBuffer} from '../../lib/use-text-buffer.js';

export type UseTextInputStateProps = {
	/**
	 * Initial value when uncontrolled. Ignored once `value` is set.
	 */
	defaultValue?: string;

	/**
	 * Controlled value. Edits are reported through `onChange`; the component
	 * shows this value until the parent changes it.
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

export type TextInputState = {
	/**
	 * Input value.
	 */
	value: string;

	/**
	 * UTF-16 index into `value`. Movement and deletion step by grapheme cluster.
	 */
	cursorOffset: number;

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

const suggestionFor = (
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
	defaultValue,
	value: controlledValue,
	suggestions,
	onChange,
	onSubmit,
}: UseTextInputStateProps): TextInputState => {
	const buffer = useTextBuffer({
		value: controlledValue,
		defaultValue,
		onChange,
	});

	const {edit, getValue} = buffer;

	const moveCursorLeft = useCallback(() => {
		edit({type: 'move-cursor-left'});
	}, [edit]);

	const moveCursorRight = useCallback(() => {
		edit({type: 'move-cursor-right'});
	}, [edit]);

	const insert = useCallback(
		(text: string) => {
			edit({type: 'insert', text});
		},
		[edit],
	);

	const deleteCharacter = useCallback(() => {
		edit({type: 'delete'});
	}, [edit]);

	const deleteForward = useCallback(() => {
		edit({type: 'delete-forward'});
	}, [edit]);

	const submit = useCallback(() => {
		const current = getValue();
		const suggestion = suggestionFor(current, suggestions);

		if (suggestion) {
			edit({type: 'append', text: suggestion});
			onSubmit?.(current + suggestion);
			return;
		}

		onSubmit?.(current);
	}, [edit, getValue, suggestions, onSubmit]);

	return {
		value: buffer.value,
		cursorOffset: buffer.cursorOffset,
		suggestion: suggestionFor(buffer.value, suggestions),
		moveCursorLeft,
		moveCursorRight,
		insert,
		delete: deleteCharacter,
		deleteForward,
		submit,
	};
};
