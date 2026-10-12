---
outline: [2, 3]
---

# DataTable

`DataTable` is a table with a focus. The user moves the highlight through the rows with Up and Down, moves the focused column with Left and Right, sorts by the focused column with `s`, and chooses the focused row with Enter. Use it when the user must pick a row from data with several fields, or sort that data before picking. For the same data shown without focus, use [Table](/ui/components/table), which is display only. To choose one value from a short list, use [Select](/ui/components/select). Rows past the visible window are reached by scrolling, as in Select.

`DataTable` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Move with Up and Down, press `s` to sort by the focused column, and press Enter to choose a row.

<TerminalDemo demo="data-table-basic" title="DataTable — processes" />

## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {DataTable, type TableColumn, type TableRow} from '@nemesis-oss/termina-ui';

const columns: TableColumn[] = [
	{key: 'name', header: 'Process'},
	{key: 'cpu', header: 'CPU %', align: 'right'},
];

const processes: TableRow[] = [
	{name: 'nginx', cpu: 1.8},
	{name: 'node', cpu: 10.1},
	{name: 'redis', cpu: 0.6},
];

function Processes() {
	const {exit} = useApp();

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Choose a process (up and down to move, enter to select)</Text>
			<DataTable
				columns={columns}
				rows={processes}
				onSelect={row => {
					console.log(row['name']);
					exit();
				}}
			/>
		</Box>
	);
}

render(<Processes />);
```

`onSelect` receives the row object from `rows`, and the example calls `exit()` after the choice because the table does not exit on its own.

## Props

`DataTableProps` is exported from `@nemesis-oss/termina-ui`. `TableColumn` and `TableRow` are also exported. `TableColumn` has the shape `{key: string; header: string; align?: 'left' | 'right'}`, and `TableRow` is `Record<string, string | number>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `TableColumn[]` | Required | Columns, in display order. `key` names the row field, `header` is the header text, and `align` defaults to `'left'`. Every column can be sorted. |
| `rows` | `TableRow[]` | Required | Rows, one line each. A row with no value for a column's `key` shows an empty cell. |
| `visibleRowCount` | `number` | `5` | Number of rows shown at once. The header is always shown. |
| `isActive` | `boolean` | `true` | When false, key input is ignored. The table still renders. |
| `onSelect` | `(row: TableRow) => void` | `undefined` | Called with the focused row when Enter is pressed. The row is the object from `rows`, even when the table is sorted. |

## Keyboard

The focused row has a blue background. The focused column's header is underlined. The sorted column's header shows `↑` when ascending and `↓` when descending.

| Key | Effect |
| --- | --- |
| Up | Focuses the row above. Focus does not wrap from the first row to the last. When focus moves above the first visible row, the window scrolls up by one row. |
| Down | Focuses the row below. Focus does not wrap from the last row to the first. When focus moves past the last visible row, the window scrolls down by one row. |
| Left | Focuses the column to the left. Focus does not wrap from the first column to the last. |
| Right | Focuses the column to the right. Focus does not wrap from the last column to the first. |
| `s` | Sorts by the focused column: ascending first, then descending, then no sort. Sorting a different column starts ascending on that column. |
| Enter | Calls `onSelect` with the focused row. |
| Any other key | Ignored. Ctrl and Alt chords are ignored too, such as Ctrl+s, Alt+s, and Ctrl+Down. |

When `isActive` is false, or when stdin is not in raw mode (for example, piped input), no key has an effect. The table still renders.

## Theme keys

The component reads the `DataTable` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'`. |
| `styles.headerCell` | `{isFocused}` | Text props: `bold: true`, and `underline` set to `isFocused`. Applied to every header label. |
| `styles.row` | `{isFocused}` | Box props: `flexDirection: 'row'`, `gap: 2`, `minHeight: 1`, and `backgroundColor: 'blue'` when focused, otherwise unset. Applied to the header and to each body row, so the background covers the gaps between cells. |
| `styles.cell` | none | Box props: `flexShrink: 0`. Applied to every header and data cell. |
| `styles.separator` | none | Text props: `dimColor: true`. Applied to the rule under the header. |
| `styles.sortIndicator` | none | Text props: `color: 'cyan'`. Applied to the space and arrow after the label in the sorted column's header. |

The rule's `─` glyph and the sort arrows are set in the component, so the theme controls only their style. Column alignment is not a theme key. It comes from `align` on each column.

`DataTable` has no config keys.

## Edge cases

- With no rows, the table shows the header and the rule only. Up, Down, and Enter do nothing, and `onSelect` is not called.
- With no columns, the header and each row render as blank lines, and no rule is drawn.
- A row whose cells are all blank still takes one line.
- When `visibleRowCount` is larger than the number of rows, every row is shown with no blank lines.
- Column widths are measured from every row, so a long value outside the visible window still sets the width.
- Each header reserves room for the sort arrow, so sorting never changes a column's width.
- Sorting does not move focus. The focus stays on the same position, so the highlight can land on a different row.
- Blank cells sort first in ascending order, and they are not read as 0.
- In a column that mixes kinds, blank cells sort first, then numbers, then text. So `9`, `10` and `1a` sort in that order, whatever the order of the rows. Within numbers, values compare by value, so `9` sorts before `10`. Within text, the comparison ignores case, so `apple` sorts before `Banana`.
- A `visibleRowCount` below 1 shows one row, and a fraction is rounded down.
- When `visibleRowCount` shrinks after mount, the window moves so the focused row stays visible.
- `onSelect` receives the object from `rows`, even when the table is sorted.
- When `rows` shrinks after mount, a focus position past the last remaining row moves to that row, and Enter selects it.
