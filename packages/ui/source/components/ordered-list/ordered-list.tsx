import {Box} from '@nemesis-oss/termina-core';
import React, {type ReactNode, use, isValidElement} from 'react';
import {useComponentTheme} from '../../theme.js';
import {OrderedListItem} from './ordered-list-item.js';
import {OrderedListContext} from './ordered-list-context.js';
import {OrderedListItemContext} from './ordered-list-item-context.js';
import {type Theme} from './theme.js';

export type OrderedListProps = {
	/**
	 * List items.
	 */
	readonly children: ReactNode;
};

export function OrderedList({children}: OrderedListProps) {
	const {marker: parentMarker} = use(OrderedListContext);
	const {styles} = useComponentTheme<Theme>('OrderedList');

	let numberOfItems = 0;

	// Counting direct children needs the array form, which is what the list numbers.
	// eslint-disable-next-line @eslint-react/no-children-to-array -- The list numbers its direct children, so it needs them as an array.
	for (const child of React.Children.toArray(children)) {
		if (!isValidElement(child) || child.type !== OrderedListItem) {
			continue;
		}

		numberOfItems++;
	}

	const maxMarkerWidth = String(numberOfItems).length;

	// The list numbers each direct child, which needs the index that Children.map passes.
	// eslint-disable-next-line @eslint-react/no-children-map, @typescript-eslint/promise-function-async -- Numbering children needs the index. ReactNode includes Promise, which this callback does not return.
	const items = React.Children.map(children, (child, index) => {
		if (!isValidElement(child) || child.type !== OrderedListItem) {
			return child;
		}

		const paddedMarker = `${String(index + 1).padStart(maxMarkerWidth)}.`;
		const marker = `${parentMarker}${paddedMarker}`;

		return (
			<OrderedListContext value={{marker}}>
				<OrderedListItemContext value={{marker}}>
					{child}
				</OrderedListItemContext>
			</OrderedListContext>
		);
	});

	return <Box {...styles.list()}>{items}</Box>;
}

OrderedList.Item = OrderedListItem;
