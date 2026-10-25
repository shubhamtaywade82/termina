import React, {Fragment, type ReactNode} from 'react';
import figures from 'figures';
import {Box, Text, type TextProps} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {
	NESTED_INDENT_WIDTH,
	parseMarkdown,
	type MarkdownInlineSpan,
	type MarkdownListItem,
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

const spanStyle = (span: MarkdownInlineSpan, styles: Styles): TextProps => {
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

// Each leaf carries its block's whole style, since an outer style would lose its bold after a
// nested span. SGR 22 clears bold and dim together and the output does not restore the one left
// on, so no leaf carries both: bold is never dimmed, and a link's dim URL is never bold.
const renderSpan = (
	span: MarkdownInlineSpan,
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
				<Text {...base} bold={false} dimColor>{` (${span.url ?? ''})`}</Text>
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
	spans: MarkdownInlineSpan[],
	styles: Styles,
	base: TextProps,
): ReactNode[] =>
	spans.map((span, index) => renderSpan(span, index, styles, base));

const renderListItem = (
	item: MarkdownListItem,
	index: number,
	styles: Styles,
): ReactNode => {
	const glyph = item.ordinal === undefined ? figures.bullet : `${item.ordinal}.`;
	const marker = `${' '.repeat(item.depth * NESTED_INDENT_WIDTH)}${glyph} `;

	return (
		<Box key={index}>
			{/* The marker is fixed-width chrome. If it could shrink, Yoga would take a fraction of its column and drop the space after it. */}
			<Box flexShrink={0}>
				<Text {...styles.listBullet()}>{marker}</Text>
			</Box>
			<Box flexGrow={1} flexShrink={1}>
				<Text>{renderSpans(item.spans, styles, styles.paragraph())}</Text>
			</Box>
		</Box>
	);
};

const renderList = (
	items: MarkdownListItem[],
	index: number,
	styles: Styles,
): ReactNode => (
	<Box key={index} flexDirection="column">
		{items.map((item, itemIndex) => renderListItem(item, itemIndex, styles))}
	</Box>
);

const renderQuote = (
	spans: MarkdownInlineSpan[],
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
