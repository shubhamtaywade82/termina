---
outline: [2, 3]
---

# Divider

`Divider` is a horizontal rule that fills the width of its parent. Use it to separate sections of output, and add a title when a section needs a label. Unlike [Header](/ui/components/header), which is the title bar at the top of an application, a divider only separates content. It is one row high unless a title wraps.

`Divider` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The first rule has no title. The other two carry a title after a two-column line.

<TerminalDemo demo="divider-basic" title="Divider — section rules" />

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {Divider} from '@nemesis-oss/termina-ui';

function Report() {
	return (
		<Box flexDirection="column">
			<Text>Build finished in 4.2s</Text>
			<Divider title="Results" />
			<Text>3 packages built, 0 errors</Text>
		</Box>
	);
}

render(<Report />);
```

In a column with no width set, the rule spans the terminal.

## Props

`DividerProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `undefined` | Text drawn after a two-column line, with one space on each side. An empty string draws the plain rule. |

## Theme keys

The component reads the `Divider` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'row'`, `gap: 1`, `width: '100%'`. The gap is the single space on each side of the title. |
| `styles.line` | none | Box props: `borderStyle: 'single'` with the bottom, left and right borders set to `false`, so only the top edge is drawn. Also `borderColor: 'gray'` and `flexShrink: 0`. |
| `styles.title` | none | Text props: `bold: true` |

The two-column line before the title is set in the component. The theme controls its style, not its width.

`Divider` has no config keys.

## Edge cases

- The rule takes the width of its parent, not the terminal. In a 40-column `Box`, it draws 40 columns.
- An empty `title` draws the plain rule, the same as leaving `title` out.
- A title that does not fit in the row after the two-column line and the two gaps wraps onto more rows. The trailing line is not drawn once the title fills the row.
- In a parent four columns or narrower, the two-column line and the gaps leave no room for the title. The title keeps its full width and runs past the parent's edge.
