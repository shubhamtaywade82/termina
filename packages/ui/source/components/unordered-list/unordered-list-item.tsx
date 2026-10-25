import {Box, Text} from '@nemesis-oss/termina-core';
import React, {use, type ReactNode} from 'react';
import {useComponentTheme} from '../../theme.js';
import {UnorderedListItemContext} from './unordered-list-item-context.js';
import {type Theme} from './theme.js';

export type UnorderedListItemProps = {
	/**
	 * List item content.
	 */
	readonly children: ReactNode;
};

export function UnorderedListItem({children}: UnorderedListItemProps) {
	const {marker} = use(UnorderedListItemContext);
	const {styles} = useComponentTheme<Theme>('UnorderedList');

	return (
		<Box {...styles.listItem()}>
			{/* The marker is fixed-width chrome. If it could shrink, Yoga would take a fraction of its column and drop the space after it. */}
			<Box flexShrink={0}>
				<Text {...styles.marker()}>{marker}</Text>
			</Box>
			<Box {...styles.content()}>{children}</Box>
		</Box>
	);
}
