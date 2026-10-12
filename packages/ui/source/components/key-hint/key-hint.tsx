import React from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type KeyHintProps = {
	/**
	 * Key label, such as `Ctrl+C`. Shown exactly as given.
	 */
	readonly keys: string;

	/**
	 * What the key does, such as `quit`. Shown dim after the key label.
	 */
	readonly label: string;
};

/**
 * Renders a key label in inverse text, then its action label in dim text.
 */
export function KeyHint({keys, label}: KeyHintProps) {
	const {styles} = useComponentTheme<Theme>('KeyHint');

	// Box padding would sit outside the inverse block, so the padding is spaces inside the text.
	return (
		<Box {...styles.container()}>
			<Text {...styles.key()}>{` ${keys} `}</Text>
			<Text {...styles.label()}>{label}</Text>
		</Box>
	);
}
