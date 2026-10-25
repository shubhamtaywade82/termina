import process from 'node:process';

// Terminals commonly cap an OSC 52 payload at about 75 KB of base64. A larger copy is rejected here, because the terminal would otherwise truncate it silently.
const maxBase64Length = 74_000;

// Encodes UTF-8 with web-standard globals. `node:buffer` cannot be bundled for the browser, and the docs site bundles this module.
const toBase64Utf8 = (text: string): string => {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCodePoint(byte);
	}

	// eslint-disable-next-line no-restricted-globals -- btoa is the base64 encoder that both the browser bundle and Node provide. The payload is capped at 74 KB, and the xo suggestion is a dependency.
	return btoa(binary);
};

/**
Builds an OSC 52 sequence that asks the terminal to place `text` on the system clipboard. It works over SSH without pbcopy, xclip or wl-copy, and only where the terminal allows clipboard writes.
*/
export const clipboardSequence = (text: string): string => {
	const payload = toBase64Utf8(text);
	if (payload.length > maxBase64Length) {
		throw new RangeError(
			`clipboard payload is ${payload.length} base64 characters; the limit is ${maxBase64Length}`,
		);
	}

	return `\u{1B}]52;c;${payload}\u{7}`;
};

/**
Writes the OSC 52 sequence to `stream`. The sequence moves no cursor and draws nothing, so it is safe to write while Ink owns the screen. Returns `false` without writing when the stream is not a TTY.
*/
// `copyToClipboard` is public API, and its name describes the action rather than a boolean.
// eslint-disable-next-line unicorn/consistent-boolean-name -- The exported name is public API.
export const copyToClipboard = (
	text: string,
	stream: {isTTY?: boolean; write: (data: string) => unknown} = process.stdout,
): boolean => {
	if (!stream.isTTY) {
		return false;
	}

	stream.write(clipboardSequence(text));
	return true;
};
