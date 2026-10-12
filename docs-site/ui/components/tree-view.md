---
outline: [2, 3]
---

# TreeView

`TreeView` draws nested data as an indented outline. Right and Left expand and collapse branches, and Enter selects any node and reports its path from the root. Use it for data that nests, such as a file tree, a dependency graph, or a settings schema. For a flat list where the user picks one value, use [Select](/ui/components/select). For a flat list of titled sections that each show content, use [Accordion](/ui/components/accordion).

`TreeView` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Move with Up and Down, press Right and Left to expand and collapse, and press Enter to select.

<TerminalDemo demo="tree-view-basic" title="TreeView — project files" />

## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {TreeView, type TreeViewNode} from '@nemesis-oss/termina-ui';

const project: TreeViewNode[] = [
	{
		label: 'src',
		children: [{label: 'index.ts'}, {label: 'utils.ts'}],
	},
	{label: 'package.json'},
];

function Project() {
	const {exit} = useApp();

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Project (up and down to move, enter to select)</Text>
			<TreeView
				nodes={project}
				onSelect={(_label, path) => {
					console.log(path.join('/'));
					exit();
				}}
			/>
		</Box>
	);
}

render(<Project />);
```

`onSelect` receives the label and the path of the node where Enter was pressed. This example prints that path and exits on the first Enter.

## Props

`TreeViewProps` is exported from `@nemesis-oss/termina-ui`. `TreeViewNode` is also exported. It has the shape `{label: string; children?: TreeViewNode[]}`. A node with at least one child is a branch. A node with no `children`, or with an empty array, is a leaf.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `nodes` | `TreeViewNode[]` | Required | Tree data, in display order. Sibling labels should be unique, because a label path identifies a node. |
| `defaultExpanded` | `boolean` | `true` | Whether branches start expanded. Read once at mount, so later changes are ignored. |
| `onSelect` | `(label: string, path: string[]) => void` | `undefined` | Called when Enter is pressed on any node. `path` lists the labels from the root to the node, including its own label. |
| `isActive` | `boolean` | `true` | When false, key input is ignored. The tree still renders. |

## Keyboard

| Key | Effect |
| --- | --- |
| Up | Focuses the previous visible row. Focus does not wrap from the first row to the last. |
| Down | Focuses the next visible row. Focus does not wrap from the last row to the first. |
| Right | On a collapsed branch, expands it and keeps focus on it. On an expanded branch, focuses its first child. On a leaf, does nothing. |
| Left | On an expanded branch, collapses it and keeps focus on it. On a collapsed branch or a leaf, focuses its parent. On a top-level node that is not an expanded branch, does nothing. |
| Enter | Calls `onSelect` with the focused node's label and path, and toggles the focused branch. On a leaf, calls `onSelect` only. |
| Any other key | Ignored. |

When `isActive` is false, no key has an effect and `onSelect` is not called. The tree still renders, and the focused row keeps its highlight. Keys are read only when stdin supports raw mode, so the tree also renders under piped stdin and ignores keys there.

## Theme keys

The component reads the `TreeView` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'` |
| `styles.node` | `{isFocused}` | Text props, applied to the label of every node: `color` of `'blue'` when focused, otherwise `{}` |
| `styles.guide` | none | Text props: `dimColor` of `true`. Applied to the `│`, `├` and `└` guides. |
| `styles.branch` | `{isExpanded}` | Text props, applied to the triangle of a branch: `dimColor` of `true` when collapsed and `false` when expanded |
| `styles.leaf` | none | Text props: `{}`. Applied to leaf labels only, under the `node` props, so the focus color still wins. |

The glyphs are set in the component, so the theme controls only their colors. A branch shows `figures.triangleDown` when expanded and `figures.triangleRight` when collapsed. When the terminal does not support Unicode, `figures` uses `►` for the collapsed triangle, and `▼` is the same in both modes. The guides are the box-drawing characters `│`, `├` and `└`, and are fixed in the component.

`TreeView` has no config keys.

## Edge cases

- Empty `nodes` renders nothing. Keys do nothing, and `onSelect` is not called.
- A node with an empty `children` array is a leaf. It shows no triangle, and Right does nothing to it.
- `defaultExpanded` is read once at mount. A later change has no effect, and branches the user has not toggled keep their state.
- A branch added to `nodes` after mount starts with the `defaultExpanded` value from mount.
- Expansion is kept by label path, so a rerender with the same paths keeps each branch expanded or collapsed.
- If `nodes` shrinks past the focused row, focus moves to the last row.
- Sibling nodes with the same label share one expansion state, so toggling one toggles the other.
- `onSelect` is called once per Enter press, including the press that toggles a branch.
