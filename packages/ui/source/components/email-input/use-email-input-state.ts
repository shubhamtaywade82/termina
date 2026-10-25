import {useCallback, useMemo, type Reducer} from 'react';
import {useChangeNotifier} from '../../lib/use-change-notifier.js';
import {
	reduceTextEdit,
	type TextEditAction,
	type TextEditState,
} from '../../lib/text-edit-reducer.js';
import {useSyncedReducer} from '../../lib/use-synced-reducer.js';

type State = TextEditState;

// An address has one `@`, so a second one is dropped. Everything else is the shared text edit.
const reducer: Reducer<State, TextEditAction> = (state, action) => {
	if (
		action.type === 'insert' &&
		state.value.includes('@') &&
		action.text.includes('@')
	) {
		return state;
	}

	return reduceTextEdit(state, action);
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
		?.find((domain) => domain.startsWith(enteredDomain))
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
	const {state, latest, dispatch} = useSyncedReducer(reducer, () => ({
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
	}, [dispatch]);

	const moveCursorRight = useCallback(() => {
		dispatch({
			type: 'move-cursor-right',
		});
	}, [dispatch]);

	// Notifies from the edit itself, not from an effect. Effects are keyed to the callback and to the last edit, which repeats calls on re-render and merges edits in one drain.
	const notify = useChangeNotifier(onChange);
	const commit = useCallback(
		(action: TextEditAction): State => {
			const {previous, next} = dispatch(action);

			if (next.value !== previous.value) {
				notify(next.value);
			}

			return next;
		},
		[dispatch, notify],
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
		const {current} = latest;
		const completion = findDomainSuggestion(current.value, domains);

		if (completion !== undefined && completion !== '') {
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
