import {useCallback, useMemo, type Reducer} from 'react';
import {useSyncedReducer} from '../../lib/use-synced-reducer.js';

type State = {
	value: string;
	cursorOffset: number;
};

type Action =
	| MoveCursorLeftAction
	| MoveCursorRightAction
	| InsertAction
	| AppendAction
	| DeleteAction;

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

const reducer: Reducer<State, Action> = (state, action) => {
	switch (action.type) {
		case 'move-cursor-left': {
			return {
				...state,
				cursorOffset: Math.max(0, state.cursorOffset - 1),
			};
		}

		case 'move-cursor-right': {
			return {
				...state,
				cursorOffset: Math.min(state.value.length, state.cursorOffset + 1),
			};
		}

		case 'insert': {
			if (state.value.includes('@') && action.text.includes('@')) {
				return state;
			}

			return {
				...state,
				value:
					state.value.slice(0, state.cursorOffset) +
					action.text +
					state.value.slice(state.cursorOffset),
				cursorOffset: state.cursorOffset + action.text.length,
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
			const newCursorOffset = Math.max(0, state.cursorOffset - 1);

			return {
				...state,
				value:
					state.value.slice(0, newCursorOffset) +
					state.value.slice(newCursorOffset + 1),
				cursorOffset: newCursorOffset,
			};
		}
	}
};

export type UseEmailInputStateProps = {
	/**
	 * Initial value to display in a text input.
	 */
	defaultValue?: string;

	/**
	 * Domains of email providers to auto complete.
	 *
	 * @default ["aol.com", "gmail.com", "yahoo.com", "hotmail.com", "live.com", "outlook.com", "icloud.com", "hey.com"]
	 */
	domains?: string[];

	/**
	 * Callback when value updates.
	 */
	onChange?: (value: string) => void;

	/**
	 * Callback when `Enter` is pressed. First argument is a value of the input.
	 */
	onSubmit?: (value: string) => void;
};

export type EmailInputState = State & {
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
	 * Delete character.
	 */
	delete: () => void;

	/**
	 * Submit input value.
	 */
	submit: () => void;
};

// The domain completion for an address. Empty values and values without an `@` have none.
const findDomainSuggestion = (
	value: string,
	domains: string[] | undefined,
): string | undefined => {
	if (value.length === 0 || !value.includes('@')) {
		return;
	}

	const atIndex = value.indexOf('@');
	const enteredDomain = value.slice(atIndex + 1);

	return domains
		?.find(domain => domain.startsWith(enteredDomain))
		?.replace(enteredDomain, '');
};

export const useEmailInputState = ({
	defaultValue = '',
	domains = [
		'aol.com',
		'gmail.com',
		'yahoo.com',
		'hotmail.com',
		'live.com',
		'outlook.com',
		'icloud.com',
		'hey.com',
	],
	onChange,
	onSubmit,
}: UseEmailInputStateProps) => {
	const {
		state,
		latest,
		dispatch,
	} = useSyncedReducer(reducer, () => ({
		value: defaultValue,
		cursorOffset: defaultValue.length,
	}));

	const suggestion = useMemo(
		() => findDomainSuggestion(state.value, domains),
		[state.value, domains],
	);

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

	// Notifies from the edit itself, not from an effect. Effects are keyed to the callback and to the last edit, which repeats calls on re-render and merges edits in one drain.
	const commit = useCallback(
		(action: Action): State => {
			const {previous, next} = dispatch(action);

			if (next.value !== previous.value) {
				onChange?.(next.value);
			}

			return next;
		},
		[dispatch, onChange],
	);

	const insert = useCallback(
		(text: string) => {
			commit({
				type: 'insert',
				text,
			});
		},
		[commit],
	);

	const deleteCharacter = useCallback(() => {
		commit({
			type: 'delete',
		});
	}, [commit]);

	const submit = useCallback(() => {
		// Read the latest value, not the render's closure, so Enter after a burst submits what the burst produced.
		const current = latest.current;
		const completion = findDomainSuggestion(current.value, domains);

		if (completion) {
			const next = commit({type: 'append', text: completion});
			onSubmit?.(next.value);
			return;
		}

		onSubmit?.(current.value);
	}, [commit, domains, latest, onSubmit]);

	return {
		...state,
		suggestion,
		moveCursorLeft,
		moveCursorRight,
		insert,
		delete: deleteCharacter,
		submit,
	};
};
