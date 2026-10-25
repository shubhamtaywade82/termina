import React, {type ReactNode, useEffect, useState} from 'react';
import {
	Box,
	KeyboardCapture,
	Text,
	useFocusManager,
	useFocusScope,
	useInput,
} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type ModalProps = {
	/**
	 * Whether the modal is shown. While it is `false`, the modal renders nothing and the content behind it receives input as usual.
	 */
	readonly isOpen: boolean;

	/**
	 * Called when the user presses Escape while the modal is open. The modal does not close itself, so the parent should set `isOpen` to `false`.
	 */
	readonly onClose: () => void;

	/**
	 * Title, shown on the first line inside the border.
	 */
	readonly title?: string;

	/**
	 * Width in columns, including the border. The height follows the content.
	 *
	 * @default Fits the content
	 */
	readonly width?: number;

	/**
	 * Content, stacked in one column below the title. Only the focusable components inside the modal can take focus while it is open.
	 */
	readonly children?: ReactNode;
};

type LayerProps = Omit<ModalProps, 'isOpen'>;

// Rendered inside the capture, so it sees the modal's focus scope and its input is the only input delivered while the modal is open. It moves focus into the modal on mount, and returns focus to the field that had it when the modal unmounts.
function ModalLayer({onClose, title, width, children}: LayerProps) {
	const {styles} = useComponentTheme<Theme>('Modal');
	const {activeId, focus} = useFocusManager();
	const {focusFirstInScope} = useFocusScope();
	// Read on the render that opens the modal, before the content takes focus.
	const [openerId] = useState(activeId);

	useEffect(() => {
		focusFirstInScope();
	}, [focusFirstInScope]);

	useEffect(
		() => () => {
			// `focus` does nothing for an id that is no longer registered, so a field that has unmounted is left alone.
			if (openerId !== undefined) {
				focus(openerId);
			}
		},
		[focus, openerId],
	);

	useInput((_input, key) => {
		if (key.escape) {
			onClose();
		}
	});

	return (
		<Box
			position="absolute"
			width="100%"
			height="100%"
			justifyContent="center"
			alignItems="center"
		>
			<Box {...styles.container()} width={width}>
				{title !== undefined && <Text {...styles.title()}>{title}</Text>}
				{children}
			</Box>
		</Box>
	);
}

/**
 * A dialog layered over the content of the container it is rendered in. While it is open, the keys, paste and `useMouse` reports for the content behind it are not delivered, and Tab moves only between the focusable components inside it. `Box` mouse handlers such as `onClick` are found by hit testing and are not gated, so a handler on a covered element does not run only because the modal is above it.
 *
 * Render it as the last child of the container it covers. It is an absolute overlay sized to that container, so later siblings draw over it.
 *
 * ```
 * import {Box, Text} from '@nemesis-oss/termina-core';
 * import {Modal, Select} from '@nemesis-oss/termina-ui';
 *
 * const Example = ({isOpen, onClose}: {isOpen: boolean; onClose: () => void}) => (
 * <Box flexDirection="column" width={40} height={10}>
 * <Select options={[{label: 'Red', value: 'red'}]} />
 * <Modal isOpen={isOpen} onClose={onClose} title="Details" width={30}>
 * <Text>Press Escape to close.</Text>
 * </Modal>
 * </Box>
 * );
 * ```
 */
export function Modal({isOpen, onClose, title, width, children}: ModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<KeyboardCapture>
			<ModalLayer title={title} width={width} onClose={onClose}>
				{children}
			</ModalLayer>
		</KeyboardCapture>
	);
}
