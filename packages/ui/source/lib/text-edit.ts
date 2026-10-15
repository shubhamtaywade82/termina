import {
	nextBoundary,
	previousBoundary,
	sanitizeInsertedText,
} from './grapheme.js';

export type TextEditState = {
	/**
	 * Current value.
	 */
	readonly value: string;

	/**
	 * UTF-16 index into `value`. Movement and deletion step by grapheme cluster.
	 */
	readonly cursorOffset: number;
};

export type TextEditAction =
	| {readonly type: 'move-cursor-left'}
	| {readonly type: 'move-cursor-right'}
	| {readonly type: 'insert'; readonly text: string}
	// Accepting a suggestion completes the value, wherever the cursor is.
	| {readonly type: 'append'; readonly text: string}
	| {readonly type: 'delete'}
	| {readonly type: 'delete-forward'};

/**
 * Applies one editing action. Returns the same object when the action changes
 * nothing, so callers detect no-ops by identity and never notify about them.
 */
export const applyTextEdit = (
	state: TextEditState,
	action: TextEditAction,
): TextEditState => {
	switch (action.type) {
		case 'move-cursor-left': {
			const cursorOffset = previousBoundary(state.value, state.cursorOffset);
			return cursorOffset === state.cursorOffset
				? state
				: {value: state.value, cursorOffset};
		}

		case 'move-cursor-right': {
			const cursorOffset = nextBoundary(state.value, state.cursorOffset);
			return cursorOffset === state.cursorOffset
				? state
				: {value: state.value, cursorOffset};
		}

		case 'insert': {
			const text = sanitizeInsertedText(action.text);
			if (text === '') {
				return state;
			}

			return {
				value:
					state.value.slice(0, state.cursorOffset) +
					text +
					state.value.slice(state.cursorOffset),
				cursorOffset: state.cursorOffset + text.length,
			};
		}

		case 'append': {
			if (action.text === '') {
				return state;
			}

			const value = state.value + action.text;
			return {value, cursorOffset: value.length};
		}

		case 'delete': {
			const start = previousBoundary(state.value, state.cursorOffset);
			if (start === state.cursorOffset) {
				return state;
			}

			return {
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
				value: state.value.slice(0, state.cursorOffset) + state.value.slice(end),
				cursorOffset: state.cursorOffset,
			};
		}
	}
};
