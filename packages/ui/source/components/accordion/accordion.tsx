import React, {useRef, useState, type ReactNode} from 'react';
import {
	Box,
	type Key,
	Text,
	useInput,
	useStdin,
} from '@nemesis-oss/termina-core';
import figures from 'figures';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type AccordionItem = {
	/**
	 * Identifies the section in `defaultOpenIds` and `onChange`. Must be unique.
	 */
	readonly id: string;

	/**
	 * Title of the row that opens and closes the section.
	 */
	readonly title: string;

	/**
	 * Shown below the title while the section is open. A string is drawn as text.
	 */
	readonly content: ReactNode;
};

export type AccordionProps = {
	/**
	 * Sections, in display order.
	 */
	readonly items: AccordionItem[];

	/**
	 * Ids of the sections open at mount. Read once, so later changes are ignored.
	 *
	 * @default []
	 */
	readonly defaultOpenIds?: string[];

	/**
	 * Allow several sections to be open at once. When false, opening a section closes the others.
	 *
	 * @default false
	 */
	readonly multiple?: boolean;

	/**
	 * When false, key input is ignored.
	 *
	 * @default true
	 */
	readonly isActive?: boolean;

	/**
	 * Called with the open ids after the user opens or closes a section.
	 */
	readonly onChange?: (openIds: string[]) => void;
};

type AccordionState = {
	readonly openIds: string[];
	readonly focusedIndex: number;
};

type KeyPress = {
	readonly input: string;
	readonly key: Key;
	readonly items: AccordionItem[];
	readonly multiple: boolean;
};

const toggleOpenIds = (
	openIds: string[],
	id: string,
	multiple: boolean,
): string[] => {
	if (openIds.includes(id)) {
		return openIds.filter(openId => openId !== id);
	}

	return multiple ? [...openIds, id] : [id];
};

const nextFocusIndex = (
	input: string,
	key: Key,
	focusedIndex: number,
	lastIndex: number,
): number => {
	// Items can shrink between key presses, so the focus is clamped before it moves.
	const currentIndex = Math.min(focusedIndex, lastIndex);

	if (key.upArrow || input === 'k') {
		return Math.max(0, currentIndex - 1);
	}

	if (key.downArrow || input === 'j') {
		return Math.min(lastIndex, currentIndex + 1);
	}

	if (input === 'g') {
		return 0;
	}

	if (input === 'G') {
		return lastIndex;
	}

	return currentIndex;
};

const applyKey = (
	current: AccordionState,
	{input, key, items, multiple}: KeyPress,
): AccordionState => {
	// Ctrl and Alt combinations arrive with the plain letter as `input`, so they are filtered here.
	// With no items there is no index to focus, and clamping would store -1 for later renders.
	if (key.ctrl || key.meta || items.length === 0) {
		return current;
	}

	const focusedIndex = nextFocusIndex(
		input,
		key,
		current.focusedIndex,
		items.length - 1,
	);
	const focusedItem = items[focusedIndex];
	const isToggleKey = key.return || input === ' ';

	if (!isToggleKey || focusedItem === undefined) {
		return {openIds: current.openIds, focusedIndex};
	}

	return {
		openIds: toggleOpenIds(current.openIds, focusedItem.id, multiple),
		focusedIndex,
	};
};

type UseAccordionStateProps = {
	readonly items: AccordionItem[];
	readonly defaultOpenIds: string[];
	readonly multiple: boolean;
	readonly isActive: boolean;
	readonly onChange?: (openIds: string[]) => void;
};

const useAccordionState = ({items, defaultOpenIds, multiple, isActive, onChange}: UseAccordionStateProps): AccordionState => {
	const {isRawModeSupported} = useStdin();
	const [state, setState] = useState<AccordionState>({openIds: defaultOpenIds, focusedIndex: 0});
	// Key events can outpace renders, so each one reads the newest state, not the one from the last render.
	const latestStateRef = useRef(state);

	useInput(
		(input, key) => {
			const previous = latestStateRef.current;
			const next = applyKey(previous, {input, key, items, multiple});
			latestStateRef.current = next;
			setState(next);
			// Focus moves reuse the same openIds array, so a new reference means the open set changed.
			if (next.openIds !== previous.openIds) {
				onChange?.(next.openIds);
			}
		},
		{isActive: isActive && isRawModeSupported},
	);

	return {
		openIds: state.openIds,
		focusedIndex: Math.min(state.focusedIndex, items.length - 1),
	};
};

type AccordionSectionProps = {
	readonly title: string;
	readonly content: ReactNode;
	readonly isOpen: boolean;
	readonly isFocused: boolean;
};

function AccordionSection({
	title,
	content,
	isOpen,
	isFocused,
}: AccordionSectionProps) {
	const {styles} = useComponentTheme<Theme>('Accordion');
	const glyph = isOpen ? figures.triangleDown : figures.triangleRight;

	return (
		<>
			<Text>
				<Text {...styles.icon({isOpen})}>{glyph}</Text>{' '}
				<Text {...styles.title({isFocused})}>{title}</Text>
			</Text>
			{isOpen && (
				<Box {...styles.content()}>
					{typeof content === 'string' ? <Text>{content}</Text> : content}
				</Box>
			)}
		</>
	);
}

export function Accordion({
	items,
	defaultOpenIds = [],
	multiple = false,
	isActive = true,
	onChange,
}: AccordionProps) {
	const {openIds, focusedIndex} = useAccordionState({
		items,
		defaultOpenIds,
		multiple,
		isActive,
		onChange,
	});
	const {styles} = useComponentTheme<Theme>('Accordion');

	return (
		<Box {...styles.container()}>
			{items.map((item, index) => (
				<AccordionSection
					key={item.id}
					title={item.title}
					content={item.content}
					isOpen={openIds.includes(item.id)}
					isFocused={index === focusedIndex}
				/>
			))}
		</Box>
	);
}
