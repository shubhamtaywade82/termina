---
outline: [2, 3]
---

# TextInput

`TextInput` is a single-line editor. It shows the value with a cursor, an optional placeholder, and an optional completion taken from `suggestions`. Use it for one line of text, such as a name, a path, or a search query. The cursor, Backspace, and Delete work on grapheme clusters, so an emoji or a letter with a combining mark is moved over and deleted as one unit.

`TextInput` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Type `de` to see the completion, then press Enter to accept it.

<TerminalDemo demo="text-input-basic" title="TextInput — suggestions" />


## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {TextInput} from '@nemesis-oss/termina-ui';

const commands = ['deploy', 'destroy', 'status'];

function Prompt() {
	const {exit} = useApp();

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Command</Text>
			<TextInput
				placeholder="type a command"
				suggestions={commands}
				onSubmit={command => {
					console.log(`Running ${command}`);
					exit();
				}}
			/>
		</Box>
	);
}

render(<Prompt />);
```

`onSubmit` receives the value when the user presses Enter. The example exits after the callback runs. Typing `de` shows `ploy` as a completion, and Enter accepts it.

## Props

`TextInputProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isDisabled` | `boolean` | `false` | When true, key input is ignored, no cursor is drawn, and no completion is shown. |
| `placeholder` | `string` | `''` | Text drawn when the value is empty. See Placeholder and disabled state below. |
| `defaultValue` | `string` | `''` | Value at mount. The cursor starts at its end. Read once, so later changes have no effect. Ignored when `value` is set. |
| `value` | `string` | `undefined` | Controlled value. The parent owns the text: each edit is reported through `onChange`, and the input shows this value until the parent changes it. See Controlled value below. |
| `suggestions` | `string[]` | `undefined` | Complete values to offer as a completion. See Suggestions below. |
| `onChange` | `(value: string) => void` | `undefined` | Called with the new value after each change to the value. |
| `onSubmit` | `(value: string) => void` | `undefined` | Called with the value when Enter is pressed. |

## Keyboard

| Key | Effect |
| --- | --- |
| Printable characters | Inserted at the cursor. |
| Left, Right | Move the cursor by one grapheme. |
| Backspace | Deletes the grapheme before the cursor. Most terminals send it as `0x7F`. `0x08` (Ctrl+H) also deletes. |
| Delete | Deletes the grapheme after the cursor. Most terminals send it as `ESC [ 3 ~`. |
| Enter | Calls `onSubmit` with the value. The value is not cleared. |
| Up, Down, Tab, Shift+Tab | Not used by the editor. |
| Escape | No effect on the value. |
| Other Ctrl and Meta chords | Ignored. Nothing is inserted. For example, Ctrl+A and Ctrl+C insert nothing. |

Left, Right, Backspace, Delete, and Enter work with or without Ctrl or Meta. Ctrl+Left, for example, moves the cursor by one grapheme, not by one word.

A line feed (byte `0x0A`, which is usually sent by Ctrl+J) does not submit and inserts nothing.

Text that arrives in one input event, such as a paste, is inserted as one string. Unicode control characters are removed from it first, including newlines and tabs. Pasting `x`, a newline, and `y` inserts `xy`.

## Editing by grapheme

The cursor is an index into the value, counted in UTF-16 code units. The editor finds grapheme boundaries with `Intl.Segmenter` at `granularity: 'grapheme'`. Movement and deletion step between those boundaries, so:

- Left and Right step over an emoji such as `😀` in one move, even though it is two UTF-16 code units.
- Backspace removes a whole emoji before the cursor, not half of its surrogate pair.
- Backspace removes a letter together with the combining mark that belongs to it.

## Suggestions

`suggestions` is a list of complete values. The editor takes the first entry that starts with the current value. The match is case-sensitive. The editor removes the value from the start of that entry and shows the rest dimmed after the value. When the cursor is at the end, the first character of the rest is drawn with the cursor on it.

- Enter accepts the completion. The editor appends it to the end of the value and moves the cursor there. `onChange` is called with the completed value, then `onSubmit` is called with the same value. Right and Tab do not accept it.
- Only the first matching entry is used. If that entry equals the current value, the completion is empty and nothing is shown, even when a later entry extends the value. With `['app', 'apple']`, the input `app` shows no completion. With `['apple', 'app']`, it shows `le`.
- No completion is shown when the value is empty or when `isDisabled` is true.
- The cursor position does not change where the completion goes. It is always appended to the end, so the text in the input matches the value passed to `onSubmit`.

## Controlled value

Pass `value` to let the parent own the text. The input shows `value`, and each edit calls `onChange` with the next value. The input does not change until the parent passes a new `value`:

```tsx
const [name, setName] = useState('');

<TextInput value={name} onChange={setName} />;
```

- A key the parent does not store leaves the display and the cursor unchanged. The next key in the same read starts from the value the parent holds.
- The cursor stays where the user left it. If an external change makes the value shorter than that position, the cursor moves to the new end. A cursor inside a character made of several code units moves to the start of that character.
- With `value` and no `onChange`, the input is read-only.
- Store the new value in `onChange` synchronously. A parent that stores it later, in a timer or a transition, counts as having refused the key, so the caret stays put. Under `concurrent` rendering, a transition can also commit after later keystrokes and revert them.

## Placeholder and disabled state

- With an empty value and the input enabled, the first character of `placeholder` is drawn with the cursor on it, and the rest is dimmed. Without a placeholder, the cursor is drawn as one inverse space.
- With `isDisabled`, the placeholder is dimmed and no cursor is drawn. Without a placeholder, an empty disabled input draws nothing.
- With `isDisabled`, the value is drawn without a cursor.

## Callbacks

- `onChange` is called once per change to the value, synchronously from the key that made it. A burst of keys in one read reports each change, in order. It is not called on mount, for cursor movement, or for a key that leaves the value unchanged, such as Backspace at the start.
- `onSubmit` is called with the current value. An empty value is passed as `''`.
- A new `onChange` function on each render does not repeat the last call, so wrapping the callback in `useCallback` is not needed.

## Theme keys

The component reads the `TextInput` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.value` | none | Text props: `{}`. This is the only style key. |

The cursor, placeholder, and completion styles (inverse and dim) are set in the component and are not read from the theme. `TextInput` has no config keys.

## Edge cases

- `defaultValue` is read once. Changing it later does not change the value.
- Inserting a zero-width joiner between two pictographic characters, such as two emoji, merges them into one grapheme, and the cursor can then sit inside it with no cursor drawn. A ZWJ between other characters attaches to the preceding grapheme and does not merge the two. Pressing Left moves the cursor to the start of the merged grapheme, and the cursor is drawn again.
