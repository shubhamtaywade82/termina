import React, {useRef} from 'react';
import stringWidth from 'string-width';
import {
	Box,
	Text,
	useBoxMetrics,
	type DOMElement,
} from '@nemesis-oss/termina-core';
import {graphemes} from '../../lib/grapheme.js';
import {viewportTop} from '../../lib/multiline-edit-reducer.js';
import {lineRange, lineStarts, positionOf} from '../../lib/text-lines.js';
import {useComponentTheme} from '../../theme.js';
import {useMultilineTextInput} from './use-multiline-text-input.js';
import {useMultilineTextInputState} from './use-multiline-text-input-state.js';
import defaultTheme, {type Theme} from './theme.js';

export type MultilineTextInputProps = {
	/**
	 * When disabled, user input and paste are ignored.
	 *
	 * @default false
	 */
	readonly isDisabled?: boolean;

	/**
	 * Text to display when input is empty.
	 */
	readonly placeholder?: string;

	/**
	 * Default input value.
	 */
	readonly defaultValue?: string;

	/**
	 * Controlled input value. When set, the parent owns the value: each edit is reported through `onChange`, and the input shows this value until the parent changes it. `defaultValue` is ignored. An input with `value` and no `onChange` is read-only.
	 */
	readonly value?: string;

	/**
	 * Callback when input value changes.
	 */
	readonly onChange?: (value: string) => void;

	/**
	 * Callback when Ctrl+D is pressed. First argument is input value.
	 */
	readonly onSubmit?: (value: string) => void;

	/**
	 * Number of rows the editor shows. The value scrolls vertically to keep the caret visible.
	 *
	 * @default 5
	 */
	readonly rows?: number;
};

type Piece = {
	kind: 'text' | 'cursor' | 'placeholder';
	// Cells from the left edge of the window. Unique within a row, so it can serve as a key.
	column: number;
	text: string;
};

// The cells of one line inside the window, which starts at `offsetX` and is `width` cells wide. The caret is the grapheme at `caret`, or a space after the last grapheme. A wide character cut by an edge is drawn as spaces, so a row never wraps.
const windowPieces = (
	line: string,
	caret: number | undefined,
	offsetX: number,
	width: number,
): Piece[] => {
	const end = offsetX + width;
	const pieces: Piece[] = [];
	let column = 0;

	for (const {index, segment} of graphemes(line)) {
		const start = column;
		column += stringWidth(segment);

		if (column <= offsetX) {
			continue;
		}

		if (start >= end) {
			break;
		}

		const isWhole = start >= offsetX && column <= end;
		const text = isWhole
			? segment
			: ' '.repeat(Math.min(column, end) - Math.max(start, offsetX));

		if (text !== '') {
			pieces.push({
				kind: index === caret ? 'cursor' : 'text',
				column: Math.max(start, offsetX) - offsetX,
				text,
			});
		}
	}

	if (caret === line.length) {
		pieces.push({kind: 'cursor', column: column - offsetX, text: ' '});
	}

	return pieces;
};

// The placeholder is drawn like an empty line: the first cell is the caret when the editor is enabled, and the rest is the placeholder style.
const placeholderPieces = (
	placeholder: string,
	isDisabled: boolean,
	width: number,
): Piece[] =>
	windowPieces(placeholder, isDisabled ? undefined : 0, 0, width).map(
		(piece) =>
			piece.kind === 'text' ? {...piece, kind: 'placeholder' as const} : piece,
	);

// The window starts so that the caret cell is the last one shown, and never before the first cell. Before the first layout the width is 0, and the window stays at the start.
const horizontalOffset = (column: number, width: number): number =>
	width > 0 ? Math.max(0, column - (width - 1)) : 0;

export function MultilineTextInput({
	isDisabled = false,
	defaultValue,
	value,
	placeholder = '',
	onChange,
	onSubmit,
	rows = 5,
}: MultilineTextInputProps) {
	const ref = useRef<DOMElement>(null);
	const {clientWidth} = useBoxMetrics(ref);
	const height = Math.max(1, rows);

	const state = useMultilineTextInputState({
		defaultValue,
		value,
		onChange,
		onSubmit,
	});

	useMultilineTextInput({
		isDisabled,
		rows: height,
		state,
	});

	// A theme provider may not list this component. The styles of this module apply then.
	const registered: Theme | undefined =
		useComponentTheme<Theme>('MultilineTextInput');
	const {styles} = registered ?? defaultTheme;

	const {row, column} = positionOf(state.value, state.cursorOffset);
	const lineCount = lineStarts(state.value).length;
	const top = viewportTop(state.top, row, height, lineCount);
	const offsetX = horizontalOffset(column, clientWidth);
	const windowWidth = clientWidth > 0 ? clientWidth : Infinity;

	const piecesOf = (index: number): Piece[] => {
		if (state.value === '') {
			return index === 0
				? placeholderPieces(placeholder, isDisabled, windowWidth)
				: [];
		}

		if (index >= lineCount) {
			return [];
		}

		const {start, end} = lineRange(state.value, index);
		const caret =
			!isDisabled && index === row ? state.cursorOffset - start : undefined;

		return windowPieces(
			state.value.slice(start, end),
			caret,
			offsetX,
			windowWidth,
		);
	};

	// A row with nothing in it still takes a line. An empty Text collapses to no height, which would shrink the editor below `rows`.
	const renderRow = (index: number) => {
		const pieces = piecesOf(index);

		return (
			<Text key={index} {...styles.value()}>
				{pieces.length === 0
					? ' '
					: pieces.map((piece) =>
							piece.kind === 'text' ? (
								piece.text
							) : (
								<Text
									key={piece.column}
									{...(piece.kind === 'cursor'
										? styles.cursor()
										: styles.placeholder())}
								>
									{piece.text}
								</Text>
							),
						)}
			</Text>
		);
	};

	return (
		<Box ref={ref} flexDirection="column">
			{Array.from({length: height}, (_, offset) => renderRow(top + offset))}
		</Box>
	);
}
