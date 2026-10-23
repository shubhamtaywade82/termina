import wrapAnsi from 'wrap-ansi';
import cliTruncate from 'cli-truncate';
import {
	type StyledChar,
	styledCharsFromTokens,
	styledCharsToString,
	tokenize,
} from '@alcalzone/ansi-tokenize';
import QuickLRU from 'quick-lru';
import {type Styles} from './styles.js';

export const wrapTextCache = new QuickLRU<string, string>({maxSize: 4096});

// A soft wrap breaks at a space, and that space belongs to the break, not to either line. Without this, wrapped text starts continuation lines with a stray space, and a space that does not fit adds a row of its own.
// eslint-disable-next-line no-control-regex, regexp/no-control-character -- SGR starts with ESC.
const startsWithBreakWhitespace = /^(?:\u{1B}\[[\d:;]*m)*[\t ]/u;
// eslint-disable-next-line no-control-regex, regexp/no-control-character -- SGR starts with ESC.
const endsWithBreakWhitespace = /[\t ](?:\u{1B}\[[\d:;]*m)*$/u;

const isBreakWhitespace = (character: StyledChar): boolean =>
	character.value === ' ' || character.value === '\t';

const withoutLeadingBreakWhitespace = (line: string): string => {
	if (!startsWithBreakWhitespace.test(line)) {
		return line;
	}

	const characters = styledCharsFromTokens(tokenize(line));
	const firstVisible = characters.findIndex(
		(character) => !isBreakWhitespace(character),
	);

	return firstVisible === -1
		? ''
		: styledCharsToString(characters.slice(firstVisible));
};

const withoutTrailingBreakWhitespace = (line: string): string => {
	if (!endsWithBreakWhitespace.test(line)) {
		return line;
	}

	const characters = styledCharsFromTokens(tokenize(line));
	let end = characters.length;
	while (end > 0 && isBreakWhitespace(characters[end - 1]!)) {
		end--;
	}

	return styledCharsToString(characters.slice(0, end));
};

// Wrapping keeps every space (`trim: false`) so that `hard` wrapping and intentional indentation survive, and the cleaning here is limited to what a soft wrap leaves behind. Each input line wraps into its own run of output rows. A row that ends a run keeps its trailing spaces, since they were not a break. Styles are read from one wrap of the whole text, so a style that spans a newline is still reopened.
const wrapWords = (text: string, maxWidth: number): string => {
	const options = {trim: false, hard: true} as const;
	const lines = wrapAnsi(text, maxWidth, options).split('\n');
	const inputLines = text.split('\n');
	const output: string[] = [];
	let runStart = 0;

	for (const inputLine of inputLines) {
		const runLength =
			inputLines.length === 1
				? lines.length
				: wrapAnsi(inputLine, maxWidth, options).split('\n').length;
		const runEnd = runStart + runLength;

		for (let index = runStart; index < runEnd; index++) {
			let line = lines[index]!;

			if (index > runStart) {
				line = withoutLeadingBreakWhitespace(line);
			}

			if (index < runEnd - 1) {
				line = withoutTrailingBreakWhitespace(line);
			}

			// A continuation row that held only break whitespace has no content and would only add height.
			if (index === runStart || line !== '') {
				output.push(line);
			}
		}

		runStart = runEnd;
	}

	return output.join('\n');
};

const wrapText = (
	text: string,
	maxWidth: number,
	wrapType: Styles['textWrap'],
): string => {
	// `wrapAnsi` only breaks a row once something is on it, so wrapping into zero columns puts every character on its own row and the layout height grows to the character count. Text with no room keeps its natural width instead, like any other content that does not fit. Truncation is left alone: it cuts to nothing at zero columns.
	if (maxWidth <= 0 && (wrapType === 'wrap' || wrapType === 'hard')) {
		return text;
	}

	// Yoga rounds a text node's width up to a whole column, so a positive fraction of a column is measured as the one column it renders into.
	if (maxWidth > 0 && maxWidth < 1) {
		maxWidth = 1;
	}

	// `text` goes last because it's the only part of the key that can contain
	// arbitrary characters. With it first, ('ab', 12, 'wrap') and
	// ('ab1', 2, 'wrap') both produce the key `ab12wrap` and share a result.
	const cacheKey = `${maxWidth}\u{0}${String(wrapType)}\u{0}${text}`;
	const cachedText = wrapTextCache.get(cacheKey);

	if (cachedText !== undefined) {
		return cachedText;
	}

	let wrappedText = text;

	if (wrapType === 'wrap') {
		wrappedText = wrapWords(text, maxWidth);
	} else if (wrapType === 'hard') {
		wrappedText = wrapAnsi(text, maxWidth, {
			trim: false,
			hard: true,
			wordWrap: false,
		});
	} else if (wrapType!.startsWith('truncate')) {
		let position: 'end' | 'middle' | 'start' = 'end';

		if (wrapType === 'truncate-middle') {
			position = 'middle';
		} else if (wrapType === 'truncate-start') {
			position = 'start';
		}

		// `cliTruncate` treats its input as a single line: newlines are zero-width, so the widths of every line would add up and the text would be cut as one run. Truncate each line on its own instead, the same way `wrapAnsi` wraps each line. Split on styled characters rather than the raw string so styles and links that span a newline are reopened on every line they cover. Single-line text skips the tokenization, which is the expensive part on long strings.
		let lines = [text];

		if (text.includes('\n')) {
			const styledLines: StyledChar[][] = [[]];
			for (const character of styledCharsFromTokens(tokenize(text))) {
				if (character.value === '\n') {
					styledLines.push([]);
				} else {
					styledLines.at(-1)!.push(character);
				}
			}

			lines = styledLines.map((line) => styledCharsToString(line));
		}

		wrappedText = lines
			.map((line) => cliTruncate(line, maxWidth, {position}))
			.join('\n');
	}

	wrapTextCache.set(cacheKey, wrappedText);

	return wrappedText;
};

export default wrapText;
