import React, {useState} from 'react';
import {
	Box,
	type DOMElement,
	Text,
	measureElement,
} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type ProgressBarProps = {
	/**
	 * Progress.
	 * Must be between 0 and 100.
	 *
	 * @default 0
	 */
	readonly value: number;
};

export function ProgressBar({value}: ProgressBarProps) {
	const [width, setWidth] = useState(0);

	// React passes null to a ref callback when the element unmounts, so the state holds null.
	// eslint-disable-next-line @typescript-eslint/no-restricted-types -- React passes null to ref callbacks.
	const [ref, setRef] = useState<DOMElement | null>(null);

	if (ref) {
		const dimensions = measureElement(ref);

		if (dimensions.width !== width) {
			setWidth(dimensions.width);
		}
	}

	const progress = Math.min(100, Math.max(0, value));
	const complete = Math.round((progress / 100) * width);
	const remaining = width - complete;

	const {styles, config} = useComponentTheme<Theme>('ProgressBar');

	return (
		<Box ref={setRef} {...styles.container()}>
			{complete > 0 && (
				<Text {...styles.completed()}>
					{config().completedCharacter.repeat(complete)}
				</Text>
			)}

			{remaining > 0 && (
				<Text {...styles.remaining()}>
					{config().remainingCharacter.repeat(remaining)}
				</Text>
			)}
		</Box>
	);
}
