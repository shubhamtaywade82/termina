// Any C0, DEL or C1 control character would end the OSC early or start a new sequence, so a URL containing one is rejected rather than escaped.
const controlCharacters = /\p{Control}/u;

/**
Wraps `label` in an OSC 8 hyperlink. Terminals that support it render the label as a clickable link. Terminals that do not show the label unchanged, so the wrapper degrades safely.

The label may carry SGR styling. Its visible width is what layout measures, because OSC 8 is zero-width.
*/
export const hyperlink = (url: string, label: string): string => {
	if (url === '' || controlCharacters.test(url)) {
		throw new RangeError(
			'hyperlink URL must be non-empty and contain no control characters',
		);
	}

	return `\u{1B}]8;;${url}\u{1B}\\${label}\u{1B}]8;;\u{1B}\\`;
};
