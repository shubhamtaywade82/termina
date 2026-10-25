/* eslint-disable @typescript-eslint/no-restricted-types -- `object` covers arrays and functions, which `Record<string, unknown>` would reject. */
/* eslint-disable @typescript-eslint/naming-convention -- JSONViewer is the exported component name, and its props type follows it. */
/* eslint-disable @eslint-react/no-array-index-key -- A JSON line and its tokens are positional, and the same text can repeat. */
import React from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type JSONViewerProps = {
	/**
	 * Value to print. Any JavaScript value works, including ones JSON cannot represent.
	 */
	readonly data: unknown;

	/**
	 * Objects and arrays nested deeper than this print as `...`. The root value is at depth 0.
	 *
	 * @default 8
	 */
	readonly maxDepth?: number;
};

type TokenStyle = keyof Theme['styles'];

type Token = {
	readonly text: string;
	readonly style?: TokenStyle;
};

type Line = readonly Token[];

type Entry = {
	readonly key?: string;
	readonly child: unknown;
};

type FormatOptions = {
	readonly maxDepth: number;
	readonly ancestors: ReadonlySet<object>;
};

const punctuation = (text: string): Token => ({text, style: 'punctuation'});

function formatScalar(value: unknown): Token {
	switch (typeof value) {
		case 'string': {
			// JSON escaping keeps a newline inside a string from breaking the line.
			return {text: JSON.stringify(value), style: 'string'};
		}

		case 'number': {
			return {text: String(value), style: 'number'};
		}

		case 'bigint': {
			return {text: `${value}n`, style: 'number'};
		}

		case 'boolean': {
			return {text: String(value), style: 'boolean'};
		}

		case 'function': {
			return punctuation(
				`[Function ${value.name === '' ? '(anonymous)' : value.name}]`,
			);
		}

		case 'symbol': {
			// Template literals throw on symbols, so String() is the safe conversion.
			return punctuation(String(value));
		}

		case 'undefined': {
			return {text: 'undefined', style: 'null'};
		}

		case 'object': {
			// FormatValue sends every object except null to formatContainer, so only null reaches this case.
			return {text: 'null', style: 'null'};
		}
	}
}

function formatValue(
	value: unknown,
	depth: number,
	options: FormatOptions,
	indent: string,
): Line[] {
	if (typeof value !== 'object' || value === null) {
		return [[formatScalar(value)]];
	}

	// Checked before depth so a cycle is shown even where the depth limit would hide it.
	if (options.ancestors.has(value)) {
		return [[punctuation('[Circular]')]];
	}

	return depth > options.maxDepth
		? [[punctuation('...')]]
		: formatContainer(value, depth, options, indent);
}

function listEntries(value: object): Entry[] {
	return Array.isArray(value)
		? [...(value as readonly unknown[])].map((child) => ({child}))
		: Object.entries(value as Record<string, unknown>).map(([key, child]) => ({
				key,
				child,
			}));
}

function decorateEntry(
	lines: readonly Line[],
	key: string | undefined,
	indent: string,
	hasComma: boolean,
): Line[] {
	const keyTokens: Token[] =
		key === undefined
			? []
			: [{text: JSON.stringify(key), style: 'key'}, punctuation(': ')];

	return lines.map((line, lineIndex) => {
		const isFirstLine = lineIndex === 0;
		const isLastLine = lineIndex === lines.length - 1;
		return [
			...(isFirstLine ? [{text: indent}, ...keyTokens] : []),
			...line,
			...(isLastLine && hasComma ? [punctuation(',')] : []),
		];
	});
}

function formatEntries(
	entries: Entry[],
	depth: number,
	options: FormatOptions,
	indent: string,
): Line[] {
	const childIndent = `${indent}  `;
	return entries.flatMap((entry, index) =>
		decorateEntry(
			formatValue(entry.child, depth + 1, options, childIndent),
			entry.key,
			childIndent,
			index < entries.length - 1,
		),
	);
}

function formatContainer(
	value: object,
	depth: number,
	options: FormatOptions,
	indent: string,
): Line[] {
	const isArray = Array.isArray(value);
	const open = isArray ? '[' : '{';
	const close = isArray ? ']' : '}';
	const entries = listEntries(value);

	if (entries.length === 0) {
		return [[punctuation(`${open}${close}`)]];
	}

	// Only ancestors count as cycles, so an object that is referenced twice
	// but is not in a cycle prints in full both times.
	const childOptions: FormatOptions = {
		...options,
		ancestors: new Set([...options.ancestors, value]),
	};
	return [
		[punctuation(open)],
		...formatEntries(entries, depth, childOptions, indent),
		[{text: indent}, punctuation(close)],
	];
}

export function JSONViewer({data, maxDepth = 8}: JSONViewerProps) {
	const {styles} = useComponentTheme<Theme>('JSONViewer');
	const lines = formatValue(
		data,
		0,
		{maxDepth, ancestors: new Set<object>()},
		'',
	);

	return (
		<Box flexDirection="column">
			{lines.map((line, lineIndex) => (
				<Text key={lineIndex}>
					{line.map((token, tokenIndex) => (
						<Text
							key={tokenIndex}
							{...(token.style === undefined ? {} : styles[token.style]())}
						>
							{token.text}
						</Text>
					))}
				</Text>
			))}
		</Box>
	);
}
