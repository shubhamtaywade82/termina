import React, {
	type ReactNode,
	useEffect,
	useEffectEvent,
	useState,
} from 'react';
import {Box} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {StatusMessage} from '../status-message/index.js';
import {type StatusMessageVariant} from '../status-message/types.js';
import {type Theme} from './theme.js';

export type ToastProps = {
	/**
	 * Message. It is rendered inside a `Text` element, so pass strings or `Text` elements.
	 */
	readonly children: ReactNode;

	/**
	 * Variant, which sets the icon and color. See `StatusMessage`.
	 *
	 * @default "info"
	 */
	readonly variant?: StatusMessageVariant;

	/**
	 * Milliseconds before the toast hides itself. `0`, a negative value, or a value
	 * above 2147483647 (including `Infinity`) keeps it until it unmounts.
	 *
	 * @default 3000
	 */
	readonly durationMs?: number;

	/**
	 * Called once, when the toast hides itself.
	 */
	readonly onDismiss?: () => void;
};

type AutoDismissOptions = {
	readonly durationMs: number;
	readonly onDismiss?: () => void;
};

// SetTimeout fires at once for a negative delay or one above the maximum,
// so those durations keep the toast like 0.
const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

// OnDismiss goes through an effect event, so a new inline function on each render does not restart the countdown.
function useIsDismissed({durationMs, onDismiss}: AutoDismissOptions): boolean {
	const [isDismissed, setIsDismissed] = useState(false);
	const notifyDismissed = useEffectEvent(() => {
		onDismiss?.();
	});

	useEffect(() => {
		const hasCountdown = durationMs > 0 && durationMs <= MAX_TIMER_DELAY_MS;
		if (isDismissed || !hasCountdown) {
			return undefined;
		}

		const timer = setTimeout(() => {
			setIsDismissed(true);
			notifyDismissed();
		}, durationMs);

		return () => {
			clearTimeout(timer);
		};
	}, [durationMs, isDismissed]);

	return isDismissed;
}

export function Toast({
	children,
	variant = 'info',
	durationMs = 3000,
	onDismiss,
}: ToastProps) {
	const {styles} = useComponentTheme<Theme>('Toast');
	const isDismissed = useIsDismissed({durationMs, onDismiss});

	if (isDismissed) {
		return null;
	}

	return (
		<Box {...styles.container()}>
			<StatusMessage variant={variant}>{children}</StatusMessage>
		</Box>
	);
}
