// Cursor travel in one write, in rows, for viewport bound checks. Movement is not clamped, because emulators clamp at the top and the requested travel is what must stay inside the viewport.
//
// Counted: CSI n A (up), CSI n B (down), and newline (down one row). eraseLines(n) is CSI 2K followed by CSI 1A repeated, so it is covered by the same rule. A CSI count of 0 or no count means 1, as in terminals.

const ESCAPE = 27;
const CSI_FINAL_BYTE_START = 0x40;

// The first parameter of a CSI sequence, as a row count.
const firstParameter = (parameters: string): number => {
	const first = parameters.split(';', 1)[0] ?? '';
	const value = first === '' ? 1 : Number(first);
	return value === 0 || Number.isNaN(value) ? 1 : value;
};

// Returns the largest upward distance the cursor reaches below `startRow`, where 0 is the top visible row.
export const largestUpwardTravel = (data: string, startRow: number): number => {
	let row = startRow;
	let highest = startRow;
	let index = 0;
	while (index < data.length) {
		if (data.codePointAt(index) === ESCAPE && data.charAt(index + 1) === '[') {
			// Parameter and intermediate bytes come before the final byte.
			let end = index + 2;
			while (
				end < data.length &&
				(data.codePointAt(end) ?? Infinity) < CSI_FINAL_BYTE_START
			) {
				end += 1;
			}

			const count = firstParameter(data.slice(index + 2, end));
			const finalByte = data.charAt(end);
			if (finalByte === 'A') {
				row -= count;
			} else if (finalByte === 'B') {
				row += count;
			}

			highest = Math.min(highest, row);
			index = end + 1;
			continue;
		}

		if (data.charAt(index) === '\n') {
			row += 1;
		}

		index += 1;
	}

	return startRow - highest;
};
