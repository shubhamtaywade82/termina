import {useReducer, useCallback, useEffect, type Reducer, useMemo} from 'react';
import {
	nextBoundary,
	previousBoundary,
	sanitizeInsertedText,
} from '../../lib/grapheme.js';

type State = {
	previousValue: string;
	value: string;
	// UTF-16 index into `value`, always on a grapheme boundary.
	cursorOffset: number;
};

type Action =
	| MoveCursorLeftAction
	| MoveCursorRightAction
	| InsertAction
	| AppendAction
	| DeleteAction
	| DeleteForwardAction;

type MoveCursorLeftAction = {
	type: 'move-cursor-left';
};

type MoveCursorRightAction = {
	type: 'move-cursor-right';
};

type InsertAction = {
	type: 'insert';
	text: string;
};

// Accepting a suggestion completes the value, wherever the cursor is.
type AppendAction = {
	type: 'append';
	text: string;
};

type DeleteAction = {
	type: 'delete';
};

type DeleteForwardAction = {
	type: 'delete-forward';
};

const reducer: Reducer<State, Action> = (state, action) => {
	switch (action.type) {
		case 'move-cursor-left': {
			return {
				...state,
				cursorOffset: previousBoundary(state.value, state.cursorOffset),
			};
		}

		case 'move-cursor-right': {
			return {
				...state,
				cursorOffset: nextBoundary(state.value, state.cursorOffset),
			};
		}

		case 'insert': {
			const text = sanitizeInsertedText(action.text);
			if (text === '') {
				return state;
			}

			return {
				...state,
				previousValue: state.value,
				value:
					state.value.slice(0, state.cursorOffset) +
					text +
					state.value.slice(state.cursorOffset),
				cursorOffset: state.cursorOffset + text.length,
			};
		}

		case 'append': {
			const value = state.value + action.text;
			return {
				...state,
				previousValue: state.value,
				value,
				cursorOffset: value.length,
			};
		}

		case 'delete': {
			const start = previousBoundary(state.value, state.cursorOffset);
			if (start === state.cursorOffset) {
				return state;
			}

			return {
				...state,
				previousValue: state.value,
				value:
					state.value.slice(0, start) + state.value.slice(state.cursorOffset),
				cursorOffset: start,
			};
		}

		case 'delete-forward': {
			const end = nextBoundary(state.value, state.cursorOffset);
			if (end === state.cursorOffset) {
				return state;
			}

			return {
				...state,
				previousValue: state.value,
				value:
					state.value.slice(0, state.cursorOffset) + state.value.slice(end),
			};
		}
	}
};

export type UseTextInputStateProps = {
	/**
	 * Default input value.
	 */
	defaultValue?: string;

	/**
	 * Suggestions to autocomplete the input value.
	 */
	suggestions?: string[];

	/**
	 * Callback when input value changes.
	 */
	onChange?: (value: string) => void;

	/**
	 * Callback when enter is pressed. First argument is input value.
	 */
	onSubmit?: (value: string) => void;
};

export type TextInputState = State & {
	/**
	 * Suggested auto completion.
	 */
	suggestion: string | undefined;

	/**
	 * Move cursor to the left.
	 */
	moveCursorLeft: () => void;

	/**
	 * Move cursor to the right.
	 */
	moveCursorRight: () => void;

	/**
	 * Insert text.
	 */
	insert: (text: string) => void;

	/**
	 * Delete the grapheme before the cursor (Backspace).
	 */
	delete: () => void;

	/**
	 * Delete the grapheme after the cursor (Delete).
	 */
	deleteForward: () => void;

	/**
	 * Submit input value.
	 */
	submit: () => void;
};

export const useTextInputState = ({
	defaultValue = '',
	suggestions,
	onChange,
	onSubmit,
}: UseTextInputStateProps) => {
	const [state, dispatch] = useReducer(reducer, {
		previousValue: defaultValue,
		value: defaultValue,
		cursorOffset: defaultValue.length,
	});

	const suggestion = useMemo(() => {
		if (state.value.length === 0) {
			return;
		}

		return suggestions
			?.find(suggestion => suggestion.startsWith(state.value))
			?.replace(state.value, '');
	}, [state.value, suggestions]);

	const moveCursorLeft = useCallback(() => {
		dispatch({
			type: 'move-cursor-left',
		});
	}, []);

	const moveCursorRight = useCallback(() => {
		dispatch({
			type: 'move-cursor-right',
		});
	}, []);

	const insert = useCallback((text: string) => {
		dispatch({
			type: 'insert',
			text,
		});
	}, []);

	const deleteCharacter = useCallback(() => {
		dispatch({
			type: 'delete',
		});
	}, []);

	const deleteForward = useCallback(() => {
		dispatch({
			type: 'delete-forward',
		});
	}, []);

	const submit = useCallback(() => {
		if (suggestion) {
			dispatch({type: 'append', text: suggestion});
			onSubmit?.(state.value + suggestion);
			return;
		}

		onSubmit?.(state.value);
	}, [state.value, suggestion, onSubmit]);

	useEffect(() => {
		if (state.value !== state.previousValue) {
			onChange?.(state.value);
		}
	}, [state.previousValue, state.value, onChange]);

	return {
		...state,
		suggestion,
		moveCursorLeft,
		moveCursorRight,
		insert,
		delete: deleteCharacter,
		deleteForward,
		submit,
	};
};
