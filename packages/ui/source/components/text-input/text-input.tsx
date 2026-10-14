import React from 'react';
import {Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {useTextInputState} from './use-text-input-state.js';
import {useTextInput} from './use-text-input.js';
import {type Theme} from './theme.js';

export type TextInputProps = {
	/**
	 * When disabled, user input is ignored.
	 *
	 * @default false
	 */
	readonly isDisabled?: boolean;

	/**
	 * Text to display when input is empty.
	 */
	readonly placeholder?: string;

	/**
	 * Initial value for an uncontrolled input. Ignored when `value` is set.
	 */
	readonly defaultValue?: string;

	/**
	 * Controlled value. The input shows this value and reports every edit
	 * through `onChange`; it changes only when the parent passes a new `value`.
	 * Omit it to let the input manage its own value.
	 */
	readonly value?: string;

	/**
	 * Suggestions to autocomplete the input value.
	 */
	readonly suggestions?: string[];

	/**
	 * Callback with the next value after every edit that changes it. It is
	 * never called for a no-op key and never called because of a re-render.
	 */
	readonly onChange?: (value: string) => void;

	/**
	 * Callback when enter is pressed. First argument is input value.
	 */
	readonly onSubmit?: (value: string) => void;
};

export function TextInput({
	isDisabled = false,
	defaultValue,
	value,
	placeholder = '',
	suggestions,
	onChange,
	onSubmit,
}: TextInputProps) {
	const state = useTextInputState({
		defaultValue,
		value,
		suggestions,
		onChange,
		onSubmit,
	});

	const {inputValue} = useTextInput({
		isDisabled,
		placeholder,
		state,
	});

	const {styles} = useComponentTheme<Theme>('TextInput');

	return <Text {...styles.value()}>{inputValue}</Text>;
}
