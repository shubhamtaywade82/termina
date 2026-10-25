export type MarkdownInlineSpan = {
	readonly kind: 'bold' | 'code' | 'italic' | 'link' | 'text';
	readonly value: string;
	readonly url?: string;
};

export type MarkdownListItem = {
	readonly depth: number;
	readonly ordinal?: string;
	readonly spans: MarkdownInlineSpan[];
};

export type MarkdownBlock =
	| {readonly kind: 'code'; readonly text: string}
	| {
			readonly kind: 'heading';
			readonly level: number;
			readonly spans: MarkdownInlineSpan[];
	  }
	| {readonly kind: 'list'; readonly items: MarkdownListItem[]}
	| {readonly kind: 'paragraph'; readonly spans: MarkdownInlineSpan[]}
	| {readonly kind: 'quote'; readonly spans: MarkdownInlineSpan[]};

type ReadResult = {
	readonly block?: MarkdownBlock;
	readonly next: number;
};

export const NESTED_INDENT_WIDTH = 2;

const headingPattern = /^(?<hashes>#{1,3}) (?<text>.+)$/;
// eslint-disable-next-line regexp/no-super-linear-backtracking -- The greedy spaces match once, and `(?<text>.*)$` always matches the rest of the line, so the engine never backtracks.
const listPattern = /^(?<indent> *)(?<marker>[*-]|\d+\.) +(?<text>.*)$/;
const fenceOpenPattern = /^\s*```/;
const fenceClosePattern = /^\s*```\s*$/;

// Emphasis markers must not touch whitespace, and `_` must not sit inside a word, so `2 * 3 * 4`
// and `snake_case_name` stay literal. Each alternative consumes its whole span, so code and link
// URLs are never scanned again for emphasis.
const inlinePattern =
	// eslint-disable-next-line regexp/no-super-linear-move -- Each alternative consumes its whole span, so no alternative rescans text another one has consumed.
	/`(?<code>[^`]+)`|\*\*(?!\s)(?<bold>[^*]*[^\s*])\*\*|(?<![\p{Letter}\p{Number}])_(?!\s)(?<underscoreItalic>[^_]*[^\s_])_(?![\p{Letter}\p{Number}])|\*(?!\s)(?<italic>[^*]*[^\s*])\*|(?<!!)\[(?<linkText>[^\]]+)\]\((?<url>[^\s)]+)\)/gu;

const isBlank = (line: string): boolean => line.trim() === '';

const isBlockStart = (line: string): boolean =>
	fenceOpenPattern.test(line) ||
	headingPattern.test(line) ||
	listPattern.test(line) ||
	line.startsWith('>');

const endOfRun = (
	lines: string[],
	start: number,
	isInRun: (line: string) => boolean,
): number => {
	let end = start;

	while (end < lines.length && isInRun(lines[end] ?? '')) {
		end++;
	}

	return end;
};

const toInlineSpan = (
	groups: Record<string, string | undefined>,
): MarkdownInlineSpan => {
	const {code, bold, italic, underscoreItalic, linkText, url} = groups;

	if (code !== undefined) {
		return {kind: 'code', value: code};
	}

	if (bold !== undefined) {
		return {kind: 'bold', value: bold};
	}

	const emphasis = italic ?? underscoreItalic;

	return emphasis === undefined
		? {kind: 'link', value: linkText ?? '', url: url ?? ''}
		: {kind: 'italic', value: emphasis};
};

const parseInline = (text: string): MarkdownInlineSpan[] => {
	const spans: MarkdownInlineSpan[] = [];
	let cursor = 0;

	for (const match of text.matchAll(inlinePattern)) {
		const start = match.index ?? 0;

		if (start > cursor) {
			spans.push({kind: 'text', value: text.slice(cursor, start)});
		}

		spans.push(toInlineSpan(match.groups ?? {}));
		cursor = start + (match[0] ?? '').length;
	}

	if (cursor < text.length) {
		spans.push({kind: 'text', value: text.slice(cursor)});
	}

	return spans;
};

const parseListItem = (line: string): MarkdownListItem => {
	const {
		indent = '',
		marker = '',
		text = '',
	} = listPattern.exec(line)?.groups ?? {};

	return {
		depth: Math.floor(indent.length / NESTED_INDENT_WIDTH),
		ordinal: marker.endsWith('.') ? marker.slice(0, -1) : undefined,
		spans: parseInline(text),
	};
};

const readFence = (lines: string[], start: number): ReadResult => {
	const closingIndex = lines.findIndex(
		(line, index) => index > start && fenceClosePattern.test(line),
	);
	const end = closingIndex === -1 ? lines.length : closingIndex;

	return {
		block: {kind: 'code', text: lines.slice(start + 1, end).join('\n')},
		next: end + 1,
	};
};

const readHeading = (line: string, start: number): ReadResult => {
	const {hashes = '', text = ''} = headingPattern.exec(line)?.groups ?? {};

	return {
		block: {kind: 'heading', level: hashes.length, spans: parseInline(text)},
		next: start + 1,
	};
};

const readList = (lines: string[], start: number): ReadResult => {
	const end = endOfRun(lines, start, (line) => listPattern.test(line));

	return {
		block: {
			kind: 'list',
			items: lines.slice(start, end).map((line) => parseListItem(line)),
		},
		next: end,
	};
};

const readQuote = (lines: string[], start: number): ReadResult => {
	const end = endOfRun(lines, start, (line) => line.startsWith('>'));
	const text = lines
		.slice(start, end)
		.map((line) => line.replace(/^> ?/, ''))
		.join('\n');

	return {
		block: {kind: 'quote', spans: parseInline(text)},
		next: end,
	};
};

const readParagraph = (lines: string[], start: number): ReadResult => {
	const end = endOfRun(
		lines,
		start,
		(line) => !isBlank(line) && !isBlockStart(line),
	);

	return {
		block: {
			kind: 'paragraph',
			spans: parseInline(lines.slice(start, end).join('\n')),
		},
		next: end,
	};
};

const readBlock = (lines: string[], start: number): ReadResult => {
	const line = lines[start] ?? '';

	if (isBlank(line)) {
		return {next: start + 1};
	}

	if (fenceOpenPattern.test(line)) {
		return readFence(lines, start);
	}

	if (headingPattern.test(line)) {
		return readHeading(line, start);
	}

	if (listPattern.test(line)) {
		return readList(lines, start);
	}

	return line.startsWith('>')
		? readQuote(lines, start)
		: readParagraph(lines, start);
};

export const parseMarkdown = (source: string): MarkdownBlock[] => {
	const lines = source.split(/\r?\n/);
	const blocks: MarkdownBlock[] = [];
	let index = 0;

	while (index < lines.length) {
		const {block, next} = readBlock(lines, index);

		if (block) {
			blocks.push(block);
		}

		index = next;
	}

	return blocks;
};
