import React, {type ReactNode} from 'react';
import {Box, Text, useInput} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type DialogProps = {
	/**
	 * Title, shown on the first line inside the border.
	 */
	readonly title: string;

	/**
	 * Content, stacked in one column below the title. Wrap text in `Text`.
	 */
	readonly children: ReactNode;

	/**
	 * Called when the user presses Escape. When omitted, Escape is ignored and the footer is hidden.
	 */
	readonly onClose?: () => void;

	/**
	 * Width in columns, including the border.
	 *
	 * @default Fills the parent
	 */
	readonly width?: number;
};

export function Dialog({title, children, onClose, width}: DialogProps) {

	useInput(
		(_input, key) => {
			if (key.escape) {
				onClose?.();
			}
		},
		{isActive: onClose !== undefined},
	);

	const {styles} = useComponentTheme<Theme>('Dialog');

	return (
		<Box {...styles.container()} width={width}>
			<Text {...styles.title()}>{title}</Text>
			<Box {...styles.body()}>
				{typeof children === 'string' ? <Text>{children}</Text> : children}
			</Box>
			{onClose !== undefined && (
				<Text {...styles.footer()}>Esc to close</Text>
			)}
		</Box>
	);
}
