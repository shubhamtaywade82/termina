import {useMemo} from 'react';
import {useInput, usePaste} from '@nemesis-oss/termina-core';
import chalk from 'chalk';
import {type TextInputState} from './use-text-input-state.js';
import {graphemes, splitFirstGrapheme} from '../../lib/grapheme.js';

export type UseTextInputProps = {
	/**
	 * When disabled, user input is ignored.
	 *
	 * @default false
	 */
	isDisabled?: boolean;

	/**
	 * Text input state.
	 */
	state: TextInputState;

	/**
	 * Text to display when input is empty.
	 */
	placeholder?: string;
};

export type UseTextInputResult = {
	/**
	 * Input value.
	 */
	inputValue: string;
};

const cursor = chalk.inverse(' ');
export const useTextInput = ({
	isDisabled = false,
	state,
	placeholder = '',
}: UseTextInputProps): UseTextInputResult => {
	const renderedPlaceholder = useMemo(() => {
		if (isDisabled) {
			return placeholder ? chalk.dim(placeholder) : '';
		}

		if (!placeholder) {
			return cursor;
		}

		const [first, rest] = splitFirstGrapheme(placeholder);
		return chalk.inverse(first) + chalk.dim(rest);
	}, [isDisabled, placeholder]);

	const renderedValue = useMemo(() => {
		if (isDisabled) {
			return state.value;
		}

		let result = state.value.length > 0 ? '' : cursor;

		for (const {index, segment} of graphemes(state.value)) {
			result += index === state.cursorOffset ? chalk.inverse(segment) : segment;
		}

		if (state.suggestion) {
			if (state.cursorOffset === state.value.length) {
				const [first, rest] = splitFirstGrapheme(state.suggestion);
				result += chalk.inverse(first) + chalk.dim(rest);
			} else {
				result += chalk.dim(state.suggestion);
			}

			return result;
		}

		if (state.value.length > 0 && state.cursorOffset === state.value.length) {
			result += cursor;
		}

		return result;
	}, [isDisabled, state.value, state.cursorOffset, state.suggestion]);

	useInput(
		(input, key) => {
			if (
				key.upArrow ||
				key.downArrow ||
				(key.ctrl && input === 'c') ||
				key.tab ||
				(key.shift && key.tab)
			) {
				return;
			}

			if (key.return) {
				state.submit();
				return;
			}

			if (key.leftArrow) {
				state.moveCursorLeft();
			} else if (key.rightArrow) {
				state.moveCursorRight();
			} else if (key.backspace) {
				state.delete();
			} else if (key.delete) {
				state.deleteForward();
			} else if (key.ctrl || key.meta) {
				// Ctrl and Alt chords are commands, not text. Ctrl+A must not type an "a".
				return;
			} else {
				state.insert(input);
			}
		},
		{isActive: !isDisabled},
	);

	// While a usePaste listener is mounted, paste never reaches useInput, so the editor takes it here. It goes through the same insert as typing, so the controlled-value rules apply to it too.
	usePaste(
		(text) => {
			state.insert(text);
		},
		{isActive: !isDisabled},
	);

	return {
		inputValue: state.value.length > 0 ? renderedValue : renderedPlaceholder,
	};
};
