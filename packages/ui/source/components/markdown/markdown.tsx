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

// Bold is never dimmed. SGR 22 clears bold and dim together, and the output then
// drops the dim on the text after it, so only the other leaves carry the dim.
const renderSpan = (
	span: InlineSpan,
	index: number,
	styles: Styles,
	isDimmed: boolean,
): ReactNode => {
	if (span.kind === 'link') {
		return (
			<Fragment key={index}>
				<Text dimColor={isDimmed} {...styles.link()}>
					{span.value}
				</Text>
				<Text dimColor>{` (${span.url ?? ''})`}</Text>
			</Fragment>
		);
	}

	return (
		<Text
			key={index}
			dimColor={isDimmed && span.kind !== 'bold'}
			{...spanStyle(span, styles)}
		>
			{span.value}
		</Text>
	);
};

const renderSpans = (
	spans: InlineSpan[],
	styles: Styles,
	isDimmed = false,
): ReactNode[] =>
	spans.map((span, index) => renderSpan(span, index, styles, isDimmed));

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
				<Text {...styles.paragraph()}>{renderSpans(item.spans, styles)}</Text>
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
		<Text {...styles.paragraph()}>{renderSpans(spans, styles, true)}</Text>
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
			<Text key={index} {...styles.heading({level: block.level})}>
				{renderSpans(block.spans, styles)}
			</Text>
		);
	}

	return (
		<Text key={index} {...styles.paragraph()}>{renderSpans(block.spans, styles)}</Text>
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
