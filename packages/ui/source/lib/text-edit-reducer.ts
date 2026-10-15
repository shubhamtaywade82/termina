import {type Reducer} from 'react';
import {
	nextBoundary,
	previousBoundary,
	sanitizeInsertedText,
} from './grapheme.js';

export type TextEditState = {
	value: string;
	// UTF-16 index into `value`, always on a grapheme boundary.
	cursorOffset: number;
};

export type TextEditAction =
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

// Pure: no callbacks run here, so React may call it more than once.
export const reduceTextEdit: Reducer<TextEditState, TextEditAction> = (
	state,
	action,
) => {
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
				value:
					state.value.slice(0, state.cursorOffset) + state.value.slice(end),
			};
		}
	}
};
