import {useMemo} from 'react';
import {useInput} from '@nemesis-oss/termina-core';
import chalk from 'chalk';
import {graphemes, splitFirstGrapheme} from '../../lib/grapheme.js';
import {type PasswordInputState} from './use-password-input-state.js';

export type UsePasswordInputProps = {
	/**
	 * When disabled, user input is ignored.
	 *
	 * @default false
	 */
	isDisabled?: boolean;

	/**
	 * Password input state.
	 */
	state: PasswordInputState;

	/**
	 * Text to display when `value` is empty.
	 *
	 * @default ""
	 */
	placeholder?: string;
};

export type UsePasswordInputResult = {
	/**
	 * Value to render inside the input.
	 */
	inputValue: string;
};

const cursor = chalk.inverse(' ');

export const usePasswordInput = ({
	isDisabled = false,
	state,
	placeholder = '',
}: UsePasswordInputProps): UsePasswordInputResult => {
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
		// One asterisk per grapheme cluster, the same unit the cursor moves by. Counting UTF-16 units would show two asterisks for one emoji and split a combining sequence.
		const clusters = graphemes(state.value);

		if (isDisabled) {
			return '*'.repeat(clusters.length);
		}

		let result = clusters.length > 0 ? '' : cursor;

		for (const {index} of clusters) {
			result += index === state.cursorOffset ? chalk.inverse('*') : '*';
		}

		if (clusters.length > 0 && state.cursorOffset === state.value.length) {
			result += cursor;
		}

		return result;
	}, [isDisabled, state.value, state.cursorOffset]);

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
				// Ctrl and Alt chords are commands, not text.
				return;
			} else {
				state.insert(input);
			}
		},
		{isActive: !isDisabled},
	);

	return {
		inputValue: state.value.length > 0 ? renderedValue : renderedPlaceholder,
	};
};
