import {EventEmitter} from 'node:events';
import process from 'node:process';
import React, {
	type ReactNode,
	useState,
	useRef,
	useCallback,
	useMemo,
	useEffect,
	useInsertionEffect,
} from 'react';
import cliCursor from 'cli-cursor';
import {type CursorPosition} from '../log-update.js';
import {type CursorShape} from '../cursor-shape.js';
import {
	createInputParser,
	escapeFlushDelayMilliseconds,
	pasteFlushDelayMilliseconds,
	isCompleteControlSequence,
	type InputEvent,
} from '../input-parser.js';
import parseKeypress from '../parse-keypress.js';
import {getRawModeStream, type OutputStream} from '../stream.js';
import AppContext, {type SuspendTerminal} from './AppContext.js';
import StdinContext from './StdinContext.js';
import StdoutContext from './StdoutContext.js';
import StderrContext from './StderrContext.js';
import FocusContext from './FocusContext.js';
import AnimationContext from './AnimationContext.js';
import CursorContext from './CursorContext.js';
import CursorShapeContext from './CursorShapeContext.js';
import ErrorBoundary from './ErrorBoundary.js';
import {
	mouseTrackingDisable,
	mouseTrackingEnable,
	parseMouseEvent,
} from '../mouse.js';

type AnimationSubscriber = {
	readonly callback: (currentTime: number) => void;
	readonly interval: number;
	readonly startTime: number;
	nextDueTime: number;
};

type Props = {
	readonly children: ReactNode;
	readonly stdin: NodeJS.ReadableStream;
	readonly stdout: OutputStream;
	readonly stderr: OutputStream;
	readonly writeToStdout: (data: string) => void;
	readonly writeToStderr: (data: string) => void;
	readonly exitOnCtrlC: boolean;
	readonly onExit: (errorOrResult?: unknown) => void;
	readonly onWaitUntilRenderFlush: () => Promise<void>;
	readonly onSuspendTerminal: SuspendTerminal;
	readonly onKittyQueryResponse: () => void;
	readonly onRegisterInputControl: (
		pauseInput: () => void,
		resumeInput: () => void,
	) => void;
	// Runs the input events of one stdin read as a batch. `commitEvent` must be called after each event.
	readonly onBatchInput: (run: (commitEvent: () => void) => void) => void;
	readonly onCursorShape: (id: string, shape: CursorShape | undefined) => void;
	readonly setCursorPosition: (position: CursorPosition | undefined) => void;
	readonly interactive: boolean;
	readonly renderThrottleMs: number;
};

type Focusable = {
	readonly id: string;
	// Unique per registration, so removing one of two components that share an id leaves the other.
	readonly token: symbol;
	// The focus scope of the enclosing KeyboardCapture, or undefined outside every capture.
	readonly scope: symbol | undefined;
	readonly isActive: boolean;
};

type KeyboardCaptureEntry = {
	readonly owner: symbol;
	readonly scope: symbol;
	readonly depth: number;
};

// Components sharing a custom ID are indistinguishable to focus, so navigation treats each ID as one slot at its first registration.
const uniqueFocusables = (focusables: Focusable[]): Focusable[] => {
	const seenIds = new Set<string>();

	return focusables.filter(focusable => {
		if (seenIds.has(focusable.id)) {
			return false;
		}

		seenIds.add(focusable.id);
		return true;
	});
};

// The deepest entry is the top, so the innermost capture wins. Among entries at the same depth, the one pushed last wins, as in registerCapture.
const topKeyboardCapture = (
	stack: KeyboardCaptureEntry[],
): KeyboardCaptureEntry | undefined => {
	let top: KeyboardCaptureEntry | undefined;

	for (const entry of stack) {
		if (top === undefined || entry.depth >= top.depth) {
			top = entry;
		}
	}

	return top;
};

// With a capture active, navigation reaches only the focusables in its scope. With no capture, every focusable is reachable.
const navigableFocusables = (
	focusables: Focusable[],
	capture: KeyboardCaptureEntry | undefined,
): Focusable[] =>
	uniqueFocusables(
		capture === undefined
			? focusables
			: focusables.filter((focusable) => focusable.scope === capture.scope),
	);

// Root component for all Ink apps
// It renders stdin and stdout contexts, so that children can access them if needed
// It also handles Ctrl+C exiting and cursor visibility
function App({
	children,
	stdin,
	stdout,
	stderr,
	writeToStdout,
	writeToStderr,
	exitOnCtrlC,
	onExit,
	onWaitUntilRenderFlush,
	onSuspendTerminal,
	onKittyQueryResponse,
	onRegisterInputControl,
	onBatchInput,
	onCursorShape,
	setCursorPosition,
	interactive,
	renderThrottleMs,
}: Props): React.ReactNode {
	const isFocusEnabledRef = useRef(true);
	const [activeFocusId, setActiveFocusId] = useState<string | undefined>(
		undefined,
	);
	// The registry is not rendered. Keep it current without nesting state updates, so focus changes are queued in call order.
	const focusablesRef = useRef<Focusable[]>([]);
	// Keyboard captures in push order. While the stack is not empty, only the top entry's owner receives input.
	const keyboardCaptureStackRef = useRef<KeyboardCaptureEntry[]>([]);
	const animationSubscribersRef = useRef(
		new Map<(currentTime: number) => void, AnimationSubscriber>(),
	);
	const animationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	// Count how many components enabled raw mode to avoid disabling
	// raw mode until all components don't need it anymore
	const rawModeEnabledCountRef = useRef(0);
	const pendingDisableRawModeRef = useRef(false);
	// Set while suspendTerminal() has handed input to a child process. Input hooks that change while it is set only update the ref counts; resumeInput restores the modes that still have an owner.
	const isInputPausedRef = useRef(false);
	// Count how many components enabled bracketed paste mode
	const bracketedPasteModeEnabledCountRef = useRef(0);
		const mouseTrackingCountRef = useRef(0);
	const eventEmitterRef = useRef(new EventEmitter());
	// Each useInput hook adds a listener, so the count can legitimately exceed the default limit of 10.
	eventEmitterRef.current.setMaxListeners(Infinity);
	// Store the currently attached readable listener to avoid stale closure issues
	const readableListenerRef = useRef<(() => void) | undefined>(undefined);
	const inputParserRef = useRef(createInputParser());
	const pendingInputFlushRef = useRef<NodeJS.Timeout | undefined>(undefined);

	const clearPendingInputFlush = useCallback((): void => {
		if (!pendingInputFlushRef.current) {
			return;
		}

		clearTimeout(pendingInputFlushRef.current);
		pendingInputFlushRef.current = undefined;
	}, []);

	const clearAnimationTimer = useCallback((): void => {
		if (!animationTimerRef.current) {
			return;
		}

		clearTimeout(animationTimerRef.current);
		animationTimerRef.current = undefined;
	}, []);

	const scheduleAnimationTick = useCallback((): void => {
		clearAnimationTimer();

		if (animationSubscribersRef.current.size === 0) {
			return;
		}

		let nextDueTime = Infinity;

		for (const subscriber of animationSubscribersRef.current.values()) {
			// One shared timer is enough as long as it wakes at the earliest
			// subscriber deadline and lets slower animations skip that tick.
			nextDueTime = Math.min(nextDueTime, subscriber.nextDueTime);
		}

		const delay = Math.max(0, nextDueTime - performance.now());
		animationTimerRef.current = setTimeout(() => {
			animationTimerRef.current = undefined;
			const currentTime = performance.now();

			for (const subscriber of animationSubscribersRef.current.values()) {
				if (currentTime < subscriber.nextDueTime) {
					continue;
				}

				subscriber.callback(currentTime);
				const elapsedTime = currentTime - subscriber.startTime;
				const elapsedFrames = Math.floor(elapsedTime / subscriber.interval) + 1;
				// Advance from elapsed time rather than callback count so delayed
				// ticks catch up instead of stretching the animation timeline.
				subscriber.nextDueTime =
					subscriber.startTime + elapsedFrames * subscriber.interval;
			}

			scheduleAnimationTick();
		}, delay);
		// Keep the timer ref'd while animations are active so `useAnimation()`
		// can drive process lifetime in both interactive and non-interactive apps.
	}, [clearAnimationTimer]);

	const animationSubscribe = useCallback(
		(
			callback: (currentTime: number) => void,
			interval: number,
		): {readonly startTime: number; readonly unsubscribe: () => void} => {
			const startTime = performance.now();
			// The scheduler owns the start timestamp so hooks can derive frames from
			// the exact same origin that determines each subscriber's due time.
			animationSubscribersRef.current.set(callback, {
				callback,
				interval,
				startTime,
				nextDueTime: startTime + interval,
			});
			scheduleAnimationTick();

			return {
				startTime,
				unsubscribe() {
					animationSubscribersRef.current.delete(callback);

					if (animationSubscribersRef.current.size === 0) {
						clearAnimationTimer();
						return;
					}

					scheduleAnimationTick();
				},
			};
		},
		[clearAnimationTimer, scheduleAnimationTick],
	);

	useEffect(
		() => () => {
			clearAnimationTimer();
		},
		[clearAnimationTimer],
	);

	const rawModeStdin = getRawModeStream(stdin);
	const isRawModeSupported = rawModeStdin !== undefined;

	const detachReadableListener = useCallback((): void => {
		if (!readableListenerRef.current) {
			return;
		}

		stdin.removeListener('readable', readableListenerRef.current);
		readableListenerRef.current = undefined;
	}, [stdin]);

	const clearInputState = useCallback((): void => {
		inputParserRef.current.reset();
		clearPendingInputFlush();
		detachReadableListener();
	}, [clearPendingInputFlush, detachReadableListener]);

	const disableRawMode = useCallback((): void => {
		if (!rawModeStdin) {
			return;
		}

		pendingDisableRawModeRef.current = false;
		rawModeStdin.setRawMode(false);
		rawModeStdin.unref?.();
		rawModeEnabledCountRef.current = 0;
		clearInputState();
	}, [rawModeStdin, clearInputState]);

	const handleExit = useCallback(
		(errorOrResult?: unknown): void => {
			if (
				isRawModeSupported &&
				(rawModeEnabledCountRef.current > 0 || pendingDisableRawModeRef.current)
			) {
				disableRawMode();
			}

			onExit(errorOrResult);
		},
		[isRawModeSupported, disableRawMode, onExit],
	);

	// The entry with the greatest depth is the top, so the innermost capture wins. Among captures at the same depth, the one pushed last wins. Layout effects run child first, so push order alone would let an outer capture win over an inner one.
	const registerCapture = useCallback(
		(owner: symbol, depth: number, scope: symbol): (() => void) => {
			const entry: KeyboardCaptureEntry = {owner, depth, scope};
			keyboardCaptureStackRef.current = [
				...keyboardCaptureStackRef.current,
				entry,
			];

			return () => {
				keyboardCaptureStackRef.current =
					keyboardCaptureStackRef.current.filter(
						(candidate) => candidate !== entry,
					);
			};
		},
		[],
	);

	// An empty stack accepts everything. Otherwise only the top capture's owner does, and app-level input (no owner) waits until no capture is active.
	const canReceive = useCallback((owner: symbol | undefined): boolean => {
		const stack = keyboardCaptureStackRef.current;

		return stack.length === 0 || topKeyboardCapture(stack)?.owner === owner;
	}, []);

	const handleInput = useCallback(
		(input: string): void => {
			const key = parseKeypress(input);

			// Exit on Ctrl+C. This runs before any capture check, so a capture cannot block it.
			if (
				exitOnCtrlC &&
				key.ctrl &&
				key.name === 'c' &&
				key.eventType !== 'release'
			) {
				handleExit();
				return;
			}

			// Reset focus when there's an active focused component on Esc. While a capture is active, Escape belongs to the capture, so focus stays put.
			if (
				isFocusEnabledRef.current &&
				canReceive(undefined) &&
				key.name === 'escape' &&
				key.eventType !== 'release' &&
				!key.shift &&
				!key.ctrl &&
				!key.meta &&
				key.super !== true &&
				key.hyper !== true
			) {
				setActiveFocusId(undefined);
			}
		},
		[exitOnCtrlC, handleExit, canReceive],
	);

	const emitInput = useCallback(
		(input: string): void => {
			handleInput(input);
			eventEmitterRef.current.emit('input', input);
		},
		[handleInput],
	);

	const emitPaste = useCallback(
		(pasted: string): void => {
			// Keep paste on a separate channel from `useInput` so key handlers
			// don't need to branch on mixed key-vs-paste event shapes.
			if (eventEmitterRef.current.listenerCount('paste') === 0) {
				emitInput(pasted);
				return;
			}

			eventEmitterRef.current.emit('paste', pasted);
		},
		[emitInput],
	);

	const schedulePendingInputFlush = useCallback((): void => {
		clearPendingInputFlush();
		pendingInputFlushRef.current = setTimeout(() => {
			pendingInputFlushRef.current = undefined;
			const pendingEscape = inputParserRef.current.flushPendingEscape();
			if (pendingEscape === undefined || pendingEscape === '') {
				return;
			}

			emitInput(pendingEscape);
		}, escapeFlushDelayMilliseconds);
	}, [clearPendingInputFlush, emitInput]);

	const schedulePendingPasteFlush = useCallback((): void => {
		clearPendingInputFlush();
		pendingInputFlushRef.current = setTimeout(() => {
			pendingInputFlushRef.current = undefined;
			const pasted = inputParserRef.current.flushPendingPaste();
			if (pasted === undefined || pasted === '') {
				return;
			}

			emitPaste(pasted);
		}, pasteFlushDelayMilliseconds);
	}, [clearPendingInputFlush, emitPaste]);

	const handleReadable = useCallback((): void => {
		const handleInputEvent = (event: InputEvent): void => {
			if (typeof event === 'string') {
				// Protocol replies are consumed here; bracketed paste stays literal.
				// eslint-disable-next-line no-control-regex, regexp/no-control-character -- Kitty keyboard query replies start with ESC.
				if (/^\u{1B}\[\?\d+u$/u.test(event)) {
					onKittyQueryResponse();
					return;
				}

				// SGR mouse reports are delivered only to useMouse. They are complete CSI sequences, so they must never reach useInput as text.
				const mouseEvent = parseMouseEvent(event);
				if (mouseEvent) {
					eventEmitterRef.current.emit('mouse', mouseEvent);
					return;
				}

				// A complete CSI or SS3 sequence that maps to no key Ink can represent is not printable text. Terminal replies (focus in/out, cursor position, mouse, device attributes) and keys without a `Key` field would otherwise reach `useInput` with the ESC stripped, as if typed.
				if (isCompleteControlSequence(event)) {
					const key = parseKeypress(event);
					if (!key.isKittyProtocol && key.name === '') {
						return;
					}
				}

				emitInput(event);
			} else {
				emitPaste(event.paste);
			}
		};

		clearPendingInputFlush();
		let chunk;
		// eslint-disable-next-line @typescript-eslint/no-restricted-types
		while ((chunk = stdin.read() as string | null) !== null) {
			const text = chunk;
			// Each event commits before the next one runs, so a handler and a controlled input see the state the previous event produced. The render waits for the batch, so one read still produces one frame.
			onBatchInput((commitEvent) => {
				for (const event of inputParserRef.current.push(text)) {
					handleInputEvent(event);
					commitEvent();
				}
			});
		}

		if (inputParserRef.current.hasPendingEscape()) {
			schedulePendingInputFlush();
		} else if (inputParserRef.current.hasPendingPaste()) {
			schedulePendingPasteFlush();
		}
	}, [
		stdin,
		emitInput,
		emitPaste,
		clearPendingInputFlush,
		schedulePendingInputFlush,
		schedulePendingPasteFlush,
		onKittyQueryResponse,
		onBatchInput,
	]);

	const attachReadableListener = useCallback((): void => {
		if (readableListenerRef.current) {
			return;
		}

		// Store the listener reference to avoid stale closure when removing
		readableListenerRef.current = handleReadable;
		stdin.addListener('readable', handleReadable);
	}, [stdin, handleReadable]);

	const handleSetRawMode = useCallback(
		(isEnabled: boolean): void => {
			if (!rawModeStdin) {
				if (stdin === process.stdin) {
					throw new Error(
						'Raw mode is not supported on the current process.stdin, which Ink uses as input stream by default.\nRead about how to prevent this error on https://github.com/vadimdemedes/ink/#israwmodesupported',
					);
				}

				throw new Error(
					'Raw mode is not supported on the stdin provided to Ink.\nRead about how to prevent this error on https://github.com/vadimdemedes/ink/#israwmodesupported',
				);
			}

			rawModeStdin.setEncoding('utf8');

			if (isEnabled) {
				if (rawModeEnabledCountRef.current === 0) {
					// A same-render component swap may have detached input handling while
					// leaving terminal raw mode enabled until the queued disable runs.
					const isRawModeAlreadyEnabled = pendingDisableRawModeRef.current;
					pendingDisableRawModeRef.current = false;

					if (!isInputPausedRef.current) {
						if (!isRawModeAlreadyEnabled) {
							rawModeStdin.ref?.();
							rawModeStdin.setRawMode(true);
						}

						attachReadableListener();
					}
				}

				rawModeEnabledCountRef.current++;
				return;
			}

			if (
				rawModeEnabledCountRef.current === 0 ||
				--rawModeEnabledCountRef.current !== 0 ||
				// Nothing to release while suspended: pauseInput already did.
				isInputPausedRef.current
			) {
				return;
			}

			// Stop owning input immediately so pending parser state cannot leak into
			// a replacement `useInput` component mounted in the same React update.
			clearInputState();

			// Defer only the terminal raw-mode teardown so a same-render replacement
			// can keep the process ref and raw mode active without a disable/enable cycle.
			pendingDisableRawModeRef.current = true;
			queueMicrotask(() => {
				if (!pendingDisableRawModeRef.current) {
					return;
				}

				disableRawMode();
			});
		},
		[
			rawModeStdin,
			stdin,
			attachReadableListener,
			clearInputState,
			disableRawMode,
		],
	);

	const handleSetBracketedPasteMode = useCallback(
		(isEnabled: boolean): void => {
			if (!stdout.isTTY) {
				return;
			}

			if (isEnabled) {
				if (
					bracketedPasteModeEnabledCountRef.current === 0 &&
					!isInputPausedRef.current
				) {
					stdout.write('\u{1B}[?2004h');
				}

				bracketedPasteModeEnabledCountRef.current++;
				return;
			}

			if (bracketedPasteModeEnabledCountRef.current === 0) {
				return;
			}

			if (
				--bracketedPasteModeEnabledCountRef.current === 0 &&
				!isInputPausedRef.current
			) {
				stdout.write('\u{1B}[?2004l');
			}
		},
		[stdout],
	);

	// Mouse tracking follows the bracketed-paste ownership rules: every mounted useMouse shares one mode, and it is released with the last one.
	const handleSetMouseTracking = useCallback(
		(isEnabled: boolean): void => {
			if (!stdout.isTTY) {
				return;
			}

			if (isEnabled) {
				if (mouseTrackingCountRef.current === 0 && !isInputPausedRef.current) {
					stdout.write(mouseTrackingEnable);
				}

				mouseTrackingCountRef.current++;
				return;
			}

			if (mouseTrackingCountRef.current === 0) {
				return;
			}

			if (--mouseTrackingCountRef.current === 0 && !isInputPausedRef.current) {
				stdout.write(mouseTrackingDisable);
			}
		},
		[stdout],
	);

	// Pausing and resuming leave the ref counts untouched: the React components
	// still "own" raw mode/bracketed paste across the suspension.
	const pauseInput = useCallback((): void => {
		isInputPausedRef.current = true;

		// The mode writes below are best effort: stdout may already be closed (EPIPE) while suspending, and a throw here would leave raw mode on for the child.
		if (bracketedPasteModeEnabledCountRef.current > 0 && stdout.isTTY) {
			try {
				stdout.write('\u{1B}[?2004l');
			} catch {}
		}

		if (mouseTrackingCountRef.current > 0 && stdout.isTTY) {
			try {
				stdout.write(mouseTrackingDisable);
			} catch {}
		}

		// A queued raw-mode disable (last input hook released this commit) has not run yet, so raw mode is still on. Disable it now, before the child owns the terminal, and cancel the microtask.
		if (!(
			isRawModeSupported &&
			(rawModeEnabledCountRef.current > 0 || pendingDisableRawModeRef.current)
		)) {
			return;
		}

		pendingDisableRawModeRef.current = false;
		rawModeStdin?.setRawMode(false);
		rawModeStdin?.unref?.();
		clearInputState();
	}, [isRawModeSupported, rawModeStdin, stdout, clearInputState]);

	// Hooks may have changed while suspended, so restore only the modes that still have an owner.
	const resumeInput = useCallback((): void => {
		isInputPausedRef.current = false;

		if (isRawModeSupported && rawModeEnabledCountRef.current > 0) {
			rawModeStdin?.setEncoding('utf8');
			rawModeStdin?.ref?.();
			rawModeStdin?.setRawMode(true);
			attachReadableListener();
		}

		// Best effort, as in pauseInput: a closed stdout must not abort resuming input.
		if (bracketedPasteModeEnabledCountRef.current > 0 && stdout.isTTY) {
			try {
				stdout.write('\u{1B}[?2004h');
			} catch {}
		}
		if (mouseTrackingCountRef.current > 0 && stdout.isTTY) {
			try {
				stdout.write(mouseTrackingEnable);
			} catch {}
		}

	}, [isRawModeSupported, rawModeStdin, stdout, attachReadableListener]);

	// Register input pause/resume in an insertion effect: it runs before every
	// passive effect (parent and child), so a child that calls suspendTerminal()
	// from its own effect always finds the input control already registered. A
	// normal effect would run too late (child effects fire before the parent's).
	useInsertionEffect(() => {
		onRegisterInputControl(pauseInput, resumeInput);
	}, [onRegisterInputControl, pauseInput, resumeInput]);

	// Focus navigation helpers
	const findNextFocusable = useCallback(
		(
			currentFocusables: Focusable[],
			currentActiveFocusId: string | undefined,
		): string | undefined => {
			const activeIndex = currentFocusables.findIndex(
				focusable => focusable.id === currentActiveFocusId,
			);

			for (
				let index = activeIndex + 1;
				index < currentFocusables.length;
				index++
			) {
				const focusable = currentFocusables[index];

				if (focusable?.isActive) {
					return focusable.id;
				}
			}

			return undefined;
		},
		[],
	);

	const findPreviousFocusable = useCallback(
		(
			currentFocusables: Focusable[],
			currentActiveFocusId: string | undefined,
		): string | undefined => {
			const activeIndex = currentFocusables.findIndex(
				focusable => focusable.id === currentActiveFocusId,
			);

			for (let index = activeIndex - 1; index >= 0; index--) {
				const focusable = currentFocusables[index];

				if (focusable?.isActive) {
					return focusable.id;
				}
			}

			return undefined;
		},
		[],
	);

	const focusNext = useCallback((): void => {
		const currentFocusables = navigableFocusables(
			focusablesRef.current,
			topKeyboardCapture(keyboardCaptureStackRef.current),
		);

		// With no active focusable in reach, focus stays where it is. Inside a capture, that keeps Tab from leaving the capture.
		if (currentFocusables.every((focusable) => !focusable.isActive)) {
			return;
		}

		setActiveFocusId(currentActiveFocusId => {
			const firstFocusableId = currentFocusables.find(
				focusable => focusable.isActive,
			)?.id;
			const nextFocusableId = findNextFocusable(
				currentFocusables,
				currentActiveFocusId,
			);

			return nextFocusableId ?? firstFocusableId;
		});
	}, [findNextFocusable]);

	const focusPrevious = useCallback((): void => {
		const currentFocusables = navigableFocusables(
			focusablesRef.current,
			topKeyboardCapture(keyboardCaptureStackRef.current),
		);

		// With no active focusable in reach, focus stays where it is. Inside a capture, that keeps Shift+Tab from leaving the capture.
		if (currentFocusables.every((focusable) => !focusable.isActive)) {
			return;
		}

		setActiveFocusId(currentActiveFocusId => {
			const lastFocusableId = currentFocusables.findLast(
				focusable => focusable.isActive,
			)?.id;
			const previousFocusableId = findPreviousFocusable(
				currentFocusables,
				currentActiveFocusId,
			);

			return previousFocusableId ?? lastFocusableId;
		});
	}, [findPreviousFocusable]);

	// Focuses the first active focusable in `scope`, in navigation order. Ignored while focus management is disabled.
	const focusFirstInScope = useCallback((scope: symbol | undefined): void => {
		if (!isFocusEnabledRef.current) {
			return;
		}

		const firstFocusable = uniqueFocusables(
			focusablesRef.current.filter((focusable) => focusable.scope === scope),
		).find((focusable) => focusable.isActive);

		if (firstFocusable !== undefined) {
			setActiveFocusId(firstFocusable.id);
		}
	}, []);

	// Handle tab navigation via effect that subscribes to input events
	useEffect(() => {
		const handleTabNavigation = (input: string): void => {
			if (!isFocusEnabledRef.current || focusablesRef.current.length === 0) {
				return;
			}

			const key = parseKeypress(input);
			if (
				key.name !== 'tab' ||
				key.eventType === 'release' ||
				key.ctrl ||
				key.meta ||
				key.super === true ||
				key.hyper === true
			) {
				return;
			}

			if (key.shift) {
				focusPrevious();
			} else {
				focusNext();
			}
		};

		eventEmitterRef.current.on('input', handleTabNavigation);
		const emitter = eventEmitterRef.current;

		return () => {
			emitter.off('input', handleTabNavigation);
		};
	}, [focusNext, focusPrevious]);

	const enableFocus = useCallback((): void => {
		isFocusEnabledRef.current = true;
	}, []);

	const disableFocus = useCallback((): void => {
		isFocusEnabledRef.current = false;
		setActiveFocusId(undefined);
	}, []);

	const focus = useCallback((id: string): void => {
		const hasFocusableId = focusablesRef.current.some(
			focusable => focusable.id === id && focusable.isActive,
		);

		if (hasFocusableId) {
			setActiveFocusId(id);
		}
	}, []);

	const addFocusable = useCallback(
		(
			id: string,
			{autoFocus, token}: {autoFocus: boolean; token: symbol},
		): void => {
			// The scope arrives through setFocusableScope in the same effect flush, before any input is read.
			focusablesRef.current = [
				...focusablesRef.current,
				{id, token, scope: undefined, isActive: true},
			];

			if (autoFocus && isFocusEnabledRef.current) {
				setActiveFocusId(currentActiveFocusId => currentActiveFocusId ?? id);
			}
		},
		[],
	);

	// Setting the scope updates the registration in place, so its place in the focus order does not change.
	const setFocusableScope = useCallback(
		(token: symbol, scope: symbol | undefined): void => {
			focusablesRef.current = focusablesRef.current.map((focusable) =>
				focusable.token === token ? {...focusable, scope} : focusable,
			);
		},
		[],
	);

	// Removes only this registration. Another registration that shares its id stays in the focus order, and keeps the id focused.
	const removeFocusable = useCallback((token: symbol): void => {
		const removed = focusablesRef.current.find(
			(focusable) => focusable.token === token,
		);

		focusablesRef.current = focusablesRef.current.filter(
			(focusable) => focusable.token !== token,
		);

		if (
			removed === undefined ||
			focusablesRef.current.some((focusable) => focusable.id === removed.id)
		) {
			return;
		}

		const removedId = removed.id;
		setActiveFocusId(currentActiveFocusId =>
			currentActiveFocusId === removedId ? undefined : currentActiveFocusId,
		);
	}, []);

	const activateFocusable = useCallback((id: string): void => {
		focusablesRef.current = focusablesRef.current.map(focusable =>
			focusable.id === id ? {...focusable, isActive: true} : focusable,
		);
	}, []);

	const deactivateFocusable = useCallback((id: string): void => {
		setActiveFocusId(currentActiveFocusId =>
			currentActiveFocusId === id ? undefined : currentActiveFocusId,
		);

		focusablesRef.current = focusablesRef.current.map(focusable =>
			focusable.id === id ? {...focusable, isActive: false} : focusable,
		);
	}, []);

	// Handle cursor visibility, raw mode, and bracketed paste mode cleanup on unmount
	useEffect(
		() => () => {
			const canWriteToStdout = !stdout.destroyed && !stdout.writableEnded;

			if (interactive && canWriteToStdout) {
				cliCursor.show(stdout);
			}

			if (
				isRawModeSupported &&
				(rawModeEnabledCountRef.current > 0 || pendingDisableRawModeRef.current)
			) {
				disableRawMode();
			}

			if (mouseTrackingCountRef.current > 0 && canWriteToStdout && stdout.isTTY) {
				stdout.write(mouseTrackingDisable);
			}

			mouseTrackingCountRef.current = 0;

			if (!(bracketedPasteModeEnabledCountRef.current > 0)) {
				return;
			}

			if (canWriteToStdout && stdout.isTTY) {
				stdout.write('\u{1B}[?2004l');
			}

			bracketedPasteModeEnabledCountRef.current = 0;
		},
		[stdout, isRawModeSupported, disableRawMode, interactive],
	);

	// Memoize context values to prevent unnecessary re-renders
	const appContextValue = useMemo(
		() => ({
			exit: handleExit,
			waitUntilRenderFlush: onWaitUntilRenderFlush,
			suspendTerminal: onSuspendTerminal,
		}),
		[handleExit, onWaitUntilRenderFlush, onSuspendTerminal],
	);

	const stdinContextValue = useMemo(
		() => ({
			stdin,
			setRawMode: handleSetRawMode,
			setBracketedPasteMode: handleSetBracketedPasteMode,
			setMouseTracking: handleSetMouseTracking,
			isRawModeSupported,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			internal_exitOnCtrlC: exitOnCtrlC,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			internal_eventEmitter: eventEmitterRef.current,
			registerCapture,
			canReceive,
		}),
		[
			stdin,
			handleSetRawMode,
			handleSetBracketedPasteMode,
			handleSetMouseTracking,
			isRawModeSupported,
			exitOnCtrlC,
			registerCapture,
			canReceive,
		],
	);

	const stdoutContextValue = useMemo(
		() => ({
			stdout,
			write: writeToStdout,
		}),
		[stdout, writeToStdout],
	);

	const stderrContextValue = useMemo(
		() => ({
			stderr,
			write: writeToStderr,
		}),
		[stderr, writeToStderr],
	);

	const cursorContextValue = useMemo(
		() => ({
			setCursorPosition,
		}),
		[setCursorPosition],
	);

	// The context's `set` keeps one identity, so components never depend on the identity of the prop.
	const setCursorShape = useCallback(
		(id: string, shape: CursorShape | undefined): void => {
			onCursorShape(id, shape);
		},
		[onCursorShape],
	);

	const cursorShapeContextValue = useMemo(
		() => ({
			set: setCursorShape,
		}),
		[setCursorShape],
	);

	const focusContextValue = useMemo(
		() => ({
			activeId: activeFocusId,
			add: addFocusable,
			remove: removeFocusable,
			setScope: setFocusableScope,
			activate: activateFocusable,
			deactivate: deactivateFocusable,
			enableFocus,
			disableFocus,
			focusNext,
			focusPrevious,
			focusFirstInScope,
			focus,
		}),
		[
			activeFocusId,
			addFocusable,
			removeFocusable,
			setFocusableScope,
			activateFocusable,
			deactivateFocusable,
			enableFocus,
			disableFocus,
			focusNext,
			focusPrevious,
			focusFirstInScope,
			focus,
		],
	);

	const animationContextValue = useMemo(
		() => ({
			renderThrottleMs,
			subscribe: animationSubscribe,
		}),
		[animationSubscribe, renderThrottleMs],
	);

	return (
		<AppContext value={appContextValue}>
			<StdinContext value={stdinContextValue}>
				<StdoutContext value={stdoutContextValue}>
					<StderrContext value={stderrContextValue}>
						<FocusContext value={focusContextValue}>
							<AnimationContext value={animationContextValue}>
								<CursorContext value={cursorContextValue}>
									<CursorShapeContext value={cursorShapeContextValue}>
										<ErrorBoundary onError={handleExit}>
											{children}
										</ErrorBoundary>
									</CursorShapeContext>
								</CursorContext>
							</AnimationContext>
						</FocusContext>
					</StderrContext>
				</StdoutContext>
			</StdinContext>
		</AppContext>
	);
}

App.displayName = 'InternalApp';

export default App;
