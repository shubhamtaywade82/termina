import stringWidth from 'string-width';
import {graphemes} from './grapheme.js';

// The UTF-16 offset at which each line starts. A value without a line feed has one line, and an empty value has one line that starts at 0.
export const lineStarts = (value: string): number[] => {
	const starts = [0];

	for (const {index} of value.matchAll(/\n/g)) {
		starts.push(index + 1);
	}

	return starts;
};

// The bounds of a row. `end` is the offset of the line feed that closes the row, or the length of the value on the last row.
export const lineRange = (
	value: string,
	row: number,
): {start: number; end: number} => {
	const starts = lineStarts(value);
	const target = Math.min(Math.max(row, 0), starts.length - 1);
	const start = starts[target]!;
	const end =
		target + 1 < starts.length ? starts[target + 1]! - 1 : value.length;

	return {start, end};
};

// Terminal cells of a run of text. Each grapheme is measured on its own, so a wide character counts two cells, a combining mark counts none, and a ZWJ sequence counts as one glyph.
const cellWidth = (text: string): number =>
	graphemes(text).reduce((width, {segment}) => width + stringWidth(segment), 0);

// The row and the display column of an offset. The column is in terminal cells from the start of the row. An offset outside the value is clamped to it.
export const positionOf = (
	value: string,
	offset: number,
): {row: number; column: number} => {
	const target = Math.min(Math.max(offset, 0), value.length);
	const starts = lineStarts(value);
	let row = 0;

	while (row + 1 < starts.length && starts[row + 1]! <= target) {
		row++;
	}

	return {
		row,
		column: cellWidth(value.slice(starts[row], target)),
	};
};

// The offset on a row nearest to the goal column without passing it: the last grapheme boundary whose column is at most the goal. A row past either end is clamped to the nearest row, and a goal past the end of the row gives the row's end.
export const offsetAtRowColumn = (
	value: string,
	row: number,
	goalColumn: number,
): number => {
	const {start, end} = lineRange(value, row);
	let offset = start;
	let column = 0;

	for (const {index, segment} of graphemes(value.slice(start, end))) {
		const next = column + stringWidth(segment);
		if (next > goalColumn) {
			break;
		}

		column = next;
		offset = start + index + segment.length;
	}

	return offset;
};
