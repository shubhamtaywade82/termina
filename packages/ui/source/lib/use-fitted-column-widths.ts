import {useRef} from 'react';
import {
	type DOMElement,
	useBoxMetrics,
	useWindowSize,
} from '@nemesis-oss/termina-core';
import {fitColumnWidths} from './fit-column-widths.js';

/**
Fits `naturalWidths` to the box that the returned `ref` is attached to. Until that box is measured, the terminal width stands in for it, so the first frame of a table that fills the screen is already fitted.
*/
export const useFittedColumnWidths = (
	naturalWidths: readonly number[],
	gap: number,
) => {
	const ref = useRef<DOMElement>(null);
	const container = useBoxMetrics(ref);
	const {columns} = useWindowSize();

	return {
		ref,
		widths: fitColumnWidths(
			naturalWidths,
			gap,
			container.hasMeasured ? container.width : columns,
		),
	};
};
