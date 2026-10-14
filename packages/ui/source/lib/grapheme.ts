const segmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});

// A single-line value has no cell for a control character. Ink delivers a multi-character paste as one string, so a pasted newline would otherwise be stored in the value.
const controlCharacters = /\p{Control}/gu;

export const sanitizeInsertedText = (text: string): string =>
	text.replaceAll(controlCharacters, '');

// Editing by UTF-16 code unit splits surrogate pairs and detaches combining marks from their base letter. Cursor offsets stay plain string indices, but they only ever land on these boundaries.
export const previousBoundary = (value: string, offset: number): number => {
	let boundary = 0;
	for (const {index} of segmenter.segment(value)) {
		if (index >= offset) {
			break;
		}

		boundary = index;
	}

	return boundary;
};

export const nextBoundary = (value: string, offset: number): number => {
	for (const {index, segment} of segmenter.segment(value)) {
		const end = index + segment.length;
		if (end > offset) {
			return end;
		}
	}

	return value.length;
};

// Highlighting by code point splits an emoji or a letter with a combining mark, so the cursor is drawn over whole grapheme clusters.
export const splitFirstGrapheme = (text: string): [string, string] => {
	const first = segmenter.segment(text)[Symbol.iterator]().next().value;
	if (first === undefined) {
		return ['', ''];
	}

	return [first.segment, text.slice(first.segment.length)];
};

export const graphemes = (text: string): Array<{index: number; segment: string}> =>
	[...segmenter.segment(text)].map(({index, segment}) => ({index, segment}));

// Snaps an offset that a value changed under onto the nearest boundary at or before it. An offset inside a cluster moves to the cluster's start, and an offset past the end moves to the end.
export const clampToBoundary = (value: string, offset: number): number => {
	if (offset >= value.length) {
		return value.length;
	}

	let boundary = 0;
	for (const {index} of segmenter.segment(value)) {
		if (index > offset) {
			break;
		}

		boundary = index;
	}

	return boundary;
};
