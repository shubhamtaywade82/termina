---
outline: [2, 3]
---

# MultilineTextInput

`MultilineTextInput` is an editor for several lines of text. It is `rows` lines high and shows its own caret. Enter inserts a newline, so Ctrl+D submits the value. Use it for a message, a note, or a block of text that a single line cannot hold. The cursor, Backspace, and Delete work on grapheme clusters, so an emoji or a letter with a combining mark is moved over and deleted as one unit. Lines are not wrapped in this version. A line longer than the editor is cut at the right edge, and the editor scrolls so the caret stays in view.

`MultilineTextInput` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the single-line editor, see [TextInput](/ui/components/text-input). For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Type a few lines. Enter starts a new line, and Ctrl+D saves. The message below the editor shows how many lines were saved.

<TerminalDemo demo="multiline-text-input-basic" title="MultilineTextInput — release notes" />


## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {MultilineTextInput} from '@nemesis-oss/termina-ui';

function Notes() {
	const {exit} = useApp();

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Release notes. Ctrl+D saves.</Text>
			<MultilineTextInput
				rows={6}
				placeholder="One change per line"
				onSubmit={notes => {
					console.log(notes);
					exit();
				}}
			/>
		</Box>
	);
}

render(<Notes />);
```

`onSubmit` receives the whole value, with a `\n` between lines, when Ctrl+D is pressed. The example exits after the callback runs.

## Props

`MultilineTextInputProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `number` | `5` | Number of lines the editor shows. The value scrolls vertically to keep the caret line visible. Values below `1` are raised to `1`. See Scrolling below. |
| `isDisabled` | `boolean` | `false` | When true, key input and paste are ignored, no cursor is drawn, and the placeholder is dimmed. |
| `placeholder` | `string` | `''` | Text drawn when the value is empty. See Placeholder and disabled state below. |
| `defaultValue` | `string` | `''` | Value at mount. The cursor starts at its end. Read once, so later changes have no effect. Ignored when `value` is set. |
| `value` | `string` | `undefined` | Controlled value. The parent owns the text: each edit is reported through `onChange`, and the input shows this value until the parent changes it. See Controlled value below. |
| `onChange` | `(value: string) => void` | `undefined` | Called with the new value after each change to the value. |
| `onSubmit` | `(value: string) => void` | `undefined` | Called with the value when Ctrl+D is pressed. |

## Keyboard

| Key | Effect |
| --- | --- |
| Printable characters | Inserted at the cursor. |
| Enter | Inserts a newline. It does not submit. |
| Ctrl+J (line feed, byte `0x0A`) | Inserts a newline, the same as Enter. |
| Ctrl+D | Calls `onSubmit` with the value. The value is not cleared. |
| Left, Right | Move the cursor by one grapheme. At the end of a line, they cross the line feed. |
| Up, Down | Move the cursor to the line above or below. The cursor keeps the column it started from. See Moving between lines below. |
| Home, End | Move the cursor to the start or end of the current line. |
| Backspace | Deletes the grapheme before the cursor. At the start of a line, it removes the line feed before it. Most terminals send it as `0x7F`. `0x08` (Ctrl+H) also deletes. |
| Delete | Deletes the grapheme after the cursor. At the end of a line, it removes the line feed after it. Most terminals send it as `ESC [ 3 ~`. |
| Tab, Shift+Tab | Ignored by the editor. |
| Escape | No effect on the value. |
| Other Ctrl and Meta chords | Ignored. Nothing is inserted. For example, Ctrl+A and Ctrl+E insert nothing. |
| Other keys, such as Page Up | Ignored. |

Left, Right, Up, Down, Home, End, Backspace, Delete, and Enter work with or without Ctrl or Meta. Ctrl+Left, for example, moves the cursor by one grapheme, not by one word.

## Editing by grapheme and line

The cursor is an index into the value, counted in UTF-16 code units. The editor finds grapheme boundaries with `Intl.Segmenter` at `granularity: 'grapheme'`. Movement and deletion step between those boundaries, so:

- Left and Right step over an emoji such as `😀` in one move, even though it is two UTF-16 code units.
- Backspace removes a whole emoji before the cursor, not half of its surrogate pair.
- Backspace removes a letter together with the combining mark that belongs to it.

Left, Right, Backspace, and Delete treat a line feed as one step. In the value `ab`, line feed, `cd`, one Left press moves the cursor from the start of `cd` to the end of `ab`, across the line feed.

### Moving between lines

Up and Down move the cursor to the line above or below. The editor measures the column in terminal cells, not in characters, so a wide character takes two cells. The cursor lands on the grapheme boundary whose column is closest to the start column without going past it, or at the end of a shorter line.

The editor keeps that start column across consecutive Up and Down moves. A short line does not reset it, so Up, Down returns to the original column. Any other key resets it, including Left, Right, Home, End, and every edit.

## Paste

When an enabled `MultilineTextInput` is mounted, it takes paste through `usePaste`. A paste is inserted at the cursor as one edit, so `onChange` is called once with the new value. The editor keeps line feeds, and it sanitises the pasted text first:

- CRLF and CR become LF.
- A tab becomes four spaces.
- Other control characters, and DEL, are removed.

A disabled editor ignores paste. While an enabled editor is mounted, a `useInput` listener does not receive paste. See [usePaste()](/api/core#usepaste) and [Keyboard and Focus](/guide/keyboard-and-focus).

Typed text is sanitised with the same rules. A tab that reaches the editor as text becomes four spaces, and other control characters are dropped.

## Scrolling

The editor is `rows` lines high. The first visible line changes only as far as needed to keep the caret line on screen. If the value gets shorter, the first visible line moves up with it.

Horizontally, the editor has one offset for the whole block, not one per line. The offset is `max(0, caret column - (width - 1))`, where `width` is the editor's width in cells. The caret is therefore the last cell shown when the caret is past the right edge. Before the first layout, when the width is not known yet, the offset is `0`.

A wide character cut by the left or right edge is drawn as spaces, so a row never wraps onto the next line.

## Controlled value

Pass `value` to let the parent own the text. The input shows `value`, and each edit calls `onChange` with the next value. The input does not change until the parent passes a new `value`:

```tsx
const [notes, setNotes] = useState('');

<MultilineTextInput value={notes} onChange={setNotes} />;
```

- A key the parent does not store leaves the display and the cursor unchanged. The next key in the same read starts from the value the parent holds.
- A move, such as Up or Left, changes only the cursor, so it takes effect at once.
- The cursor stays where the user left it. If an external change makes the value shorter than that position, the cursor moves to the new end. A cursor inside a character made of several code units moves to the start of that character.
- With `value` and no `onChange`, the input is read-only.
- Store the new value in `onChange` synchronously. A parent that stores it later, in a timer or a transition, counts as having refused the key, so the caret stays put. Under `concurrent` rendering, a transition can also commit after later keystrokes and revert them.

## Placeholder and disabled state

- With an empty value and the input enabled, the first character of `placeholder` is drawn with the cursor on it, and the rest is dimmed. Without a placeholder, the cursor is drawn as one inverse space on the first line.
- With `isDisabled`, the placeholder is dimmed and no cursor is drawn. Without a placeholder, an empty disabled input draws one blank line.
- With `isDisabled`, the value is drawn without a cursor.
- A line with no text still takes a line of height, so an empty line in the middle of the value does not shrink the editor.

## Callbacks

- `onChange` is called once per change to the value, synchronously from the key or paste that made it. A burst of keys in one read reports each change, in order. It is not called on mount, for cursor movement, or for a key that leaves the value unchanged, such as Backspace at the start of the value.
- `onSubmit` is called with the current value when Ctrl+D is pressed. An empty value is passed as `''`.
- A new `onChange` or `onSubmit` function on each render does not repeat the last call, so wrapping the callbacks in `useCallback` is not needed.

## Theme keys

The component reads the `MultilineTextInput` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.value` | none | Text props for the lines of text: `{}`. |
| `styles.cursor` | none | Text props for the caret cell: `{inverse: true}`. |
| `styles.placeholder` | none | Text props for the placeholder: `{dimColor: true}`. |

`MultilineTextInput` has no config keys.

## Edge cases

- Outside a paste, a carriage return is Enter and a line feed is a newline, so each one inserts a newline. A typed CRLF in one read, such as `Q`, CR, LF, `Z`, therefore inserts two newlines. A pasted CRLF inserts one. Terminals send Enter as a carriage return, so this only shows when text is written to the terminal without paste markers.
- `defaultValue` is read once. Changing it later does not change the value.
- A line longer than the editor is not wrapped. Use a wider terminal, or split the text into more lines.
