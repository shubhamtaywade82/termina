import {isDeepStrictEqual} from 'node:util';
import {type Reducer, useCallback, useMemo, useState} from 'react';
import {type Option} from '../../types.js';
import OptionMap from '../../lib/option-map.js';
import {useSyncedReducer} from '../../lib/use-synced-reducer.js';

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
	 * Value of the selected option.
	 */
	value: string | undefined;
};

type Action =
	FocusNextOptionAction | FocusPreviousOptionAction | SelectFocusedOptionAction;

type FocusNextOptionAction = {
	type: 'focus-next-option';
};

type FocusPreviousOptionAction = {
	type: 'focus-previous-option';
};

type SelectFocusedOptionAction = {
	type: 'select-focused-option';
};

// The focus and scroll window shared by Select and MultiSelect. Only the meaning of `value` differs between them.
export type ListFocusState = {
	optionMap: OptionMap;
	visibleOptionCount: number;
	focusedValue: string | undefined;
	visibleFromIndex: number;
	visibleToIndex: number;
};

export const focusNext = <S extends ListFocusState>(state: S): S => {
	if (!state.focusedValue) {
		return state;
	}

	const item = state.optionMap.get(state.focusedValue);

	if (!item) {
		return state;
	}

	// eslint-disable-next-line prefer-destructuring
	const next = item.next;

	if (!next) {
		return state;
	}

	const needsToScroll = next.index >= state.visibleToIndex;

	if (!needsToScroll) {
		return {
			...state,
			focusedValue: next.value,
		};
	}

	const nextVisibleToIndex = Math.min(
		state.optionMap.size,
		state.visibleToIndex + 1,
	);

	const nextVisibleFromIndex = nextVisibleToIndex - state.visibleOptionCount;

	return {
		...state,
		focusedValue: next.value,
		visibleFromIndex: nextVisibleFromIndex,
		visibleToIndex: nextVisibleToIndex,
	};
};

export const focusPrevious = <S extends ListFocusState>(state: S): S => {
	if (!state.focusedValue) {
		return state;
	}

	const item = state.optionMap.get(state.focusedValue);

	if (!item) {
		return state;
	}

	// eslint-disable-next-line prefer-destructuring
	const previous = item.previous;

	if (!previous) {
		return state;
	}

	const needsToScroll = previous.index <= state.visibleFromIndex;

	if (!needsToScroll) {
		return {
			...state,
			focusedValue: previous.value,
		};
	}

	const nextVisibleFromIndex = Math.max(0, state.visibleFromIndex - 1);

	const nextVisibleToIndex = nextVisibleFromIndex + state.visibleOptionCount;

	return {
		...state,
		focusedValue: previous.value,
		visibleFromIndex: nextVisibleFromIndex,
		visibleToIndex: nextVisibleToIndex,
	};
};

const reducer: Reducer<State, Action> = (state, action) => {
	switch (action.type) {
		case 'focus-next-option': {
			return focusNext(state);
		}

		case 'focus-previous-option': {
			return focusPrevious(state);
		}

		case 'select-focused-option': {
			return {
				...state,
				value: state.focusedValue,
			};
		}
	}
};

export type UseSelectStateProps = {
	/**
	 * Number of items to display.
	 *
	 * @default 5
	 */
	visibleOptionCount?: number;

	/**
	 * Options.
	 */
	options: Option[];

	/**
	 * Initially selected option's value.
	 */
	defaultValue?: string;

	/**
	 * Callback for selecting an option.
	 */
	onChange?: (value: string) => void;
};

export type SelectState = Pick<
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
	selectFocusedOption: () => void;
};

const createDefaultState = ({
	visibleOptionCount: customVisibleOptionCount,
	defaultValue,
	options,
}: Pick<
	UseSelectStateProps,
	'visibleOptionCount' | 'defaultValue' | 'options'
>) => {
	const visibleOptionCount =
		typeof customVisibleOptionCount === 'number'
			? Math.min(customVisibleOptionCount, options.length)
			: options.length;

	const optionMap = new OptionMap(options);

	return {
		optionMap,
		visibleOptionCount,
		focusedValue: optionMap.first?.value,
		visibleFromIndex: 0,
		visibleToIndex: visibleOptionCount,
		value: defaultValue,
	};
};

export const useSelectState = ({
	visibleOptionCount = 5,
	options,
	defaultValue,
	onChange,
}: UseSelectStateProps) => {
	const {state, dispatch, replace} = useSyncedReducer(reducer, () =>
		createDefaultState({visibleOptionCount, defaultValue, options}),
	);

	const [lastOptions, setLastOptions] = useState(options);

	// A reset replaces the state without notifying, as documented: the value returns to defaultValue.
	if (options !== lastOptions && !isDeepStrictEqual(options, lastOptions)) {
		replace(createDefaultState({visibleOptionCount, defaultValue, options}));

		setLastOptions(options);
	}

	const focusNextOption = useCallback(() => {
		dispatch({
			type: 'focus-next-option',
		});
	}, []);

	const focusPreviousOption = useCallback(() => {
		dispatch({
			type: 'focus-previous-option',
		});
	}, []);

	// Notifies from the selection itself, not from an effect. Re-selecting the current option is not a change.
	const selectFocusedOption = useCallback(() => {
		const {previous, next} = dispatch({
			type: 'select-focused-option',
		});

		if (
			next.value !== undefined &&
			next.value !== '' &&
			next.value !== previous.value
		) {
			onChange?.(next.value);
		}
	}, [dispatch, onChange]);

	const visibleOptions = useMemo(() => {
		return options
			.map((option, index) => ({
				...option,
				index,
			}))
			.slice(state.visibleFromIndex, state.visibleToIndex);
	}, [options, state.visibleFromIndex, state.visibleToIndex]);

	return {
		focusedValue: state.focusedValue,
		visibleFromIndex: state.visibleFromIndex,
		visibleToIndex: state.visibleToIndex,
		value: state.value,
		visibleOptions,
		focusNextOption,
		focusPreviousOption,
		selectFocusedOption,
	};
};
