import React, {type ReactNode, useRef, useState} from 'react';
import {Box, Text, useInput} from '@nemesis-oss/termina-core';
import {useComponentTheme} from '../../theme.js';
import {type Theme} from './theme.js';

export type TabsItem = {
	/**
	 * Identifier reported to `onChange`. Must be unique within `tabs`.
	 */
	readonly id: string;

	/**
	 * Text shown in the tab bar.
	 */
	readonly label: string;

	/**
	 * Shown below the tab bar while this tab is active.
	 */
	readonly content: ReactNode;
};

export type TabsProps = {
	/**
	 * Tabs, in display order.
	 */
	readonly tabs: TabsItem[];

	/**
	 * Id of the tab active at mount. Later changes are ignored. If no tab has this id, the first tab is active.
	 *
	 * @default The first tab
	 */
	readonly defaultTabId?: string;

	/**
	 * Called with the id of the newly active tab when Left or Right changes the tab.
	 */
	readonly onChange?: (id: string) => void;

	/**
	 * When false, key input is ignored. The tab bar and the active content still render.
	 *
	 * @default true
	 */
	readonly isActive?: boolean;
};

type ActiveTabOptions = {
	readonly tabs: TabsItem[];
	readonly defaultTabId?: string;
	readonly onChange?: (id: string) => void;
	readonly isActive: boolean;
};

function findActiveIndex(tabs: TabsItem[], activeId: string | undefined): number {
	return Math.max(0, tabs.findIndex(tab => tab.id === activeId));
}

// Keeps the id, not an index: removing the active tab then falls back to the first tab instead of pointing past the end.
function useActiveTabIndex({tabs, defaultTabId, onChange, isActive}: ActiveTabOptions): number {
	const [activeId, setActiveId] = useState(defaultTabId);
	// A ref, not the rendered id: one input chunk can hold two key presses, and both run before React re-renders.
	const activeIdRef = useRef(defaultTabId);

	const moveActiveTab = (step: number) => {
		const nextTab = tabs[findActiveIndex(tabs, activeIdRef.current) + step];
		if (nextTab === undefined) {
			return;
		}

		activeIdRef.current = nextTab.id;
		setActiveId(nextTab.id);
		onChange?.(nextTab.id);
	};

	useInput(
		(_input, key) => {
			if (key.leftArrow) {
				moveActiveTab(-1);
			} else if (key.rightArrow) {
				moveActiveTab(1);
			}
		},
		{isActive},
	);

	return findActiveIndex(tabs, activeId);
}

export function Tabs({tabs, defaultTabId, onChange, isActive = true}: TabsProps) {
	const activeIndex = useActiveTabIndex({tabs, defaultTabId, onChange, isActive});
	const {styles} = useComponentTheme<Theme>('Tabs');
	const activeTab = tabs.at(activeIndex);

	// Keyed by id so switching tabs remounts the content. Without the key, two tabs holding the same component would share its state.
	const panel = activeTab && (
		<Box key={activeTab.id} {...styles.panel()}>
			{typeof activeTab.content === 'string' ? <Text>{activeTab.content}</Text> : activeTab.content}
		</Box>
	);

	return (
		<Box flexDirection="column">
			<Box {...styles.tabBar()}>
				{tabs.map((tab, index) => (
					<Text
						key={tab.id}
						{...styles.tab({isActive: index === activeIndex})}
					>
						{tab.label}
					</Text>
				))}
			</Box>
			{panel}
		</Box>
	);
}
