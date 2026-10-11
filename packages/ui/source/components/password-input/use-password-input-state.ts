import {useReducer, useCallback, useEffect, type Reducer} from 'react';
import {
	nextBoundary,
	previousBoundary,
	sanitizeInsertedText,
} from '../../lib/grapheme.js';

type State = {
	previousValue: string;
	value: string;
	cursorOffset: number;
};

type Action =
	| MoveCursorLeftAction
	| MoveCursorRightAction
	| InsertAction
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

		case 'delete': {
			const start = previousBoundary(state.value, state.cursorOffset);
			if (start === state.cursorOffset) {
				return state;
			}

			return {
				...state,
				previousValue: state.value,
				value: state.value.slice(0, start) + state.value.slice(state.cursorOffset),
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
				value: state.value.slice(0, state.cursorOffset) + state.value.slice(end),
			};
		}
	}
};

export type UseTextInputStateProps = {
	/**
	 * Callback when value updates.
	 */
	onChange?: (value: string) => void;

	/**
	 * Callback when `Enter` is pressed. First argument is a value of the input.
	 */
	onSubmit?: (value: string) => void;
};

export type PasswordInputState = State & {
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

export const usePasswordInputState = ({
	onChange,
	onSubmit,
}: UseTextInputStateProps) => {
	const [state, dispatch] = useReducer(reducer, {
		previousValue: '',
		value: '',
		cursorOffset: 0,
	});

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

	const deleteForward = useCallback(() => {
		dispatch({
			type: 'delete-forward',
		});
	}, []);

	const deleteCharacter = useCallback(() => {
		dispatch({
			type: 'delete',
		});
	}, []);

	const submit = useCallback(() => {
		onSubmit?.(state.value);
	}, [state.value, onSubmit]);

	useEffect(() => {
		if (state.value !== state.previousValue) {
			onChange?.(state.value);
		}
	}, [state.previousValue, state.value, onChange]);

	return {
		...state,
		moveCursorLeft,
		moveCursorRight,
		insert,
		delete: deleteCharacter,
		deleteForward,
		submit,
	};
};
