/**
The shape of the terminal cursor. The steady shapes do not blink. `default` restores the terminal's own setting.
*/
export type CursorShape = 'default' | 'block' | 'bar' | 'underline';

// DECSCUSR parameters (CSI Ps SP q). Parameter 0 selects the terminal's default shape, so it hands the cursor back to the user's own setting.
const cursorShapeParameters: Record<CursorShape, number> = {
	default: 0,
	block: 2,
	underline: 4,
	bar: 6,
};

/**
The escape sequence that sets the terminal cursor to `shape`.
*/
export const cursorShapeSequence = (shape: CursorShape): string =>
	`\u{1B}[${cursorShapeParameters[shape]} q`;
