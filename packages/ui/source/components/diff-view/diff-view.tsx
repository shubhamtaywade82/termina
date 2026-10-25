/* eslint-disable @eslint-react/no-array-index-key -- Lines can repeat, such as blank context lines, so the position is the key. */
import React from 'react';
import {Box, Text, type TextProps} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type DiffViewProps = {
	/**
	 * Unified diff, as `git diff` prints it. An empty string renders nothing.
	 */
	readonly patch: string;
};

const fileHeaderPrefixes = ['diff', 'index', '---', '+++'];

const splitPatchLines = (patch: string): string[] =>
	// Git ends the patch with a newline, which would otherwise leave an empty row after the last line.
	patch === '' ? [] : patch.replace(/\n$/, '').split('\n');

const styleForLine = (line: string, styles: Theme['styles']): TextProps => {
	if (fileHeaderPrefixes.some((prefix) => line.startsWith(prefix))) {
		return styles.header();
	}

	if (line.startsWith('@@')) {
		return styles.hunk();
	}

	if (line.startsWith('+')) {
		return styles.added();
	}

	return line.startsWith('-') ? styles.removed() : styles.context();
};

export function DiffView({patch}: DiffViewProps) {
	const {styles} = useComponentTheme<Theme>('DiffView');
	const lines = splitPatchLines(patch);

	if (lines.length === 0) {
		return null;
	}

	return (
		<Box {...styles.container()}>
			{/* Lines can repeat, such as blank context lines, so the position is the key. */}
			{lines.map((line, index) => (
				<Text key={index} {...styleForLine(line, styles)}>
					{/* Ink drops a Text with no characters, which would collapse a blank line. */}
					{line === '' ? ' ' : line}
				</Text>
			))}
		</Box>
	);
}
