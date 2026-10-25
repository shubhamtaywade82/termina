/* eslint-disable @eslint-react/no-array-index-key -- The rows are the current options in order, and the highlight index identifies each one. */
import React from 'react';
import {Box, Text, useInput, useStdin} from '@nemesis-oss/termina-core';
import figures from 'figures';
import {useComponentTheme} from '../../theme.js';
import {useTextInput} from '../text-input/use-text-input.js';
import {
	type AutocompleteAction,
	type AutocompleteState,
	createTextInputState,
	getSuggestions,
	useAutocompleteState,
} from './use-autocomplete-state.js';
import {type Theme} from './theme.js';

export type AutocompleteProps = {
	/**
	 * Candidate values. A value is listed when it contains the input text, ignoring case.
	 */
	readonly options: string[];

	/**
	 * Initial input value. A non-empty value opens the list at mount.
	 *
	 * @default ''
	 */
	readonly defaultValue?: string;

	/**
	 * Text to display when the input is empty.
	 *
	 * @default ''
	 */
	readonly placeholder?: string;

	/**
	 * Maximum number of rows in the list. Only these rows can be highlighted.
	 *
	 * @default 5
	 */
	readonly limit?: number;

	/**
	 * When disabled, key input is ignored and no row is highlighted.
	 *
	 * @default false
	 */
	readonly isDisabled?: boolean;

	/**
	 * Callback when the input value changes, including when a suggestion is accepted.
	 */
	readonly onChange?: (value: string) => void;

	/**
	 * Callback when Enter is pressed with no row highlighted. First argument is the input value.
	 */
	readonly onSubmit?: (value: string) => void;
};

type UseAutocompleteProps = {
	defaultValue: string;
	options: string[];
	limit: number;
	isDisabled: boolean;
	placeholder: string;
	onChange?: (value: string) => void;
	onSubmit?: (value: string) => void;
};

type UseHighlightKeysProps = {
	isActive: boolean;
	rowCount: number;
	commit: (action: AutocompleteAction) => AutocompleteState;
};

// UseTextInput ignores Up and Down, so the highlight keys are handled here.
const useHighlightKeys = ({
	isActive,
	rowCount,
	commit,
}: UseHighlightKeysProps) => {
	useInput(
		(_input, key) => {
			if (!key.upArrow && !key.downArrow) {
				return;
			}

			const step = key.upArrow ? -1 : 1;
			commit({type: 'move-highlight', step, rowCount});
		},
		{isActive},
	);
};

const useAutocomplete = ({
	defaultValue,
	options,
	limit,
	isDisabled,
	placeholder,
	onChange,
	onSubmit,
}: UseAutocompleteProps) => {
	// Piped stdin takes no keys, so the input is drawn without a cursor there, as when disabled.
	const {isRawModeSupported} = useStdin();
	const isInteractive = !isDisabled && isRawModeSupported;
	const {state, latest, commit} = useAutocompleteState({
		defaultValue,
		onChange,
	});
	const {rows, highlightIndex, showNoMatches} = getSuggestions(
		state,
		options,
		limit,
	);
	useHighlightKeys({isActive: isInteractive, rowCount: rows.length, commit});

	const {inputValue} = useTextInput({
		isDisabled: !isInteractive,
		placeholder,
		state: createTextInputState({
			state,
			latest,
			commit,
			options,
			limit,
			onSubmit,
		}),
	});

	return {
		inputValue,
		suggestions: {rows, highlightIndex, showNoMatches, isDisabled},
	};
};

type SuggestionListProps = {
	rows: string[];
	highlightIndex: number;
	showNoMatches: boolean;
	isDisabled: boolean;
};

function SuggestionList({
	rows,
	highlightIndex,
	showNoMatches,
	isDisabled,
}: SuggestionListProps) {
	const {styles} = useComponentTheme<Theme>('Autocomplete');

	return (
		<>
			{showNoMatches && <Text {...styles.noMatches()}>No matches</Text>}
			{rows.map((row, index) => {
				const isHighlighted = !isDisabled && index === highlightIndex;
				return (
					<Text key={index} {...styles.option({isHighlighted})}>
						{isHighlighted ? `${figures.pointer} ${row}` : `  ${row}`}
					</Text>
				);
			})}
		</>
	);
}

export function Autocomplete({
	options,
	defaultValue = '',
	placeholder = '',
	limit = 5,
	isDisabled = false,
	onChange,
	onSubmit,
}: AutocompleteProps) {
	const autocomplete = useAutocomplete({
		defaultValue,
		options,
		limit,
		isDisabled,
		placeholder,
		onChange,
		onSubmit,
	});
	const {styles} = useComponentTheme<Theme>('Autocomplete');

	return (
		<Box {...styles.container()}>
			<Text {...styles.input()}>{autocomplete.inputValue}</Text>
			<SuggestionList {...autocomplete.suggestions} />
		</Box>
	);
}
