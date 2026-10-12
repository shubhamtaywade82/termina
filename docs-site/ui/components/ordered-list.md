---
outline: [2, 3]
---

# OrderedList

`OrderedList` renders its items with numbered markers: `1.`, `2.`, and so on. A nested `OrderedList` inside an item uses the parent number in its markers, such as `2.1.`. Use it for steps, ranked items, or any list where the position matters. For a list without numbers, read the [UnorderedList](/ui/components/unordered-list) page.

`OrderedList` is exported from `@nemesis-oss/termina-ui`. Its items are `OrderedList.Item`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

<TerminalDemo demo="ordered-list-basic" title="OrderedList — nested steps" />

## Usage

```tsx
import {Text, render} from '@nemesis-oss/termina-core';
import {OrderedList} from '@nemesis-oss/termina-ui';

function Plan() {
	return (
		<OrderedList>
			<OrderedList.Item>
				<Text>Install dependencies</Text>
			</OrderedList.Item>

			<OrderedList.Item>
				<Text>Build the packages</Text>

				<OrderedList>
					<OrderedList.Item>
						<Text>Build core</Text>
					</OrderedList.Item>

					<OrderedList.Item>
						<Text>Build ui</Text>
					</OrderedList.Item>
				</OrderedList>
			</OrderedList.Item>

			<OrderedList.Item>
				<Text>Run the tests</Text>
			</OrderedList.Item>
		</OrderedList>
	);
}

render(<Plan />);
```

## Props

`OrderedListProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | List items. Only direct `OrderedList.Item` children are items. |

`OrderedList.Item` takes the following prop. Its props type is not exported from `@nemesis-oss/termina-ui`, so reach it only through `OrderedList.Item`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | Item content. It is rendered in a column. Pass strings inside a `Text` element. |

## Keyboard

`OrderedList` takes no input and registers no key handler.

## Theme keys

The component reads the `OrderedList` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.list` | none | Box props: `flexDirection: 'column'` |
| `styles.listItem` | none | Box props: `gap: 1`. The gap separates the marker from the content. |
| `styles.marker` | none | Text props: `dimColor: true` |
| `styles.content` | none | Box props: `flexDirection: 'column'` |

## Edge cases

- Numbers are padded to the width of the largest number in the list. A list of ten items shows ` 1.` through `10.`, so the content lines up.
- A nested list is indented to the column where the parent item's content starts. The indent is the width of the parent marker plus one column of gap.
- A child that is not an `OrderedList.Item` is rendered as it is, and it still takes a number in the sequence. Text, a conditional `false`, a `null`, and a fragment all take a number. For example, `<Text>note</Text>` between two items makes the second item `3.`.
- An item wrapped in a custom component, or placed inside a fragment, is not numbered and gets no marker provider of its own. Outside any numbered item, it renders with the default marker, `figures.line`. Inside a numbered item, it renders that enclosing item's marker, such as `1.`.
