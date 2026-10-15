const lineFeed = 0x0a;
const delCode = 0x7f;
const firstPrintable = 0x20;

// Line endings become line feeds, a tab becomes four spaces, and the other C0 control characters and DEL are removed. The escape that starts a terminal sequence is one of them, so the rest of the sequence stays as plain text. Printable text is kept as it is.
export const sanitizeMultiline = (text: string): string => {
	const normalized = text
		.replaceAll('\r\n', '\n')
		.replaceAll('\r', '\n')
		.replaceAll('\t', ' '.repeat(4));

	return [...normalized]
		.filter((character) => {
			const code = character.codePointAt(0) ?? 0;
			return code === lineFeed || (code >= firstPrintable && code !== delCode);
		})
		.join('');
};
