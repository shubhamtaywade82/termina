import {useCallback} from 'react';
import {useTextBuffer} from '../../lib/use-text-buffer.js';

export type UsePasswordInputStateProps = {
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
	 * Callback when value updates.
	 */
	onChange?: (value: string) => void;

	/**
	 * Callback when `Enter` is pressed. First argument is a value of the input.
	 */
	onSubmit?: (value: string) => void;
};

export type PasswordInputState = {
	/**
	 * Value of the input.
	 */
	value: string;

	/**
	 * UTF-16 index into `value`. Movement and deletion step by grapheme cluster.
	 */
	cursorOffset: number;

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
	defaultValue,
	value: controlledValue,
	onChange,
	onSubmit,
}: UsePasswordInputStateProps): PasswordInputState => {
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
		onSubmit?.(getValue());
	}, [getValue, onSubmit]);

	return {
		value: buffer.value,
		cursorOffset: buffer.cursorOffset,
		moveCursorLeft,
		moveCursorRight,
		insert,
		delete: deleteCharacter,
		deleteForward,
		submit,
	};
};
