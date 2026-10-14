---
outline: [2, 3]
---

# EmailInput

`EmailInput` is a single-line field for an email address. After an `@`, it suggests a domain from a list of common providers, and Enter accepts the suggestion. It does not check the address format. Use it when the input is an email address and the suggestion saves typing. For free text, use [TextInput](/ui/components/text-input). For a secret, use [PasswordInput](/ui/components/password-input).

`EmailInput` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Type a name, then `@` to cycle through the offered domains.

<TerminalDemo demo="email-input-basic" title="EmailInput — domain completion" />

## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {EmailInput} from '@nemesis-oss/termina-ui';

function Signup() {
	const {exit} = useApp();

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Email address</Text>
			<EmailInput
				placeholder="name@example.com"
				onSubmit={address => {
					console.log(address);
					exit();
				}}
			/>
		</Box>
	);
}

render(<Signup />);
```

## Props

`EmailInputProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isDisabled` | `boolean` | `false` | When true, key input is ignored. The value is shown without a cursor. |
| `placeholder` | `string` | `''` | Text shown when the value is empty. The first character is drawn as the cursor and the rest is dimmed. |
| `defaultValue` | `string` | `''` | Initial value. The cursor starts at the end of it. |
| `domains` | `string[]` | See below | Domains to suggest after `@`. |
| `onChange` | `(value: string) => void` | `undefined` | Called after the value changes. |
| `onSubmit` | `(value: string) => void` | `undefined` | Called on Enter with the value. |

The default `domains` list is `aol.com`, `gmail.com`, `yahoo.com`, `hotmail.com`, `live.com`, `outlook.com`, `icloud.com`, and `hey.com`.

## Keyboard

| Key | Effect |
| --- | --- |
| Text, including pasted text | Inserted at the cursor. A second `@` is rejected when the value already contains one. |
| Enter | Accepts the suggestion, if one is shown, then calls `onSubmit`. |
| Left, Right | Move the cursor by one UTF-16 code unit. Clamped at the start and the end. |
| Backspace or Delete | Delete the UTF-16 code unit before the cursor. At the start of the value, where no unit precedes the cursor, the first code unit of the value is deleted instead. Both keys do the same thing. |
| Up, Down, Tab, Shift+Tab | Ignored. |
| Ctrl+C | Ignored. |
| Keys with no text, such as Home, End, Escape, and function keys | No change. |

When `isDisabled` is true, the key handler is inactive and the value cannot change.

## Suggestions

The suggestion is the first entry in `domains` that starts with the text after the first `@` in the value. The part already typed is removed from the suggestion. Typing only `@` suggests the first entry in `domains`.

The suggestion is drawn dimmed after the end of the value, even when the cursor is elsewhere in the value. When the cursor is at the end, the first character of the suggestion is drawn as the cursor.

## Theme keys

The component reads the `EmailInput` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.value` | none | Text props: none (`{}`) |

The cursor (inverse) and the suggestion (dimmed) are drawn with fixed styles in the input hook. They are not theme keys.

## Edge cases

- Enter accepts a suggestion by appending it to the end of the value and moving the cursor there, wherever the cursor was. `onChange` is called with the completed value, then `onSubmit` with the same value, so the two always match.
- Editing works on UTF-16 code units, not on grapheme clusters. Left and Right move one code unit. A character outside the Basic Multilingual Plane, such as most emoji, takes two presses. Backspace removes one code unit, so it can leave half of a surrogate pair in the value. When the cursor sits between the two halves, the inverse cursor is drawn on the character after the emoji. No cursor is drawn only when the split pair is at the end of the value. [PasswordInput](/ui/components/password-input) edits by grapheme cluster.
- Control characters are not filtered. A key that sends one inserts it. Ctrl+J sends a line feed, and it is inserted into the value.
- A key with Ctrl and a letter inserts the letter. Ctrl+A inserts `a`.
- The guard against a second `@` checks the current value. Pasting `a@b@c` into an empty field inserts the whole text, with two `@` characters.
- The address is not validated. `onSubmit` receives an empty string when Enter is pressed on an empty field.
- `onChange` is called once per change, synchronously from the key that made it. A burst of keys in one read reports each change, in order. A new callback on each render does not repeat the last call.
