import React from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type CodeBlockProps = {
	/**
	 * Code to show. Each line starts a new row.
	 */
	readonly code: string;

	/**
	 * Label shown on its own line above the code. It is not used for syntax highlighting.
	 */
	readonly language?: string;

	/**
	 * Show line numbers in a gutter, separated from the code by a vertical rule.
	 *
	 * @default true
	 */
	readonly showLineNumbers?: boolean;

	/**
	 * 1-based line numbers to show in the highlighted style. Numbers that match no line are ignored.
	 *
	 * @default []
	 */
	readonly highlightLines?: number[];
};

type CodeRowProps = {
	readonly lineNumber: number;
	readonly numberWidth: number;
	readonly line: string;
	readonly isHighlighted: boolean;
	readonly showLineNumbers: boolean;
};

function CodeRow({
	lineNumber,
	numberWidth,
	line,
	isHighlighted,
	showLineNumbers,
}: CodeRowProps) {
	const {styles} = useComponentTheme<Theme>('CodeBlock');
	// Ink measures an empty Text as zero rows, so a blank line needs a space to keep its row.
	const text = line.replaceAll('\t', '  ') || ' ';

	return (
		<Box>
			{showLineNumbers && (
				<Box {...styles.gutter()}>
					<Text {...styles.lineNumber({isHighlighted})}>
						{String(lineNumber).padStart(numberWidth)}
					</Text>
				</Box>
			)}
			<Text {...styles.code({isHighlighted})}>{text}</Text>
		</Box>
	);
}

export function CodeBlock({
	code,
	language,
	showLineNumbers = true,
	highlightLines = [],
}: CodeBlockProps) {
	const {styles} = useComponentTheme<Theme>('CodeBlock');
	const lines = code.split('\n');
	const numberWidth = String(lines.length).length;

	return (
		<Box {...styles.container()}>
			{language ? <Text {...styles.label()}>{language}</Text> : null}
			{lines.map((line, index) => (
				<CodeRow
					key={index}
					lineNumber={index + 1}
					numberWidth={numberWidth}
					line={line}
					isHighlighted={highlightLines.includes(index + 1)}
					showLineNumbers={showLineNumbers}
				/>
			))}
		</Box>
	);
}
