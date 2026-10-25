import {isDeepStrictEqual} from 'node:util';
import {type Reducer, useCallback, useMemo, useState} from 'react';
import {isPresent} from '../../lib/is-present.js';
import OptionMap from '../../lib/option-map.js';
import {type Option} from '../../types.js';
import {useSyncedReducer} from '../../lib/use-synced-reducer.js';
import {focusNext, focusPrevious} from '../select/use-select-state.js';

type State = {
	/**
	 * Map where key is option's value and value is option's index.
	 */
	optionMap: OptionMap;

	/**
	 * Number of visible options.
	 */
	visibleOptionCount: number;

	/**
	 * Value of the currently focused option.
	 */
	focusedValue: string | undefined;

	/**
	 * Index of the first visible option.
	 */
	visibleFromIndex: number;

	/**
	 * Index of the last visible option.
	 */
	visibleToIndex: number;

	/**
	 * Indexes of selected options.
	 */
	value: string[];
};

type Action =
	FocusNextOptionAction | FocusPreviousOptionAction | ToggleFocusedOptionAction;

type FocusNextOptionAction = {
	type: 'focus-next-option';
};

type FocusPreviousOptionAction = {
	type: 'focus-previous-option';
};

type ToggleFocusedOptionAction = {
	type: 'toggle-focused-option';
};

const reducer: Reducer<State, Action> = (state, action) => {
	switch (action.type) {
		case 'focus-next-option': {
			return focusNext(state);
		}

		case 'focus-previous-option': {
			return focusPrevious(state);
		}

		case 'toggle-focused-option': {
			if (!isPresent(state.focusedValue)) {
				return state;
			}

			if (state.value.includes(state.focusedValue)) {
				const newValue = new Set(state.value);
				newValue.delete(state.focusedValue);

				return {
					...state,
					value: [...newValue],
				};
			}

			return {
				...state,
				value: [...state.value, state.focusedValue],
			};
		}
	}
};

export type UseMultiSelectStateProps = {
	/**
	 * Number of visible options.
	 *
	 * @default 5
	 */
	visibleOptionCount?: number;

	/**
	 * Options.
	 */
	options: Option[];

	/**
	 * Initially selected option values.
	 */
	defaultValue?: string[];

	/**
	 * Callback for selecting options.
	 */
	onChange?: (value: string[]) => void;

	/**
	 * Callback when user presses enter.
	 * First argument is an array of selected option values.
	 */
	onSubmit?: (value: string[]) => void;
};

export type MultiSelectState = Pick<
	State,
	'focusedValue' | 'visibleFromIndex' | 'visibleToIndex' | 'value'
> & {
	/**
	 * Visible options.
	 */
	visibleOptions: Array<Option & {index: number}>;

	/**
	 * Focus next option and scroll the list down, if needed.
	 */
	focusNextOption: () => void;

	/**
	 * Focus previous option and scroll the list up, if needed.
	 */
	focusPreviousOption: () => void;

	/**
	 * Select currently focused option.
	 */
	toggleFocusedOption: () => void;

	/**
	 * Trigger `onSubmit` callback.
	 */
	submit: () => void;
};

const createDefaultState = ({
	visibleOptionCount: customVisibleOptionCount,
	defaultValue,
	options,
}: Pick<
	UseMultiSelectStateProps,
	'visibleOptionCount' | 'defaultValue' | 'options'
>) => {
	const visibleOptionCount =
		typeof customVisibleOptionCount === 'number'
			? Math.min(customVisibleOptionCount, options.length)
			: options.length;

	const optionMap = new OptionMap(options);
	const value = defaultValue ?? [];

	return {
		optionMap,
		visibleOptionCount,
		focusedValue: optionMap.first?.value,
		visibleFromIndex: 0,
		visibleToIndex: visibleOptionCount,
		value,
	};
};

export const useMultiSelectState = ({
	visibleOptionCount = 5,
	options,
	defaultValue,
	onChange,
	onSubmit,
}: UseMultiSelectStateProps) => {
	const {state, latest, dispatch, replace} = useSyncedReducer(reducer, () =>
		createDefaultState({visibleOptionCount, defaultValue, options}),
	);

	const [lastOptions, setLastOptions] = useState(options);

	// A reset replaces the state without notifying, as documented: the selection returns to defaultValue.
	if (options !== lastOptions && !isDeepStrictEqual(options, lastOptions)) {
		replace(createDefaultState({visibleOptionCount, defaultValue, options}));

		setLastOptions(options);
	}

	const focusNextOption = useCallback(() => {
		dispatch({
			type: 'focus-next-option',
		});
	}, [dispatch]);

	const focusPreviousOption = useCallback(() => {
		dispatch({
			type: 'focus-previous-option',
		});
	}, [dispatch]);

	// Notifies from the toggle itself, not from an effect. A toggle with nothing focused changes nothing.
	const toggleFocusedOption = useCallback(() => {
		const {previous, next} = dispatch({
			type: 'toggle-focused-option',
		});

		if (next !== previous) {
			onChange?.(next.value);
		}
	}, [dispatch, onChange]);

	const submit = useCallback(() => {
		// Read the latest selection, not the render's closure, so Enter after a toggle in the same drain submits the new selection.
		onSubmit?.(latest.current.value);
	}, [latest, onSubmit]);

	const visibleOptions = useMemo(
		() =>
			options
				.map((option, index) => ({
					...option,
					index,
				}))
				.slice(state.visibleFromIndex, state.visibleToIndex),
		[options, state.visibleFromIndex, state.visibleToIndex],
	);

	return {
		focusedValue: state.focusedValue,
		visibleFromIndex: state.visibleFromIndex,
		visibleToIndex: state.visibleToIndex,
		value: state.value,
		visibleOptions,
		focusNextOption,
		focusPreviousOption,
		toggleFocusedOption,
		submit,
	};
};
