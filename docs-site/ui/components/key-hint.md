---
outline: [2, 3]
---

# KeyHint

`KeyHint` shows one keyboard shortcut: the key label in inverse text, then what the key does in dim text. Use it in a footer or help line that lists the keys a screen responds to. It does not handle keys itself. To respond to keys, use a component such as [Select](/ui/components/select) or [MultiSelect](/ui/components/multi-select), or call `useInput` from `@nemesis-oss/termina-core`. Unlike [Badge](/ui/components/badge), which fills its label with a background color, `KeyHint` uses inverse video for the key and dim text for the action.

`KeyHint` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The hints and the list are static in this preview, so no key changes what is shown.

<TerminalDemo demo="key-hint-basic" title="KeyHint — restart services" />

## Usage

```tsx
import {Box, render} from '@nemesis-oss/termina-core';
import {KeyHint} from '@nemesis-oss/termina-ui';

function Footer() {
	return (
		<Box gap={3}>
			<KeyHint keys="↑↓" label="navigate" />
			<KeyHint keys="Enter" label="select" />
			<KeyHint keys="Ctrl+C" label="quit" />
		</Box>
	);
}

render(<Footer />);
```

Place several `KeyHint` components in a row `Box` to lay them out side by side, as above.

## Props

`KeyHintProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `keys` | `string` | Required | Key label, such as `Ctrl+C`. Shown exactly as given, in inverse text with one space of padding on each side. |
| `label` | `string` | Required | What the key does, such as `quit`. Shown in dim text after the key label. |

## Theme keys

The component reads the `KeyHint` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `gap: 1`. This is the space between the key label and the label. |
| `styles.key` | none | Text props: `inverse: true` |
| `styles.label` | none | Text props: `dimColor: true` |

The one space of padding on each side of the key label is part of the text, not a theme key, so the inverse style covers it.

`KeyHint` has no config keys.

## Edge cases

- `keys` and `label` are shown as given. The component does not change case, so `ctrl+c` renders as `ctrl+c`.
- An empty `label` renders no label text, but the gap after the key block is still there, so one blank column separates the key block from content placed after the hint.
- An empty `keys` renders a two-space inverse block, followed by the label.
- Changing `keys` or `label` after mount updates the row. The component keeps no state.
