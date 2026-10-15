// Strip OSC (Operating System Command) sequences terminated by BEL (\u0007) or ST (\u001B\\)
const OSC_REGEX = /\u001B\][^\u0007\u001B]*(?:\u0007|\u001B\\)/g;

// Strip CSI (Control Sequence Introducer) escapes like cursor moves, clears, color codes
const CSI_REGEX = /\u001B\[[0-?]*[ -/]*[@-~]/g;

// Strip raw control characters except tab (\t), newline (\n), carriage return (\r)
const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const DEFAULT_MAX_TEXT_LENGTH = 10_000;

export function sanitizeText(text: string, maxLength = DEFAULT_MAX_TEXT_LENGTH): string {
	if (!text) return '';

	// Remove dangerous sequences before measuring length
	const cleaned = text
		.replace(OSC_REGEX, '')
		.replace(CSI_REGEX, '')
		.replace(CONTROL_CHAR_REGEX, '');

	if (cleaned.length <= maxLength) {
		return cleaned;
	}

	// Truncate by Unicode code points to avoid splitting surrogate pairs
	const characters = Array.from(cleaned);
	let result = '';

	for (const char of characters) {
		if (result.length + char.length > maxLength) {
			break;
		}
		result += char;
	}

	return result;
}
