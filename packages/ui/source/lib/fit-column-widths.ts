/**
 * Column widths that fit a row of `available` columns separated by `gap` cells.
 *
 * Each column starts at its natural width. While the row is too wide, the widest column gives up one cell, so a short column keeps its width and a long one is the one that truncates. Every column keeps at least one cell, so a row can still be shrunk below its natural width when there is room for one cell per column. When the minimum does not fit, the result is still too wide and the caller's flex layout has to absorb the rest.
 *
 * An infinite `available` (a container that has not been measured yet) returns the natural widths.
 */
export const fitColumnWidths = (
	widths: readonly number[],
	gap: number,
	available: number,
): number[] => {
	const fitted = [...widths];
	const gapsWidth = gap * Math.max(widths.length - 1, 0);
	let excess =
		fitted.reduce((total, width) => total + width, 0) + gapsWidth - available;

	while (excess > 0) {
		let widest = -1;

		for (let index = 0; index < fitted.length; index++) {
			// A column at one cell cannot give up more, so it is never the widest candidate.
			if (
				fitted[index]! > 1 &&
				(widest === -1 || fitted[index]! > fitted[widest]!)
			) {
				widest = index;
			}
		}

		if (widest === -1) {
			break;
		}

		fitted[widest]! -= 1;
		excess -= 1;
	}

	return fitted;
};
