import {
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
	type Reducer,
} from 'react';

export type Transition<State> = {
	previous: State;
	next: State;
};

// Handlers read the state through `latest`, not through a closure. Input events in one stdin drain are dispatched before React commits, so a closure would still hold the state from before the first event. Commits refresh `latest`, and a dispatch updates it at once so the next dispatch builds on it.
export const useSyncedReducer = <State, Action>(
	reducer: Reducer<State, Action>,
	initialState: State | (() => State),
) => {
	const [state, setState] = useState(initialState);
	const latest = useRef(state);

	useLayoutEffect(() => {
		latest.current = state;
	}, [state]);

	const dispatch = useCallback(
		(action: Action): Transition<State> => {
			const previous = latest.current;
			const next = reducer(previous, action);

			if (next !== previous) {
				latest.current = next;
				setState(next);
			}

			return {previous, next};
		},
		[reducer],
	);

	// Replaces the state without a transition, so the caller decides whether anyone is notified. Used when the options change and the component resets.
	const replace = useCallback((next: State) => {
		setState(next);
	}, []);

	return {
		state,
		latest,
		dispatch,
		replace,
	};
};
