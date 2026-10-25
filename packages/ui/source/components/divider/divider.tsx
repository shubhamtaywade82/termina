import React from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {isPresent} from '../../lib/is-present.js';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

const LEAD_LINE_COLUMNS = 2;

export type DividerProps = {
	/**
	 * Text drawn after a two-column line, with one space on each side. An empty string draws the plain rule.
	 */
	readonly title?: string;
};

/**
 * Horizontal rule across the width of its parent, with an optional title.
 */
export function Divider({title}: DividerProps) {
	const {styles} = useComponentTheme<Theme>('Divider');

	return (
		<Box {...styles.container()}>
			{isPresent(title) ? (
				<>
					<Box {...styles.line()} width={LEAD_LINE_COLUMNS} />
					<Text {...styles.title()}>{title}</Text>
				</>
			) : null}
			{/* A top border spans the box's width, so the rule follows its parent without measuring the terminal. */}
			<Box {...styles.line()} flexGrow={1} />
		</Box>
	);
}
