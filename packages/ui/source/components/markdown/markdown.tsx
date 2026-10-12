import React, {Fragment, type ReactNode} from 'react';
import figures from 'figures';
import {Box, Text, type TextProps} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {
	NESTED_INDENT_WIDTH,
	parseMarkdown,
	type InlineSpan,
	type ListItem,
	type MarkdownBlock,
} from './parse-markdown.js';
import {type Theme} from './theme.js';

export type MarkdownProps = {
	/**
	 * Markdown source.
	 */
	readonly children: string;
};

type Styles = Theme['styles'];

const spanStyle = (span: InlineSpan, styles: Styles): TextProps => {
	if (span.kind === 'bold') {
		return styles.bold();
	}

	if (span.kind === 'italic') {
		return styles.italic();
	}

	if (span.kind === 'code') {
		return styles.code();
	}

	return {};
};

// Every leaf carries the whole block style, not just its own. SGR 22 clears bold and
// dim together, so an outer style would lose its bold after a nested link or bold span.
// Bold is never dimmed, because the output drops the dim on the text after a bold.
const renderSpan = (
	span: InlineSpan,
	index: number,
	styles: Styles,
	base: TextProps,
): ReactNode => {
	if (span.kind === 'link') {
		return (
			<Fragment key={index}>
				<Text {...base} {...styles.link()}>
					{span.value}
				</Text>
				<Text {...base} dimColor>{` (${span.url ?? ''})`}</Text>
			</Fragment>
		);
	}

	const leafBase = span.kind === 'bold' ? {...base, dimColor: false} : base;

	return (
		<Text key={index} {...leafBase} {...spanStyle(span, styles)}>
			{span.value}
		</Text>
	);
};

const renderSpans = (
	spans: InlineSpan[],
	styles: Styles,
	base: TextProps,
): ReactNode[] =>
	spans.map((span, index) => renderSpan(span, index, styles, base));

const renderListItem = (
	item: ListItem,
	index: number,
	styles: Styles,
): ReactNode => {
	const glyph = item.ordinal === undefined ? figures.bullet : `${item.ordinal}.`;
	const marker = `${' '.repeat(item.depth * NESTED_INDENT_WIDTH)}${glyph} `;

	return (
		<Box key={index}>
			<Text {...styles.listBullet()}>{marker}</Text>
			<Box flexGrow={1}>
				<Text>{renderSpans(item.spans, styles, styles.paragraph())}</Text>
			</Box>
		</Box>
	);
};

const renderList = (
	items: ListItem[],
	index: number,
	styles: Styles,
): ReactNode => (
	<Box key={index} flexDirection="column">
		{items.map((item, itemIndex) => renderListItem(item, itemIndex, styles))}
	</Box>
);

const renderQuote = (
	spans: InlineSpan[],
	index: number,
	styles: Styles,
): ReactNode => (
	<Box key={index} {...styles.blockquote()}>
		<Text>
			{renderSpans(spans, styles, {...styles.paragraph(), dimColor: true})}
		</Text>
	</Box>
);

const renderCode = (text: string, index: number, styles: Styles): ReactNode => (
	<Box key={index} {...styles.codeBlock()}>
		<Text {...styles.code()}>{text}</Text>
	</Box>
);

const renderBlock = (
	block: MarkdownBlock,
	index: number,
	styles: Styles,
): ReactNode => {
	if (block.kind === 'list') {
		return renderList(block.items, index, styles);
	}

	if (block.kind === 'quote') {
		return renderQuote(block.spans, index, styles);
	}

	if (block.kind === 'code') {
		return renderCode(block.text, index, styles);
	}

	if (block.kind === 'heading') {
		return (
			<Text key={index}>
				{renderSpans(block.spans, styles, styles.heading({level: block.level}))}
			</Text>
		);
	}

	return (
		<Text key={index}>{renderSpans(block.spans, styles, styles.paragraph())}</Text>
	);
};

export function Markdown({children}: MarkdownProps) {
	const {styles} = useComponentTheme<Theme>('Markdown');
	const blocks = parseMarkdown(children);

	return (
		<Box {...styles.container()}>
			{blocks.map((block, index) => renderBlock(block, index, styles))}
		</Box>
	);
}
