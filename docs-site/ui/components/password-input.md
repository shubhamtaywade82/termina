---
outline: [2, 3]
---

# PasswordInput

`PasswordInput` is a single-line field for a secret, such as a password or an API key. Each character is shown as `*`, one asterisk per grapheme cluster. The callbacks receive the raw value, not the mask. Use it when the typed text must not be visible on screen. For other text, use [TextInput](/ui/components/text-input).

`PasswordInput` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Type any key and press Enter to submit it.

<TerminalDemo demo="password-input-basic" title="PasswordInput — masked entry" />

## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {PasswordInput} from '@nemesis-oss/termina-ui';

function Login() {
	const {exit} = useApp();

	return (
		<Box flexDirection="column" gap={1}>
			<Text>API key</Text>
			<PasswordInput
				placeholder="Paste your key"
				onSubmit={() => {
					// `onSubmit` receives the raw key. Pass it to your client here.
					exit();
				}}
			/>
		</Box>
	);
}

render(<Login />);
```

## Props

`PasswordInputProps` is exported from `@nemesis-oss/termina-ui`. The component has no `defaultValue` prop. The field always starts empty.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isDisabled` | `boolean` | `false` | When true, key input is ignored. The mask is shown without a cursor. |
| `placeholder` | `string` | `''` | Text shown when the value is empty. It is not masked. The first character is drawn as the cursor and the rest is dimmed. |
| `onChange` | `(value: string) => void` | `undefined` | Called after the value changes, with the raw value. |
| `onSubmit` | `(value: string) => void` | `undefined` | Called on Enter with the raw value. |

## Masking

- The mask has one `*` for each grapheme cluster. A cluster is the unit the cursor moves by. An emoji, or a letter followed by a combining mark, is one `*`.
- The cursor is drawn as an inverted `*` over the cluster it is on. At the end of the value, it is an inverted space.
- The component keeps the raw value in its state and passes it to `onChange` and `onSubmit`. The mask is display only.

## Keyboard

| Key | Effect |
| --- | --- |
| Text, including pasted text | Control characters are removed. The rest is inserted at the cursor. |
| Enter | Calls `onSubmit` with the raw value. |
| Left, Right | Move the cursor by one grapheme cluster. |
| Backspace (DEL or BS) | Deletes the grapheme cluster before the cursor. No effect at the start of the value. |
| Delete (the `ESC [ 3 ~` sequence) | Deletes the grapheme cluster after the cursor. No effect at the end of the value. |
| Up, Down, Tab, Shift+Tab | Ignored. |
| Ctrl or Alt (Meta) with a text key, such as Ctrl+A or Alt+B | Ignored. |
| Ctrl+C | Ignored by the field. |

When `isDisabled` is true, the key handler is inactive and the value cannot change.

## Theme keys

The component reads the `PasswordInput` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.value` | none | Text props: none (`{}`) |

The mask character and the cursor style are fixed in the input hook. They are not theme keys.

## Edge cases

- Pasted control characters are removed before the text is inserted. Pasting `ab`, a line feed, `cd`, a tab, and `ef` inserts `abcdef`.
- Ctrl+A and a line feed on their own insert nothing.
- Moving the cursor over an emoji highlights the whole emoji. One Backspace removes the whole emoji from the mask and from the value.
- A submitted value keeps its characters intact. For example, `😀` is submitted as `😀` while the field shows one `*`.
- An empty field submits an empty string.
- If the parent re-renders with a new `onChange` function, `onChange` runs again with the current value. Wrap the callback in `useCallback` to avoid this.
