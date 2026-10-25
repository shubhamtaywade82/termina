/* eslint-disable no-bitwise -- SGR mouse codes are bit fields: button, modifiers, motion and wheel. */
// SGR (DECSET 1006) mouse protocol. 1000 reports presses and releases, 1002 adds drags, and 1006 encodes each report as decimal parameters, so windows wider than 223 columns do not overflow the legacy single-byte coordinates.
export const mouseTrackingEnable = '\u{1B}[?1000h\u{1B}[?1002h\u{1B}[?1006h';
export const mouseTrackingDisable = '\u{1B}[?1006l\u{1B}[?1002l\u{1B}[?1000l';

export type MouseButton =
	| 'left'
	| 'middle'
	| 'right'
	| 'none'
	| 'wheelUp'
	| 'wheelDown'
	| 'wheelLeft'
	| 'wheelRight';

export type MouseAction = 'press' | 'release' | 'drag' | 'move' | 'wheel';

export type MouseEvent = {
	readonly action: MouseAction;
	readonly button: MouseButton;
	// 1-based terminal cell, as the terminal reports it.
	readonly x: number;
	readonly y: number;
	readonly shift: boolean;
	readonly meta: boolean;
	readonly ctrl: boolean;
};

// `ESC [ < Cb ; Cx ; Cy (M|m)`. Cb packs the button in bits 0-1, shift (4), meta (8), ctrl (16), motion (32) and wheel (64).
const sgrMousePattern =
	// eslint-disable-next-line no-control-regex, regexp/no-control-character -- ESC opens every SGR mouse report.
	/^\u{1B}\[<(?<code>\d+);(?<x>\d+);(?<y>\d+)(?<kind>m)$/iu;
const buttons = ['left', 'middle', 'right'] as const;
const wheelButtons = [
	'wheelUp',
	'wheelDown',
	'wheelLeft',
	'wheelRight',
] as const;

/**
Parses one complete SGR mouse report. Returns `undefined` for anything else, including malformed reports with a zero coordinate, which terminals never send because coordinates are 1-based.
*/
export const parseMouseEvent = (sequence: string): MouseEvent | undefined => {
	const match = sgrMousePattern.exec(sequence);
	if (!match) {
		return undefined;
	}

	const code = Number(match.groups?.['code']);
	const x = Number(match.groups?.['x']);
	const y = Number(match.groups?.['y']);
	if (x < 1 || y < 1) {
		return undefined;
	}

	// Bit 128 marks the extra buttons (back, forward). They have no MouseButton, so they are ignored rather than decoded as the left button.
	if ((code & 128) !== 0) {
		return undefined;
	}

	const modifiers = {
		shift: (code & 4) !== 0,
		meta: (code & 8) !== 0,
		ctrl: (code & 16) !== 0,
	};

	if ((code & 64) !== 0) {
		return {
			action: 'wheel',
			button: wheelButtons[code & 3]!,
			x,
			y,
			...modifiers,
		};
	}

	const button = (code & 3) === 3 ? 'none' : buttons[code & 3]!;
	if ((code & 32) !== 0) {
		return {
			action: button === 'none' ? 'move' : 'drag',
			button,
			x,
			y,
			...modifiers,
		};
	}

	return {
		action: match.groups?.['kind'] === 'm' ? 'release' : 'press',
		button,
		x,
		y,
		...modifiers,
	};
};
