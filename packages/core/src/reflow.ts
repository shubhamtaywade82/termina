import {stripVTControlCharacters} from 'node:util';
import stringWidth from 'string-width';

const segmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});

/**
Rows one logical line occupies once a terminal has wrapped it at `columns`.

An empty line still takes one row. A line that exactly fills `columns` does not wrap: the terminal keeps the cursor in a pending-wrap state until the newline after it, so it takes one row too.
*/
export const rowsForLine = (line: string, columns: number): number => {
	if (!Number.isFinite(columns) || columns < 1 || stringWidth(line) <= columns) {
		return 1;
	}

	let rows = 1;
	let column = 0;
	for (const {segment} of segmenter.segment(stripVTControlCharacters(line))) {
		const width = stringWidth(segment);
		// A wide character that does not fit in the cells left on a row moves whole to the next row and leaves the last cell blank, so dividing the total width by `columns` would undercount.
		if (column > 0 && column + width > columns) {
			rows++;
			column = 0;
		}

		column += width;
	}

	return rows;
};

/**
Rows to erase, counted up from the cursor, for the frame `text` after the terminal has reflowed it to `columns`. The count includes the row the cursor is on.

Terminals reflow soft-wrapped rows when their width changes, before the resize event reaches Ink. A frame's line count is therefore only a lower bound on the rows it occupies, and erasing by line count leaves the wrapped remainder behind as a ghost copy.

`text` is the frame as it was written. When it ends with a newline, the cursor sits on the empty row below it. Otherwise it sits on the last physical row of the last line.
*/
export const rowsToErase = (text: string, columns: number): number => {
	if (text === '') {
		return 0;
	}

	const lines = text.split('\n');
	const endsWithNewline = text.endsWith('\n');
	const frameLines = endsWithNewline ? lines.slice(0, -1) : lines;

	let rows = 0;
	for (const line of frameLines) {
		rows += rowsForLine(line, columns);
	}

	return endsWithNewline ? rows + 1 : rows;
};
