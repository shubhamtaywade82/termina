// Converts the SGR (colour and style) sequences that chalk and Ink emit into styled HTML spans. Every text run is HTML-escaped, so the output is safe to insert with v-html. Cursor and other CSI sequences, and OSC sequences such as hyperlinks, are removed. The docs show the text a reader would see, not the control stream.

// The 16 basic colours follow the VS Code Dark+ terminal palette, which stays legible on the dark window. Blue is lifted from the usual xterm value, which is close to invisible on near-black backgrounds.
const basicPalette = [
	'#000000', '#cd3131', '#0dbc79', '#e5e510', '#3b8eea', '#bc3fbc', '#11a8cd', '#e5e5e5',
	'#666666', '#f14c4c', '#23d18b', '#f5f543', '#6cb6ff', '#d670d6', '#29b8db', '#ffffff',
];

const cubeLevels = [0, 95, 135, 175, 215, 255];

const hex = (red: number, green: number, blue: number): string =>
	'#' + [red, green, blue].map(value => value.toString(16).padStart(2, '0')).join('');

const palette256 = (index: number): string => {
	if (index < 16) {
		return basicPalette[index]!;
	}

	if (index < 232) {
		const offset = index - 16;
		return hex(
			cubeLevels[Math.floor(offset / 36)]!,
			cubeLevels[Math.floor((offset % 36) / 6)]!,
			cubeLevels[offset % 6]!,
		);
	}

	const level = 8 + (index - 232) * 10;
	return hex(level, level, level);
};

type Style = {
	fg?: string;
	bg?: string;
	bold: boolean;
	dim: boolean;
	italic: boolean;
	underline: boolean;
	inverse: boolean;
	strike: boolean;
};

const plainStyle = (): Style => ({
	bold: false,
	dim: false,
	italic: false,
	underline: false,
	inverse: false,
	strike: false,
});

// Applies one SGR parameter list to the running style. Extended colours consume their own parameters.
const applySgr = (style: Style, parameters: number[]): Style => {
	const next = {...style};
	for (let index = 0; index < parameters.length; index++) {
		const code = parameters[index]!;
		if (code === 0) {
			Object.assign(next, plainStyle(), {fg: undefined, bg: undefined});
		} else if (code === 1) {
			next.bold = true;
		} else if (code === 2) {
			next.dim = true;
		} else if (code === 3) {
			next.italic = true;
		} else if (code === 4) {
			next.underline = true;
		} else if (code === 7) {
			next.inverse = true;
		} else if (code === 9) {
			next.strike = true;
		} else if (code === 22) {
			next.bold = false;
			next.dim = false;
		} else if (code === 23) {
			next.italic = false;
		} else if (code === 24) {
			next.underline = false;
		} else if (code === 27) {
			next.inverse = false;
		} else if (code === 29) {
			next.strike = false;
		} else if (code >= 30 && code <= 37) {
			next.fg = basicPalette[code - 30];
		} else if (code === 39) {
			next.fg = undefined;
		} else if (code >= 40 && code <= 47) {
			next.bg = basicPalette[code - 40];
		} else if (code === 49) {
			next.bg = undefined;
		} else if (code >= 90 && code <= 97) {
			next.fg = basicPalette[code - 90 + 8];
		} else if (code >= 100 && code <= 107) {
			next.bg = basicPalette[code - 100 + 8];
		} else if (code === 38 || code === 48) {
			const color =
				parameters[index + 1] === 5
					? palette256(parameters[index + 2] ?? 0)
					: parameters[index + 1] === 2
						? hex(parameters[index + 2] ?? 0, parameters[index + 3] ?? 0, parameters[index + 4] ?? 0)
						: undefined;
			const consumed = parameters[index + 1] === 5 ? 2 : parameters[index + 1] === 2 ? 4 : 0;
			if (code === 38) {
				next.fg = color;
			} else {
				next.bg = color;
			}

			index += consumed;
		}
	}

	return next;
};

const escapeHtml = (text: string): string =>
	text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

const cssFor = (style: Style): string => {
	const color = style.inverse ? (style.bg ?? '#0b0f14') : style.fg;
	const background = style.inverse ? (style.fg ?? '#e5e5e5') : style.bg;
	const declarations: string[] = [];
	if (color) {
		declarations.push(`color:${color}`);
	}

	if (background) {
		declarations.push(`background-color:${background}`);
	}

	if (style.bold) {
		declarations.push('font-weight:bold');
	}

	if (style.dim) {
		declarations.push('opacity:0.6');
	}

	if (style.italic) {
		declarations.push('font-style:italic');
	}

	const decorations = [style.underline ? 'underline' : '', style.strike ? 'line-through' : ''].filter(Boolean);
	if (decorations.length > 0) {
		declarations.push(`text-decoration:${decorations.join(' ')}`);
	}

	return declarations.join(';');
};

// Matches SGR sequences (kept, they carry style), OSC sequences such as OSC 8 hyperlinks (dropped), and other CSI sequences such as cursor movement (dropped).
const controlPattern = /\u001B\[([0-9;]*)m|\u001B\][^\u0007\u001B]*(?:\u0007|\u001B\\)|\u001B\[[0-9;?]*[A-Za-z]/gu;

export type ConvertedAnsi = {
	readonly html: string;
	readonly text: string;
};

export const convertAnsi = (input: string): ConvertedAnsi => {
	let style = plainStyle();
	let html = '';
	let text = '';
	let lastIndex = 0;

	const emit = (run: string) => {
		if (run === '') {
			return;
		}

		text += run;
		const css = cssFor(style);
		html += css === '' ? escapeHtml(run) : `<span style="${css}">${escapeHtml(run)}</span>`;
	};

	for (const match of input.matchAll(controlPattern)) {
		emit(input.slice(lastIndex, match.index));
		lastIndex = match.index + match[0].length;
		if (match[1] !== undefined) {
			const parameters = match[1] === '' ? [0] : match[1].split(';').map(Number);
			style = applySgr(style, parameters);
		}
	}

	emit(input.slice(lastIndex));
	return {html, text};
};
