/* eslint-disable @eslint-react/no-array-index-key -- Steps are fixed in order, and each step is identified by its position. */
import React from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import figures from 'figures';
import {useComponentTheme} from '../../theme.js';
import {type StepperStatus, type Theme} from './theme.js';

export type StepperProps = {
	/**
	 * Step labels, in order. Each step is drawn on its own row.
	 */
	readonly steps: string[];

	/**
	 * Index of the active step. Steps before it are done and steps after it are pending.
	 *
	 * @default 0
	 */
	readonly current?: number;
};

const STEP_ICONS: Record<StepperStatus, string> = {
	done: figures.tick,
	current: figures.circleFilled,
	pending: figures.circle,
};

function getStepStatus(index: number, activeIndex: number): StepperStatus {
	if (index < activeIndex) {
		return 'done';
	}

	return index === activeIndex ? 'current' : 'pending';
}

export function Stepper({steps, current = 0}: StepperProps) {
	const {styles} = useComponentTheme<Theme>('Stepper');
	const activeIndex = Math.max(current, 0);

	return (
		<Box {...styles.container()}>
			{steps.map((label, index) => {
				const status = getStepStatus(index, activeIndex);

				return (
					<Text key={index}>
						<Text {...styles.icon({status})}>{STEP_ICONS[status]}</Text>{' '}
						<Text {...styles.label({status})}>{label}</Text>
					</Text>
				);
			})}
		</Box>
	);
}
