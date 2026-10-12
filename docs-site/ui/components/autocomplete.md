---
outline: [2, 3]
---

# Autocomplete

`Autocomplete` is a single-line input with a list of suggestions below it. The list shows the options that contain the typed text, ignoring case, and the user moves through the rows with Up and Down and takes one with Enter. Use it when the user types part of a value and picks the rest from a known set, such as a package name. [TextInput](/ui/components/text-input) completes the value inline from its start and shows no list. [Select](/ui/components/select) shows a list but cannot filter it by typing.

`Autocomplete` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Type to filter the packages, move with Up and Down, and press Enter to choose.

<TerminalDemo demo="autocomplete-basic" title="Autocomplete — package search" />

## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {Autocomplete} from '@nemesis-oss/termina-ui';

const packages = ['express', 'fastify', 'react', 'react-dom', 'typescript', 'vite'];

function Install() {
	const {exit} = useApp();

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Package (type to filter, enter to choose)</Text>
			<Autocomplete
				options={packages}
				placeholder="Search packages..."
				onSubmit={value => {
					console.log(value);
					exit();
				}}
			/>
		</Box>
	);
}

render(<Install />);
```

Enter accepts the highlighted row and hides the list, so a second Enter calls `onSubmit` with the accepted text.

## Props

`AutocompleteProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `string[]` | Required | Candidate values. A value is listed when it contains the input text, ignoring case. Listed values keep the order of `options`. |
| `defaultValue` | `string` | `''` | Initial input value, read at mount. A non-empty value opens the list at mount. Later changes are ignored. |
| `placeholder` | `string` | `''` | Text shown while the input is empty. |
| `limit` | `number` | `5` | Maximum number of rows in the list. Only these rows can be highlighted. |
| `isDisabled` | `boolean` | `false` | When true, key input is ignored and no row is highlighted. |
| `onChange` | `(value: string) => void` | `undefined` | Called with the value after each change to it, including when Enter accepts a row that changes it. |
| `onSubmit` | `(value: string) => void` | `undefined` | Called with the input value when Enter is pressed and no row is highlighted. |

## Keyboard

| Key | Effect |
| --- | --- |
| Typing | Inserts the text at the cursor and moves the highlight to the first match. |
| Left, Right | Move the cursor by one grapheme cluster, so an emoji is crossed in one step. |
| Backspace | Deletes the grapheme before the cursor. |
| Delete | Deletes the grapheme after the cursor. |
| Up | Moves the highlight to the previous row. Does not wrap from the first row to the last. |
| Down | Moves the highlight to the next row. Does not wrap from the last row to the first. |
| Enter | With a row highlighted, sets the value to that row and hides the list. Calls `onChange` when the value changes. With no row highlighted, calls `onSubmit` with the input value. |
| Any other key | Ignored, including Tab and Escape. |

When `isDisabled` is true, no key has an effect and no row is highlighted, so the rows show without the pointer.

## Theme keys

The component reads the `Autocomplete` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'` |
| `styles.input` | none | Text props: none set. The input text takes the surrounding style. |
| `styles.option` | `{isHighlighted}` | Text props: `color: 'blue'` when `isHighlighted` is true, otherwise no color. The row's pointer glyph is `figures.pointer` and is set in the component. |
| `styles.noMatches` | none | Text props: `dimColor: true` |

`Autocomplete` has no config keys.

## Edge cases

- An empty input shows no list. A non-empty `defaultValue` opens the list at mount, and a later `defaultValue` is ignored.
- Only the first `limit` matches are listed, so a later match cannot be highlighted. Type more text to narrow the list.
- Matching is a substring test, so `rea` matches `preact`. The accepted row keeps its own spelling: after typing `red`, Enter accepts `Redux`.
- If nothing matches, the list shows a dimmed `No matches` row. Enter then calls `onSubmit` with the typed text.
- After Enter accepts a row, the list stays hidden until the next edit, so cursor moves do not reopen it. A second Enter calls `onSubmit` with the accepted text.
- Accepting a row whose text equals the input does not call `onChange`, because the value did not change.
- `onChange` runs from an effect keyed on the value, not on the callback. A parent that passes a new callback on each render does not receive the last change again.
- Changing `options` after mount updates the list on the next render, and the input keeps its value.
- Control characters in pasted text are removed before insertion, as in `TextInput`.
- When stdin cannot enter raw mode, as with piped input, the input shows no cursor, keys are not read, and the list still renders with its first row marked by the pointer.
