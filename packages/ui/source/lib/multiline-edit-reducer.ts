import {type Reducer} from 'react';
import {
	reduceTextEdit,
	type TextEditAction,
	type TextEditState,
} from './text-edit-reducer.js';
import {
	lineRange,
	lineStarts,
	offsetAtRowColumn,
	positionOf,
} from './text-lines.js';

export type MultilineEditState = TextEditState & {
	// The column the caret keeps across up and down moves, in terminal cells. Undefined after any action that is not a vertical move.
	goalColumn: number | undefined;

	// The first visible row. Each action moves it only as far as needed to show the caret, and clamps it to the value.
	top: number;
};

export type MultilineEditAction = {
	// The number of rows the editor shows. It goes with every action, so the top follows the caret at the size the user sees.
	rows: number;
} & (
	| {type: 'move-left'}
	| {type: 'move-right'}
	| {type: 'move-up'}
	| {type: 'move-down'}
	| {type: 'home'}
	| {type: 'end'}
	| {type: 'insert'; text: string}
	| {type: 'newline'}
	| {type: 'delete'}
	| {type: 'delete-forward'}
);

// The first visible row for a caret on `row`. The top is clamped first, so a shorter value or a shorter viewport never leaves rows past the end on screen. It then moves only as far as needed to show the caret row.
export const viewportTop = (
	top: number,
	row: number,
	rows: number,
	lines: number,
): number => {
	const height = Math.max(1, rows);
	const lowest = Math.max(0, lines - height);
	let next = Math.min(Math.max(top, 0), lowest);

	if (row < next) {
		next = row;
	} else if (row >= next + height) {
		next = row - height + 1;
	}

	return next;
};

// Runs the edit through reduceTextEdit. Any action other than a vertical move ends the goal column.
const edit = (
	state: MultilineEditState,
	action: TextEditAction,
): MultilineEditState => ({
	...state,
	...reduceTextEdit(state, action),
	goalColumn: undefined,
});

const insertNewline = (state: MultilineEditState): MultilineEditState => ({
	...state,
	value:
		state.value.slice(0, state.cursorOffset) +
		'\n' +
		state.value.slice(state.cursorOffset),
	cursorOffset: state.cursorOffset + 1,
	goalColumn: undefined,
});

// The text edit drops control characters, the line feed among them. Each line of the text goes through it on its own, and the line feeds between the lines are inserted as newlines.
const insertText = (
	state: MultilineEditState,
	text: string,
): MultilineEditState => {
	let next = state;

	for (const [index, line] of text.split('\n').entries()) {
		const withBreak = index === 0 ? next : insertNewline(next);
		next = edit(withBreak, {type: 'insert', text: line});
	}

	return next;
};

// Moves the caret one row up or down, keeping the column it started from. A move past the first or last row returns the state unchanged.
const moveVertically = (
	state: MultilineEditState,
	delta: -1 | 1,
): MultilineEditState => {
	const {row, column} = positionOf(state.value, state.cursorOffset);
	const target = row + delta;

	if (target < 0 || target >= lineStarts(state.value).length) {
		return state;
	}

	const goalColumn = state.goalColumn ?? column;

	return {
		...state,
		cursorOffset: offsetAtRowColumn(state.value, target, goalColumn),
		goalColumn,
	};
};

const currentLine = (state: MultilineEditState) =>
	lineRange(state.value, positionOf(state.value, state.cursorOffset).row);

const applyAction = (
	state: MultilineEditState,
	action: MultilineEditAction,
): MultilineEditState => {
	switch (action.type) {
		case 'move-left': {
			return edit(state, {type: 'move-cursor-left'});
		}

		case 'move-right': {
			return edit(state, {type: 'move-cursor-right'});
		}

		case 'move-up': {
			return moveVertically(state, -1);
		}

		case 'move-down': {
			return moveVertically(state, 1);
		}

		case 'home': {
			return {
				...state,
				cursorOffset: currentLine(state).start,
				goalColumn: undefined,
			};
		}

		case 'end': {
			return {
				...state,
				cursorOffset: currentLine(state).end,
				goalColumn: undefined,
			};
		}

		case 'insert': {
			return insertText(state, action.text);
		}

		case 'newline': {
			return insertNewline(state);
		}

		case 'delete': {
			return edit(state, {type: 'delete'});
		}

		case 'delete-forward': {
			return edit(state, {type: 'delete-forward'});
		}
	}
};

// The state with its top brought up to date for the caret and the rows. The editor draws the view from the same function, so the top the user sees is the top the next action starts from.
const withViewport = (
	state: MultilineEditState,
	rows: number,
): MultilineEditState => {
	const {row} = positionOf(state.value, state.cursorOffset);
	const top = viewportTop(state.top, row, rows, lineStarts(state.value).length);

	return top === state.top ? state : {...state, top};
};

// Pure: no callbacks run here, so React may call it more than once. A no-op returns the state it was given, so the caller sees no change.
export const reduceMultilineEdit: Reducer<
	MultilineEditState,
	MultilineEditAction
> = (state, action) => {
	const next = withViewport(
		applyAction(withViewport(state, action.rows), action),
		action.rows,
	);

	return next.value === state.value &&
		next.cursorOffset === state.cursorOffset &&
		next.goalColumn === state.goalColumn &&
		next.top === state.top
		? state
		: next;
};
