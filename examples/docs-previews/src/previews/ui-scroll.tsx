import {Text} from '@nemesis-oss/termina-core';
import {LogStream, ScrollBox} from '@nemesis-oss/termina-ui';
import type {Preview} from '../preview.js';

const rows = Array.from({length: 100}, (_, index) => `row ${index}`);

const entries = (count: number) =>
	Array.from({length: count}, (_, index) => `entry ${index}`);

export const previews: readonly Preview[] = [
	{
		id: 'scroll-box-first-render',
		title: 'ScrollBox, first render',
		columns: 40,
		caption:
			"The Usage example's ScrollBox at its first render: a 10-row viewport at offset 0 shows row 0 to row 9 of the 100 rows, and no scrollbar column is drawn yet.",
		element: (
			<ScrollBox height={10}>
				{rows.map(row => (
					<Text key={row}>{row}</Text>
				))}
			</ScrollBox>
		),
	},
	{
		id: 'log-stream-entries-wrap',
		title: 'LogStream, multi-line and wrapped entries',
		columns: 40,
		caption:
			'Three entries in a 6-row LogStream at 40 columns: the second entry\'s newline starts a second row, and the third entry wraps onto a second row at the viewport width.',
		element: (
			<LogStream
				height={6}
				lines={[
					'server started',
					'listening on 127.0.0.1:8080\nready to accept connections',
					'GET /health 200 OK in 3ms from the monitoring agent at the edge',
				]}
			/>
		),
	},
	{
		id: 'log-stream-max-lines',
		title: 'LogStream, maxLines of 3',
		columns: 40,
		caption:
			'Fourteen entries with maxLines set to 3 in a 3-row LogStream: only entry 11, entry 12 and entry 13 are rendered, and they fill the viewport.',
		element: <LogStream height={3} maxLines={3} lines={entries(14)} />,
	},
];
