import React from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type HeaderProps = {
	/**
	 * Title, drawn in bold.
	 */
	readonly title: string;

	/**
	 * Text after the title, drawn dimmed on the same line. An empty string draws nothing.
	 */
	readonly subtitle?: string;
};

/**
 * Title bar: a bold title, then an optional dimmed subtitle on the same line.
 */
export function Header({title, subtitle}: HeaderProps) {
	const {styles} = useComponentTheme<Theme>('Header');

	return (
		<Box {...styles.container()}>
			<Text {...styles.title()}>{title}</Text>
			{subtitle ? <Text {...styles.subtitle()}>{subtitle}</Text> : null}
		</Box>
	);
}
