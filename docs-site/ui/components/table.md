---
outline: [2, 3]
---

# Table

`Table` shows rows of values in aligned columns. Use it to show data you already have, such as a list of processes or the rows of a query result. It is display only: it has no focus and reads no keys, so the user cannot pick a row. To let the user choose one value from a list, use [Select](/ui/components/select). To let the user move through rows and pick one, use [DataTable](/ui/components/data-table). Each column is as wide as its widest cell, header included, and cells in a row are separated by two spaces. A table wider than its container shrinks its widest columns until it fits, and cuts their cells with `…`.

`Table` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The demo shows three processes, with the PID and CPU columns right-aligned.

<TerminalDemo demo="table-basic" title="Table — processes" />

## Usage

```tsx
import {render} from '@nemesis-oss/termina-core';
import {Table, type TableColumn, type TableRow} from '@nemesis-oss/termina-ui';

const columns: TableColumn[] = [
	{key: 'name', header: 'Name'},
	{key: 'version', header: 'Version', align: 'right'},
];

const packages: TableRow[] = [
	{name: 'termina-core', version: '0.1.0'},
	{name: 'termina-ui', version: '0.1.0'},
];

render(<Table columns={columns} rows={packages} />);
```

Each row is an object keyed by the column keys, and a value can be a string or a number.

## Props

`TableProps` is exported from `@nemesis-oss/termina-ui`. `TableColumn` and `TableRow` are also exported. `TableColumn` has the shape `{key: string; header: string; align?: 'left' | 'right'}`, and `TableRow` is `Record<string, string | number>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `TableColumn[]` | Required | Columns, in display order. `key` names the row field, `header` is the header text, and `align` defaults to `'left'`. |
| `rows` | `TableRow[]` | Required | Rows, one line each unless a cell contains a line break, which splits its row onto more lines. A row with no value for a column's `key` shows an empty cell. |

## Theme keys

The component reads the `Table` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'`. |
| `styles.header` | none | Text props: `bold: true`. Applied to the header cells. |
| `styles.row` | none | Box props: `flexDirection: 'row'`, `gap: 2`, and `minHeight: 1`. The gap separates the cells, and the rule is sized to match it. |
| `styles.cell` | `{align}` | Box props: `flexShrink: 1`, `minWidth: 1`, and `justifyContent: 'flex-end'` when `align` is `'right'`, otherwise `'flex-start'`. Applied to every header and data cell. The component sets each cell's width, so `flexShrink` only applies when a row is still wider than the container at one cell per column. |
| `styles.separator` | none | Text props: `dimColor: true`. Applied to the rule. |

The rule's `─` glyph is set in the component, so the theme controls only its style.

`Table` has no config keys.

## Edge cases

- An empty `rows` array renders the header and the rule only.
- A row with no value for a column's `key` renders an empty cell in that column.
- A row with no values at all renders as a blank line, so the table still has one line per row.
- With an empty `columns` array, the header and each row render as blank lines, and no rule is drawn.
- Values are shown with `String(value)`, so `0` shows as `0` and `1.50` shows as `1.5`.
- CJK characters and most emoji count as two cells each, as `string-width` measures them, so they stay aligned with the rest of the column.
- The header of a right-aligned column is right-aligned too.
- A table wider than its container shrinks its widest columns one cell at a time until the row fits, so short columns keep their width. Each cell that no longer fits is cut with `…`, and every row stays one line. A column is never narrower than one cell, so a container narrower than one cell per column still overflows.
- The rule under the header is one row, clipped to the table's width, so it never wraps.
- Widths are recomputed on every render, so changing `rows` after mount reflows the table.
