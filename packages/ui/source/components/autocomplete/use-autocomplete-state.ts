import {type RefObject, useCallback} from 'react';
import {
	nextBoundary,
	previousBoundary,
	sanitizeInsertedText,
} from '../../lib/grapheme.js';
import {useSyncedReducer} from '../../lib/use-synced-reducer.js';

export type AutocompleteState = {
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

// Notifies from the edit itself, not from an effect. An effect keyed on the value runs again whenever a commit changes its inputs, so its call depends on render timing. Here each edit that changes the value is reported once, and a parent that passes a new callback on each render hears nothing new.
export const useAutocompleteState = ({
	defaultValue,
	onChange,
}: UseAutocompleteStateProps) => {
	const {state, latest, dispatch} = useSyncedReducer(reducer, () =>
		createInitialState(defaultValue),
	);

	const commit = useCallback(
		(action: AutocompleteAction): AutocompleteState => {
			const {previous, next} = dispatch(action);

			if (next.value !== previous.value) {
				onChange?.(next.value);
			}

			return next;
		},
		[dispatch, onChange],
	);

	return {state, latest, commit};
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
	latest: RefObject<AutocompleteState>;
	commit: (action: AutocompleteAction) => AutocompleteState;
	options: string[];
	limit: number;
	onSubmit?: (value: string) => void;
};

// The shape useTextInput reads. `suggestion` stays undefined because rows sit below the input, not inline after it.
export const createTextInputState = ({
	state,
	latest,
	commit,
	options,
	limit,
	onSubmit,
}: CreateTextInputStateProps) => {
	// useTextInput submits on Enter, so this override decides what Enter means here. It reads the latest state, not the render's, so Enter after a burst acts on what the burst produced.
	const submit = () => {
		const current = latest.current;
		const {rows, highlightIndex} = getSuggestions(current, options, limit);
		const highlighted = rows[highlightIndex];
		if (highlighted === undefined) {
			onSubmit?.(current.value);
		} else {
			commit({type: 'accept', text: highlighted});
		}
	};

	return {
		value: state.value,
		cursorOffset: state.cursorOffset,
		suggestion: undefined,
		moveCursorLeft: () => commit({type: 'move-cursor-left'}),
		moveCursorRight: () => commit({type: 'move-cursor-right'}),
		insert: (text: string) => commit({type: 'insert', text}),
		delete: () => commit({type: 'delete'}),
		deleteForward: () => commit({type: 'delete-forward'}),
		submit,
	};
};
