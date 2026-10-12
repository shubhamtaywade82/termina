import React, {useEffect, useEffectEvent, useState} from 'react';
import {Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type TypewriterProps = {
	/**
	 * Text to reveal. Changing it restarts the reveal from the first character.
	 */
	readonly text: string;

	/**
	 * Characters revealed per second.
	 *
	 * @default 30
	 */
	readonly speed?: number;

	/**
	 * Show a block cursor after the revealed text while it is still typing.
	 *
	 * @default true
	 */
	readonly cursor?: boolean;

	/**
	 * Called once when the whole text is shown.
	 */
	readonly onComplete?: () => void;
};

const CURSOR_GLYPH = '▋';

type Reveal = {
	readonly text: string;
	readonly revealedCount: number;
};

type RevealOptions = {
	readonly text: string;
	readonly characterCount: number;
	readonly speed: number;
};

type CompletionOptions = {
	readonly isComplete: boolean;
	readonly text: string;
	readonly onComplete?: () => void;
};

// The reset runs during render, so the frame for a new text never shows the previous reveal.
function useRevealedCount({text, characterCount, speed}: RevealOptions): number {
	const [reveal, setReveal] = useState<Reveal>({text, revealedCount: 0});

	if (reveal.text !== text) {
		setReveal({text, revealedCount: 0});
	}

	const isComplete = reveal.revealedCount >= characterCount;

	useEffect(() => {
		// Node warns on a zero, negative or NaN delay and then runs it at 1 ms, so such a speed starts no timer.
		if (isComplete || !(speed > 0)) {
			return undefined;
		}

		// Keyed on text so a new text waits a full interval before its first character.
		// ponytail: setInterval truncates to whole milliseconds, so 60 per second runs at about 62. Exact pacing needs a clock-based scheduler.
		const timer = setInterval(() => {
			setReveal(current => ({...current, revealedCount: current.revealedCount + 1}));
		}, 1000 / speed);

		return () => {
			clearInterval(timer);
		};
	}, [isComplete, speed, text]);

	return reveal.revealedCount;
}

function useNotifyOnComplete({isComplete, text, onComplete}: CompletionOptions): void {
	// The effect event keeps onComplete out of the dependencies, so a new inline function does not notify again.
	const notifyComplete = useEffectEvent(() => {
		onComplete?.();
	});

	// text is a dependency so empty text, which is complete at once, still notifies for each new text.
	useEffect(() => {
		if (isComplete) {
			notifyComplete();
		}
	}, [isComplete, text]);
}

export function Typewriter({text, speed = 30, cursor = true, onComplete}: TypewriterProps) {
	const {styles} = useComponentTheme<Theme>('Typewriter');
	const characters = Array.from(text);
	const revealedCount = useRevealedCount({text, characterCount: characters.length, speed});
	const isComplete = revealedCount >= characters.length;
	useNotifyOnComplete({isComplete, text, onComplete});

	return (
		<Text {...styles.text()}>
			{characters.slice(0, revealedCount).join('')}
			{cursor && !isComplete && <Text {...styles.cursor()}>{CURSOR_GLYPH}</Text>}
		</Text>
	);
}
