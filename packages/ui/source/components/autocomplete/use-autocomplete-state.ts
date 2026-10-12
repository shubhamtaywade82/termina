import {
	type Dispatch,
	useEffect,
	useEffectEvent,
	useReducer,
} from 'react';
import {
	nextBoundary,
	previousBoundary,
	sanitizeInsertedText,
} from '../../lib/grapheme.js';

export type AutocompleteState = {
	previousValue: string;
	value: string;
	// UTF-16 index into `value`, always on a grapheme boundary.
	cursorOffset: number;
	highlightIndex: number;
	// The accepted row matches its own text, so without this flag the list would reopen at once.
	isDismissed: boolean;
};

export type AutocompleteAction =
	| {type: 'move-cursor-left'}
	| {type: 'move-cursor-right'}
	| {type: 'insert'; text: string}
	| {type: 'delete'}
	| {type: 'delete-forward'}
	| {type: 'accept'; text: string}
	| {type: 'move-highlight'; step: number; rowCount: number};

// With no rows the result is -1, which no row has.
const clampIndex = (index: number, rowCount: number): number =>
	Math.min(Math.max(index, 0), rowCount - 1);

const createInitialState = (defaultValue: string): AutocompleteState => ({
	previousValue: defaultValue,
	value: defaultValue,
	cursorOffset: defaultValue.length,
	highlightIndex: 0,
	isDismissed: false,
});

const replaceValue = (
	state: AutocompleteState,
	value: string,
	cursorOffset: number,
): AutocompleteState => ({
	...state,
	previousValue: state.value,
	value,
	cursorOffset,
	highlightIndex: 0,
	isDismissed: false,
});

const moveCursor = (
	state: AutocompleteState,
	boundary: (value: string, offset: number) => number,
): AutocompleteState => ({
	...state,
	cursorOffset: boundary(state.value, state.cursorOffset),
});

const insertText = (
	state: AutocompleteState,
	rawText: string,
): AutocompleteState => {
	const text = sanitizeInsertedText(rawText);
	if (text === '') {
		return state;
	}

	const {value, cursorOffset} = state;
	return replaceValue(
		state,
		value.slice(0, cursorOffset) + text + value.slice(cursorOffset),
		cursorOffset + text.length,
	);
};

const deleteBeforeCursor = (state: AutocompleteState): AutocompleteState => {
	const start = previousBoundary(state.value, state.cursorOffset);
	if (start === state.cursorOffset) {
		return state;
	}

	return replaceValue(
		state,
		state.value.slice(0, start) + state.value.slice(state.cursorOffset),
		start,
	);
};

const deleteAfterCursor = (state: AutocompleteState): AutocompleteState => {
	const end = nextBoundary(state.value, state.cursorOffset);
	if (end === state.cursorOffset) {
		return state;
	}

	return replaceValue(
		state,
		state.value.slice(0, state.cursorOffset) + state.value.slice(end),
		state.cursorOffset,
	);
};

const moveHighlight = (
	state: AutocompleteState,
	step: number,
	rowCount: number,
): AutocompleteState => ({
	...state,
	highlightIndex: clampIndex(
		clampIndex(state.highlightIndex, rowCount) + step,
		rowCount,
	),
});

const acceptRow = (
	state: AutocompleteState,
	text: string,
): AutocompleteState => ({
	...replaceValue(state, text, text.length),
	isDismissed: true,
});

const reducer = (
	state: AutocompleteState,
	action: AutocompleteAction,
): AutocompleteState => {
	switch (action.type) {
		case 'move-cursor-left':
			return moveCursor(state, previousBoundary);
		case 'move-cursor-right':
			return moveCursor(state, nextBoundary);
		case 'insert':
			return insertText(state, action.text);
		case 'delete':
			return deleteBeforeCursor(state);
		case 'delete-forward':
			return deleteAfterCursor(state);
		case 'accept':
			return acceptRow(state, action.text);
		case 'move-highlight':
			return moveHighlight(state, action.step, action.rowCount);
	}
};

type UseAutocompleteStateProps = {
	defaultValue: string;
	onChange?: (value: string) => void;
};

// The effect is keyed on the value, so a parent that passes a new callback on each render does not hear the last change again.
export const useAutocompleteState = ({
	defaultValue,
	onChange,
}: UseAutocompleteStateProps) => {
	const [state, dispatch] = useReducer(
		reducer,
		defaultValue,
		createInitialState,
	);
	const notifyChange = useEffectEvent((value: string) => {
		onChange?.(value);
	});

	useEffect(() => {
		if (state.value !== state.previousValue) {
			notifyChange(state.value);
		}
	}, [state.value, state.previousValue]);

	return {state, dispatch};
};

export const getSuggestions = (
	state: AutocompleteState,
	options: string[],
	limit: number,
) => {
	const isListOpen = state.value.length > 0 && !state.isDismissed;
	const query = state.value.toLowerCase();
	const matches = isListOpen
		? options.filter(option => option.toLowerCase().includes(query))
		: [];
	const rows = matches.slice(0, limit);

	return {
		rows,
		highlightIndex: clampIndex(state.highlightIndex, rows.length),
		showNoMatches: isListOpen && matches.length === 0,
	};
};

type CreateTextInputStateProps = {
	state: AutocompleteState;
	dispatch: Dispatch<AutocompleteAction>;
	rows: string[];
	highlightIndex: number;
	onSubmit?: (value: string) => void;
};

// The shape useTextInput reads. `suggestion` stays undefined because rows sit below the input, not inline after it.
export const createTextInputState = ({
	state,
	dispatch,
	rows,
	highlightIndex,
	onSubmit,
}: CreateTextInputStateProps) => {
	// useTextInput submits on Enter, so this override decides what Enter means here.
	const submit = () => {
		const highlighted = rows[highlightIndex];
		if (highlighted === undefined) {
			onSubmit?.(state.value);
		} else {
			dispatch({type: 'accept', text: highlighted});
		}
	};

	return {
		previousValue: state.previousValue,
		value: state.value,
		cursorOffset: state.cursorOffset,
		suggestion: undefined,
		moveCursorLeft: () => dispatch({type: 'move-cursor-left'}),
		moveCursorRight: () => dispatch({type: 'move-cursor-right'}),
		insert: (text: string) => dispatch({type: 'insert', text}),
		delete: () => dispatch({type: 'delete'}),
		deleteForward: () => dispatch({type: 'delete-forward'}),
		submit,
	};
};
