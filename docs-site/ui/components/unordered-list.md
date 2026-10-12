---
outline: [2, 3]
---

# UnorderedList

`UnorderedList` renders items, each preceded by a marker. Lists nest: a list inside an item is indented under that item, and each depth can use its own marker. Use it for items that have no order. For numbered items, use [OrderedList](/ui/components/ordered-list).

`UnorderedList` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

<TerminalDemo demo="unordered-list-basic" title="UnorderedList — nested features" />

## Usage

```tsx
import {Text, render} from '@nemesis-oss/termina-core';
import {UnorderedList} from '@nemesis-oss/termina-ui';

function Features() {
	return (
		<UnorderedList>
			<UnorderedList.Item>
				<Text>Fast startup</Text>
			</UnorderedList.Item>
			<UnorderedList.Item>
				<Text>Keyboard input</Text>
				<UnorderedList>
					<UnorderedList.Item>
						<Text>Arrow keys</Text>
					</UnorderedList.Item>
					<UnorderedList.Item>
						<Text>Enter to submit</Text>
					</UnorderedList.Item>
				</UnorderedList>
			</UnorderedList.Item>
		</UnorderedList>
	);
}

render(<Features />);
```

`UnorderedList.Item` is a property of `UnorderedList`, so import only `UnorderedList`.

## Props

`UnorderedListProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | List items. Use `UnorderedList.Item` for each one. |

`UnorderedList.Item` takes one prop.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | Item content. It is rendered inside a `Box`, so wrap text in `Text`. A bare string makes the render throw `Text string "..." must be rendered inside <Text> component`, so wrap every string in `Text`. |

`UnorderedListItemProps` is not exported from `@nemesis-oss/termina-ui`.

## Markers

The marker is a single string. It is drawn with the `marker` style, which is dimmed, and one column of space follows it. The default marker is `figures.line`, which is `─` in both the Unicode and fallback sets of `figures`.

The `marker` config value can be a string, which is used at every depth, or an array, which is indexed by depth. Depth 0 is the outermost list. When the array has no entry for a depth, the last entry is used. An empty array falls back to `figures.line`.

```tsx
import {Text, render} from '@nemesis-oss/termina-core';
import {
	ThemeProvider,
	UnorderedList,
	defaultTheme,
	extendTheme,
} from '@nemesis-oss/termina-ui';

const theme = extendTheme(defaultTheme, {
	components: {
		UnorderedList: {
			config: () => ({
				marker: ['■', '–'],
			}),
		},
	},
});

function Features() {
	return (
		<ThemeProvider theme={theme}>
			<UnorderedList>
				<UnorderedList.Item>
					<Text>Top level</Text>
					<UnorderedList>
						<UnorderedList.Item>
							<Text>Nested</Text>
						</UnorderedList.Item>
					</UnorderedList>
				</UnorderedList.Item>
			</UnorderedList>
		</ThemeProvider>
	);
}

render(<Features />);
```

This example draws `■` at depth 0 and `–` at depth 1.

## Theme keys

The component reads the `UnorderedList` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.list` | none | Box props: `flexDirection: 'column'` |
| `styles.listItem` | none | Box props: `gap: 1` |
| `styles.marker` | none | Text props: `dimColor: true` |
| `styles.content` | none | Box props: `flexDirection: 'column'` |
| `config()` | none | `marker`: a `string`, or a `string[]` indexed by depth. The default is `figures.line`. |

A `config` override replaces the whole function, so it must return `marker`. [Theming](/ui/theming) describes how overrides merge.

## Layout

Items stack vertically. Item content starts after the marker and one column of gap. A nested list is therefore indented by the width of the marker plus one column. With the default marker, a nested list starts two columns in.

## Edge cases

- Depth counts from the outermost list. A list inside an item is one level deeper than the list that holds the item.
- An item rendered outside any `UnorderedList` uses the default marker.
- An empty list renders no output.
