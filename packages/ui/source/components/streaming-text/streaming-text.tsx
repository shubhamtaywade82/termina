import React from 'react';
import {Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

const CURSOR_GLYPH = '▋';

export type StreamingTextProps = {
	/**
	 * All text received so far. The parent appends each chunk and passes the whole string.
	 */
	readonly text: string;

	/**
	 * While true, a cursor follows the text. Set it to false when the stream ends.
	 *
	 * @default true
	 */
	readonly isStreaming?: boolean;
};

export function StreamingText({text, isStreaming = true}: StreamingTextProps) {
	const {styles} = useComponentTheme<Theme>('StreamingText');

	return (
		<Text {...styles.text()}>
			{text}
			{isStreaming && <Text {...styles.cursor()}>{CURSOR_GLYPH}</Text>}
		</Text>
	);
}
