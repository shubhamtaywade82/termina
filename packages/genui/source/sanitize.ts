/* eslint-disable no-control-regex, regexp/no-control-character, regexp/no-obscure-range -- Removing terminal control sequences means matching the control characters themselves. The ranges are the ECMA-48 byte classes named in each comment. */
// Strip OSC (Operating System Command) sequences terminated by BEL (\u{7}) or ST (\u{1B}\\)
const OSC_REGEX = /\u{1B}\][^\u{7}\u{1B}]*(?:\u{7}|\u{1B}\\)/gu;

// Strip CSI (Control Sequence Introducer) escapes like cursor moves, clears, color codes
const CSI_REGEX = /\u{1B}\[[0-?]*[ -/]*[@-~]/gu;

// Strip raw control characters except tab (\t), newline (\n), carriage return (\r). C1 (U+0080-U+009F) included: U+009B is a one-byte CSI on terminals that honor 8-bit controls.
const CONTROL_CHAR_REGEX = /[\u{0}-\u{8}\v\f\u{E}-\u{1F}\u{7F}-\u{9F}]/gu;

export const DEFAULT_MAX_TEXT_LENGTH = 10_000;

export function sanitizeText(
	text: string,
	maxLength = DEFAULT_MAX_TEXT_LENGTH,
): string {
	if (text === '') {
		return '';
	}

	// Remove dangerous sequences before measuring length
	const cleaned = text
		.replaceAll(OSC_REGEX, '')
		.replaceAll(CSI_REGEX, '')
		.replaceAll(CONTROL_CHAR_REGEX, '');

	if (cleaned.length <= maxLength) {
		return cleaned;
	}

	// Truncate by Unicode code points to avoid splitting surrogate pairs
	const characters = [...cleaned];
	let result = '';

	for (const char of characters) {
		if (result.length + char.length > maxLength) {
			break;
		}

		result += char;
	}

	return result;
}
