---
outline: [2, 3]
---

# Dialog

`Dialog` is a bordered box with a bold title, content, and an optional footer that reads `Esc to close`. Use it to group content, such as a message or an input, under a title inside the normal layout. It is not a modal in the usual sense: it does not overlay other content and does not trap focus, so the rest of the app keeps receiving keys while it is open. [Alert](/ui/components/alert) is the closest component. It is also a bordered box, but it shows one text message with an icon for its variant and handles no keys. [ConfirmInput](/ui/components/confirm-input) asks a yes-or-no question and has no border.

`Dialog` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Press `Esc` to close the dialog.

<TerminalDemo demo="dialog-basic" title="Dialog — confirmation" />

## Usage

```tsx
import {useState} from 'react';
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {Dialog} from '@nemesis-oss/termina-ui';

function Cleanup() {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Build finished.</Text>
			{isOpen && (
				<Dialog title="Delete build output?" onClose={() => setIsOpen(false)}>
					<Text>Remove the 42 files in ./dist. This cannot be undone.</Text>
				</Dialog>
			)}
		</Box>
	);
}

render(<Cleanup />);
```

Escape calls `onClose`, and the dialog stays on screen until the parent stops rendering it, as `isOpen` does here.

## Props

`DialogProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | Required | Title, shown on the first line inside the border. |
| `children` | `ReactNode` | Required | Content, stacked in one column below the title. Wrap text in `Text`. |
| `onClose` | `() => void` | `undefined` | Called when the user presses Escape. When omitted, Escape is ignored and the footer is hidden. |
| `width` | `number` | Fills the parent | Width in columns, including the border. See Edge cases for the default. |

## Keyboard

| Key | Effect |
| --- | --- |
| Escape | Calls `onClose`. The dialog stays rendered, so the parent must stop rendering it to hide it. |
| Any other key | Ignored. Other components still receive it. |

When `onClose` is omitted, the key handler is off: no key has an effect and the footer is hidden.

## Theme keys

The component reads the `Dialog` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'`, `borderStyle: 'round'`, `borderColor: 'blue'`, `gap: 1`, `paddingX: 1` |
| `styles.title` | none | Text props: `bold: true` |
| `styles.body` | none | Box props: `flexDirection: 'column'` |
| `styles.footer` | none | Text props: `dimColor: true` |

`Dialog` has no config keys.

## Edge cases

- The dialog renders in normal flow. It takes its own rows in the parent's column and does not cover the content above or below it.
- The dialog does not trap focus. Other input handlers still receive keys, including Escape, while it is mounted.
- Escape does not hide the dialog. After `onClose` runs, the dialog renders as before until the parent stops rendering it.
- Adding `onClose` after mount shows the footer and enables Escape. Removing it hides the footer and disables Escape.
- When `width` is omitted, the dialog fills the width of a column parent, and the terminal width at the root. Inside a row parent it is only as wide as its content, because it does not grow along the row.
- With `width` set, long text in the title or the content wraps inside the border and the box keeps that width.
- With stdin that is not a TTY, such as piped input, the dialog renders and the footer still shows, but Escape is not read because raw mode is unavailable.
