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
	 * Initial value when uncontrolled. Read once, so later changes have no effect. Ignored when `value` is set.
	 */
	readonly defaultValue?: string;

	/**
	 * Controlled input value. When set, the parent owns the value: each edit is reported through `onChange`, and the input shows this value until the parent changes it. An input with `value` and no `onChange` is read-only.
	 */
	readonly value?: string;

	/**
	 * Callback when value updates.
	 */
	readonly onChange?: (value: string) => void;

	/**
	 * Callback when `Enter` is pressed. First argument is a value of the input.
	 */
	readonly onSubmit?: (value: string) => void;
};

export function PasswordInput({
	isDisabled = false,
	placeholder = '',
	defaultValue,
	value,
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
