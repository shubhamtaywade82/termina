import {useCallback, useLayoutEffect, useRef, useState} from 'react';
import {applyTextEdit, type TextEditAction, type TextEditState} from './text-edit.js';

export type UseTextBufferProps = {
	/**
	 * Controlled value. When set, the parent owns the value: every edit is
	 * reported through `onChange`, and the component shows this value until the
	 * parent changes it.
	 */
	readonly value?: string;

	/**
	 * Initial value when uncontrolled. Ignored once `value` is set.
	 */
	readonly defaultValue?: string;

	/**
	 * Called with the next value after every edit that changes it. Never called
	 * for a no-op edit, and never called because of a re-render.
	 */
	readonly onChange?: (value: string) => void;
};

export type UseTextBufferResult = {
	readonly value: string;
	readonly cursorOffset: number;
	readonly edit: (action: TextEditAction) => void;

	/**
	 * Latest proposed value, including edits that have not committed yet. Use it
	 * inside event handlers, where the rendered value can be one edit behind.
	 */
	readonly getValue: () => string;
};

type Failure = {readonly error: unknown};

// `failure` is state, not a ref, so a discarded render never consumes it.
type BufferState = TextEditState & {readonly failure?: Failure};

/**
 * Text buffer shared by the input components.
 *
 * Render has no side effects. The latest proposal lives in a ref, which edits
 * update synchronously. That lets several keys in one tick compose. Commit
 * reconciles the ref to the controlled prop, and a commit-phase effect keeps
 * the `onChange` callback current.
 *
 * Controlled mode displays the `value` prop. An echo of our own edit matches
 * the latest proposal, so the cursor stays put. Any other change, including a
 * rejected edit, adopts the prop and moves the cursor to the end. The parent
 * must apply its echo in the same event. A later value replaces keys typed in
 * between, which is how React's own controlled inputs behave.
 *
 * An exception thrown by `onChange` is stored in state and re-thrown during
 * render, so it reaches the nearest error boundary, as it did before the edit
 * path took over notification.
 */
export const useTextBuffer = ({
	value,
	defaultValue = '',
	onChange,
}: UseTextBufferProps): UseTextBufferResult => {
	const [state, setState] = useState<BufferState>(() => {
		const initial = value ?? defaultValue;
		return {value: initial, cursorOffset: initial.length};
	});

	const latestRef = useRef<TextEditState>(state);

	const onChangeRef = useRef(onChange);
	useLayoutEffect(() => {
		onChangeRef.current = onChange;
	});

	// Runs after every commit. An echo already matches the latest proposal and
	// is left alone. Anything else adopts the prop, with the cursor at the end.
	useLayoutEffect(() => {
		if (value === undefined || value === latestRef.current.value) {
			return;
		}

		const adopted = {value, cursorOffset: value.length};
		latestRef.current = adopted;
		setState(adopted);
	});

	const edit = useCallback((action: TextEditAction) => {
		const previous = latestRef.current;
		const next = applyTextEdit(previous, action);
		if (next === previous) {
			return;
		}

		latestRef.current = next;

		let failure: Failure | undefined;
		if (next.value !== previous.value) {
			try {
				onChangeRef.current?.(next.value);
			} catch (error: unknown) {
				failure = {error};
			}
		}

		setState({...next, failure});
	}, []);

	const getValue = useCallback(() => latestRef.current.value, []);

	if (state.failure) {
		throw state.failure.error;
	}

	const shownValue = value ?? state.value;

	return {
		value: shownValue,
		cursorOffset: Math.min(state.cursorOffset, shownValue.length),
		edit,
		getValue,
	};
};
