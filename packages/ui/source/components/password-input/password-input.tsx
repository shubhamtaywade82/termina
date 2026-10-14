import React from 'react';
import {Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {usePasswordInputState} from './use-password-input-state.js';
import {usePasswordInput} from './use-password-input.js';
import {type Theme} from './theme.js';

export type PasswordInputProps = {
	/**
	 * When disabled, user input is ignored.
	 *
	 * @default false
	 */
	readonly isDisabled?: boolean;

	/**
	 * Text to display when `value` is empty.
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
	 * Callback with the next value after every edit that changes it. It is
	 * never called for a no-op key and never called because of a re-render.
	 */
	readonly onChange?: (value: string) => void;

	/**
	 * Callback when `Enter` is pressed. First argument is a value of the input.
	 */
	readonly onSubmit?: (value: string) => void;
};

export function PasswordInput({
	isDisabled = false,
	defaultValue,
	value,
	placeholder = '',
	onChange,
	onSubmit,
}: PasswordInputProps) {
	const state = usePasswordInputState({
		defaultValue,
		value,
		onChange,
		onSubmit,
	});

	const {inputValue} = usePasswordInput({
		isDisabled,
		placeholder,
		state,
	});

	const {styles} = useComponentTheme<Theme>('PasswordInput');

	return <Text {...styles.value()}>{inputValue}</Text>;
}
