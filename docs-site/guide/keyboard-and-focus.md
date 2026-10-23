---
outline: [2, 3]
---

# Keyboard and Focus

Keyboard input reaches component code through `useInput`, pasted text through `usePaste`, and focus through `useFocus` and `useFocusManager`. This page covers what each hook delivers, how terminal bytes become `Key` flags, and how the focus engine chooses the next component. Read it when a component reads keys, handles pasted text, or moves focus between fields.

Mouse input is covered on [Mouse](/guide/mouse). The kitty keyboard protocol is a render option and is covered on [Terminal Features](/guide/terminal-features).

All hooks on this page are exported from `@nemesis-oss/termina-core`.

## Preview

The frame shows two field labels, Name in the inverse style that the Field example in the Focus section gives a focused field and Email in the plain style it gives an unfocused one.

<TerminalPreview id="keyboard-and-focus-focused-field" />

## Reading keys with useInput

`useInput` calls a handler for each key event. While the hook is active, it turns raw mode on for the input stream, and it turns it off on unmount.

```tsx
import {useState} from 'react';
import {Text, render, useApp, useInput} from '@nemesis-oss/termina-core';

function Counter() {
	const [count, setCount] = useState(0);
	const {exit} = useApp();

	useInput((input, key) => {
		if (key.upArrow) {
			setCount(value => value + 1);
		} else if (key.downArrow) {
			setCount(value => value - 1);
		} else if (input === 'q') {
			exit();
		}
	});

	return <Text>Count: {count}</Text>;
}

render(<Counter />);
```

Signature: `useInput(handler: (input: string, key: Key) => void, options?: {isActive?: boolean}): void`

| Option | Type | Default | Description |
|---|---|---|---|
| `isActive` | `boolean` | `true` | When `false`, the hook neither enables raw mode nor listens for input. |

Behavior:

- Each call carries the text the key produced in `input`, and the flags in `key`. The meaning of `input` for each key is listed under [The Key object](#the-key-object).
- Handlers receive key release events when the kitty protocol reports them (`reportEventTypes`). Check `key.eventType` if a handler should ignore releases.
- With `exitOnCtrlC` set to its default of `true` in `render()`, Ctrl+C exits the app and is not passed to handlers. Set `exitOnCtrlC: false` to receive it as `input` `'c'` with `key.ctrl` set.
- Mouse reports never reach `useInput`. Terminal replies that name no key are dropped. See [Terminal replies](#terminal-replies).
- While a [KeyboardCapture](#keyboard-capture) is active, a handler outside the innermost capture receives nothing.

## The Key object

`Key` is exported as a type. Every call sets each boolean field. `super`, `hyper`, `capsLock`, `numLock`, and `eventType` can be set by numbered CSI sequences even when the kitty protocol is not active. See their rows below.

| Field | Type | Set when |
|---|---|---|
| `upArrow` | `boolean` | Up arrow, in CSI or SS3 form, or the kitty Up codepoint. |
| `downArrow` | `boolean` | Down arrow. |
| `leftArrow` | `boolean` | Left arrow. |
| `rightArrow` | `boolean` | Right arrow. |
| `pageDown` | `boolean` | Page Down. |
| `pageUp` | `boolean` | Page Up. |
| `home` | `boolean` | Home. |
| `end` | `boolean` | End. |
| `return` | `boolean` | Carriage return (`\r`), Meta+Return, application keypad Enter, and the kitty codepoints 13 and 57414. A bare line feed does not set it. |
| `escape` | `boolean` | A lone ESC after the hold window, a double ESC, or the kitty codepoint 27. |
| `ctrl` | `boolean` | A control byte that is not a named key (see [Modifier chords](#modifier-chords)), or the Ctrl modifier in a CSI or kitty sequence. |
| `shift` | `boolean` | An uppercase letter, Shift+Tab, or the Shift modifier in a CSI or kitty sequence. |
| `tab` | `boolean` | Tab (`\t`), Meta+Tab, Shift+Tab, or the kitty codepoint 9. |
| `backspace` | `boolean` | DEL (`\x7F`), BS (`\x08`), or the kitty codepoint 127. |
| `delete` | `boolean` | Delete (`ESC [ 3 ~` and its variants), or the kitty Delete key. |
| `meta` | `boolean` | An ESC prefix before the key, or the Alt or Meta modifier in a CSI or kitty sequence. |
| `super` | `boolean` | The kitty Super modifier. Set from the modifier parameter of a numbered CSI sequence, so a sequence without the protocol can set it (for example `ESC [ 1 ; 9 A` gives `super` `true`). Do not rely on `false` without the protocol. |
| `hyper` | `boolean` | The kitty Hyper modifier. Set from the modifier parameter of a numbered CSI sequence, so a sequence without the protocol can set it (for example `ESC [ 1 ; 17 A` gives `hyper` `true`). Do not rely on `false` without the protocol. |
| `capsLock` | `boolean` | The kitty Caps Lock state. Set from the modifier parameter of a numbered CSI sequence, so a sequence without the protocol can set it (for example `ESC [ 1 ; 65 A` gives `capsLock` `true`). Do not rely on `false` without the protocol. |
| `numLock` | `boolean` | The kitty Num Lock state. Set from the modifier parameter of a numbered CSI sequence, so a sequence without the protocol can set it (for example `ESC [ 1 ; 129 A` gives `numLock` `true`). Do not rely on `false` without the protocol. |
| `eventType` | `'press' \| 'repeat' \| 'release'` (optional) | The kitty event type. `undefined` for keys parsed by the legacy path, such as plain arrows and F1 to F4. Numbered CSI sequences such as `ESC [ 3 ~` (Delete) and `ESC [ 1 ; 2 A` (Shift+Up) report `'press'` even when the protocol is not active. |

### Input values

`input` is the text a key produces. Keys that have no printable text give an empty string.

| Key | `input` | Flags set |
|---|---|---|
| Printable character | The character, with its case | `shift` for an uppercase ASCII letter |
| Space | `' '` | none |
| Digit | The digit | none |
| Return (`\r`) | `'\r'` | `return` |
| Line feed (`\n`) | `'\n'` | none. It is named `enter` and sets no flag. |
| Ctrl+letter | The lowercase letter | `ctrl` |
| Ctrl+Space | `' '` | `ctrl` |
| Escape | `''` | `escape` |
| Tab, Shift+Tab | `''` | `tab`, and `shift` for Shift+Tab |
| Backspace, Delete | `''` | `backspace` or `delete` |
| Arrow, Home, End, Page Up, Page Down, Insert, Clear, function keys | `''` | the matching flag, or none for keys without a field |

A key with no `Key` field, such as F1 or Insert, still calls the handler. Its `input` is `''` and every boolean flag is `false`.

## Escape key timing

A lone ESC byte is held for 40 ms before it is delivered. The hold exists because an escape sequence can arrive split across two reads. The behavior is as follows:

- If nothing follows the ESC within the window, it is delivered as the Escape key: `key.escape` is `true` and `input` is `''`.
- If bytes arrive within the window, they are parsed together. An ESC followed by `[A` within the window is Up Arrow, and no Escape is delivered.
- Each chunk that arrives while an ESC is pending restarts the window. A second ESC that arrives inside the window joins the pending one, and the pair is delivered once as a double ESC.
- If the window closes while an incomplete sequence is pending, the ESC is dropped and the remaining characters are delivered as `input`. For example, ESC followed by `[` is delivered as `input` `'['`.
- Bytes that arrive after the window are delivered after the Escape key, as separate input.

## Modifier chords

Ctrl chords:

- Ctrl+A through Ctrl+Z give the lowercase letter as `input` and set `key.ctrl`, except Ctrl+H, Ctrl+I, Ctrl+J, and Ctrl+M, which the next bullet describes.
- Ctrl+Space sends NUL, which gives `input` `' '` and sets `key.ctrl`.
- Bytes 0x1C through 0x1F give the punctuation named by the byte with `key.ctrl` set. For example, 0x1F gives `_`.
- Some control bytes are reported as named keys before the Ctrl rule applies. Ctrl+H is Backspace (0x08), Ctrl+I is Tab (0x09), Ctrl+J is a bare line feed (0x0A), Ctrl+M is Return (0x0D), and Ctrl+[ is Escape (0x1B). None of them sets `key.ctrl`.

Meta chords:

- A meta chord arrives as an ESC byte followed by the key. `ESC x` gives `input` `'x'` with `key.meta` set.
- Meta with Ctrl sets both `key.meta` and `key.ctrl`, for example `ESC` followed by Ctrl+B.
- A double ESC gives `key.escape` and `key.meta`, and `input` is one ESC character (`'\u001B'`). A lone ESC gives `input` `''`.
- Whether a terminal sends Alt or Option as an ESC prefix is up to the terminal's own setting.

Shift:

- An uppercase letter gives `input` in uppercase and sets `key.shift`.
- Shift+Tab is `ESC [ Z`. It sets `key.tab` and `key.shift`.
- Modified CSI keys, such as Shift+Up, set `key.shift` from their modifier value.

## Multi-key chunks

A terminal can deliver several keys in one read, for example during auto-repeat. The input parser splits the chunk as follows:

- Each escape sequence becomes its own event.
- Each DEL (`\x7F`), BS (`\x08`), and Ctrl+C (`\x03`) inside plain text becomes its own event.
- Other text stays together, including CR and TAB.

Events from one chunk are handled in order. Each one runs after the React updates the previous event caused have committed, so a handler reads the state its predecessor left. The screen is redrawn once for the whole chunk, not once per event. New `<Static>` output is still written as soon as it commits.

The flags are computed from the whole text event. A chunk such as `'ab\r'` is delivered with `input` `'ab\r'` and `key.return` `false`. Handle a carriage return inside `input` if a chunk can contain one.

## Paste with usePaste

`usePaste` calls a handler with the full text of each bracketed paste.

```tsx
import {useState} from 'react';
import {Text, render, usePaste} from '@nemesis-oss/termina-core';

function PasteCount() {
	const [characters, setCharacters] = useState(0);

	usePaste(text => {
		setCharacters(text.length);
	});

	return <Text>Pasted characters: {characters}</Text>;
}

render(<PasteCount />);
```

Signature: `usePaste(handler: (text: string) => void, options?: {isActive?: boolean}): void`

| Option | Type | Default | Description |
|---|---|---|---|
| `isActive` | `boolean` | `true` | When `false`, the hook neither enables bracketed paste mode nor listens for paste. |

Behavior:

- While at least one active `usePaste` is mounted, bracketed paste mode is on in the terminal. The mode is reference counted, and it is turned off when the last one unmounts.
- The handler receives the whole paste in one call, including newlines. Escape bytes inside the paste are kept as text.
- When a `usePaste` handler is mounted, paste is delivered only to `usePaste` handlers, never to `useInput`. Every mounted `usePaste` receives the same text. An enabled `TextInput`, `PasswordInput` or `MultilineTextInput` is one of those handlers, so a `useInput` listener does not see paste while an enabled editor is mounted.
- `TextInput` and `PasswordInput` insert pasted text through the same action as typing. A single-line editor drops the newlines and control characters in a paste, and a controlled `value` accepts or refuses the pasted text like any other edit. A disabled editor takes no paste. `MultilineTextInput` keeps line feeds, turns CRLF and CR into line feeds, and turns each tab into four spaces. It removes other control characters.
- Without a mounted `usePaste`, the app does not turn bracketed paste mode on, and the terminal sends pasted text as ordinary input. An enabled `TextInput`, `PasswordInput` or `MultilineTextInput` mounts one, so bracketed paste mode is on while it is mounted. If paste markers reach the parser anyway, the pasted text goes to `useInput` as one string, and the flags are computed from that whole string.
- A paste start marker with no end marker is held by the parser until the end marker arrives. The escape timer does not flush it.
- Under a [KeyboardCapture](#keyboard-capture), a paste reaches only the `usePaste` handlers inside the innermost active capture. A paste that reaches only handlers outside it is dropped. When no `usePaste` handler is mounted, the paste goes to `useInput`, and only the `useInput` handlers inside the innermost active capture receive it.

## Keyboard capture

A `KeyboardCapture` decides which listeners receive input. While one is active, the keys, paste and mouse reports go only to the `useInput`, `usePaste` and `useMouse` listeners inside it, and listeners outside it receive nothing. Use it for a dialog or any region that owns the keys while it is open. `KeyboardCapture` is a component, and it is exported from `@nemesis-oss/termina-core`. [Modal](/ui/components/modal) is built on it.

```tsx
import {useState} from 'react';
import {Box, KeyboardCapture, Text, render, useInput} from '@nemesis-oss/termina-core';

function Dialog() {
	const [isOpen, setIsOpen] = useState(false);

	useInput(input => {
		if (input === 'd') {
			setIsOpen(true);
		}
	});

	return (
		<Box flexDirection="column">
			<Text>Press d to open the dialog</Text>
			<KeyboardCapture isActive={isOpen}>
				<DialogBody onClose={() => setIsOpen(false)} />
			</KeyboardCapture>
		</Box>
	);
}

function DialogBody({onClose}: {readonly onClose: () => void}) {
	// Receives keys only while the dialog's capture is the innermost one.
	useInput((_input, key) => {
		if (key.escape) {
			onClose();
		}
	});

	return <Text>Dialog. Press Escape to close.</Text>;
}

render(<Dialog />);
```

The rules:

- **Gated.** The `useInput`, `usePaste` and `useMouse` listeners outside the innermost active capture receive nothing. Inside it, they receive input as usual.
- **Not gated.** Ctrl+C exits the app before any capture is checked, so a capture cannot block it.
- **Escape.** A plain Escape does not clear the focused component while a capture is active.
- **Tab.** Tab and Shift+Tab move focus only within the scope of the innermost capture. See [Focus scope](#focus-scope).
- **Nesting.** Captures nest, and the innermost active one decides. Closing it returns input to the capture around it. With no capture active, every listener receives input again.
- **Inactive.** `isActive={false}` makes the capture pass through. Its children behave as if it were not there.
- **Suspend.** Suspending the terminal keeps the capture and the focus, so the same input is restricted when the app resumes.
- **Box mouse props.** `Box` handlers such as `onClick` and `onWheel` are found by hit testing on the layout, not by the capture. A handler on a covered element does not run, because the hit test finds the element above it first. See [Mouse](/guide/mouse).

### Paste under a capture

Paste follows the same rule as keys, with one addition. A paste that arrives while a capture is active goes to the `usePaste` handlers inside the innermost capture. A paste that reaches only handlers outside it is dropped. It is not passed to `useInput` either, because a mounted `usePaste` handler keeps paste away from `useInput`.

## Focus

Focus in this engine is a single active component ID, reported as `activeId`. It is separate from terminal focus. The engine keeps one ordered list of focusable components, and Tab and Shift+Tab move through that list.

```tsx
import {Box, Text, render, useFocus, useFocusManager} from '@nemesis-oss/termina-core';

function Field({id, label}: {readonly id: string; readonly label: string}) {
	const {isFocused} = useFocus({id, autoFocus: id === 'name'});

	return <Text inverse={isFocused}>{label}</Text>;
}

function Form() {
	const {activeId} = useFocusManager();

	return (
		<Box flexDirection="column">
			<Field id="name" label="Name" />
			<Field id="email" label="Email" />
			<Text>Focused: {activeId ?? 'none'}</Text>
		</Box>
	);
}

render(<Form />);
```

### useFocus

Signature: `useFocus(options?: {isActive?: boolean; autoFocus?: boolean; id?: string; ref?: RefObject<DOMElement | null>}): {isFocused: boolean; focus: (id: string) => void}`

| Option | Type | Default | Description |
|---|---|---|---|
| `isActive` | `boolean` | `true` | When `false`, the component stays in the list but cannot receive focus. |
| `autoFocus` | `boolean` | `false` | Focus this component on registration when nothing is focused and focus management is enabled. |
| `id` | `string` | Generated by React `useId` | The ID used by `focus(id)` and `activeId`. It must be unique among focusable components. |
| `ref` | `RefObject<DOMElement \| null>` | `undefined` | The `Box` this component renders. `focusDirection` uses its on-screen rectangle. Without it, the component takes part only in Tab order. |

| Return field | Type | Description |
|---|---|---|
| `isFocused` | `boolean` | `true` when this component is the active one. Components that share an ID all report `true`. |
| `focus` | `(id: string) => void` | Focuses the component with the given ID. See [useFocusManager](#usefocusmanager) for the rules. |

### useFocusManager

Signature: `useFocusManager()` takes no arguments and returns the fields below.

| Field | Type | Description |
|---|---|---|
| `enableFocus` | `() => void` | Turns focus management on. It is on from the start. |
| `disableFocus` | `() => void` | Turns focus management off and clears the focused component. |
| `focusNext` | `() => void` | Moves focus to the next active component, wrapping from last to first. |
| `focusPrevious` | `() => void` | Moves focus to the previous active component, wrapping from first to last. |
| `focus` | `(id: string) => void` | Focuses the active component with that ID. An unknown or inactive ID leaves focus unchanged. |
| `focusDirection` | `(direction: 'up' \| 'down' \| 'left' \| 'right') => void` | Moves focus to the nearest active component in that direction, by on-screen position. See [Directional focus](#directional-focus). |
| `activeId` | `string \| undefined` | The ID of the focused component, or `undefined`. |

### Focus rules

- **Order.** The list is in registration order, which is the order in which components mount. Reordering keyed children leaves their positions unchanged. A component that unmounts and mounts again is appended to the end.
- **Tab follows registration, not layout.** Tab and Shift+Tab never use screen position. Arrow keys move focus only when your own `useInput` calls `focusDirection`, so the app decides which keys navigate.
- **Tab.** With nothing focused, Tab moves to the first active component. Otherwise it moves to the next active component after the focused one and wraps from last to first.
- **Shift+Tab.** With nothing focused, Shift+Tab moves to the last active component. Otherwise it moves to the previous active component and wraps from first to last.
- **Inactive components.** A component with `isActive: false` stays in the list and is skipped by Tab and Shift+Tab. If it was focused, it loses focus.
- **Duplicate IDs.** Tab visits an ID once, at its first registration. Every component with that ID reports `isFocused`.
- **Unmounting.** When the focused component unmounts, `activeId` becomes `undefined`. The next Tab moves to the first active component.
- **Tab in input.** Tab and Shift+Tab are also delivered to `useInput` handlers. Tab with Ctrl, Meta, Super, or Hyper does not move focus. While a capture is active, Tab moves focus only within its scope. See [Focus scope](#focus-scope).
- **Escape.** A plain Escape clears the focused component when focus management is enabled and no capture is active. Escape with Shift, Ctrl, Meta, Super, or Hyper does not. The Escape key is still delivered to `useInput` handlers.
- **disableFocus.** Tab, Shift+Tab, Escape clearing, and `autoFocus` stop working while focus is disabled. `focusNext`, `focusPrevious`, and `focus` do not check this flag, so a direct call still moves focus. `enableFocus` turns the automatic behavior back on.

### Directional focus

`focusDirection(direction)` moves focus to the nearest component that lies that way from the focused one. Pass each focusable's `ref` to `useFocus`, and call `focusDirection` from `useInput`:

```tsx
import {useRef} from 'react';
import {
	Box,
	Text,
	render,
	useFocus,
	useFocusManager,
	useInput,
	type DOMElement,
} from '@nemesis-oss/termina-core';

function Tile({id, autoFocus = false}: {readonly id: string; readonly autoFocus?: boolean}) {
	const ref = useRef<DOMElement>(null);
	const {isFocused} = useFocus({id, autoFocus, ref});

	return (
		<Box ref={ref} width={12} height={3}>
			<Text inverse={isFocused}>{id}</Text>
		</Box>
	);
}

function Board() {
	const {focusDirection} = useFocusManager();

	useInput((_input, key) => {
		if (key.upArrow) {
			focusDirection('up');
		} else if (key.downArrow) {
			focusDirection('down');
		} else if (key.leftArrow) {
			focusDirection('left');
		} else if (key.rightArrow) {
			focusDirection('right');
		}
	});

	return (
		<Box flexDirection="column">
			<Box>
				<Tile id="A" autoFocus />
				<Tile id="B" />
			</Box>
			<Box>
				<Tile id="C" />
				<Tile id="D" />
			</Box>
		</Box>
	);
}

render(<Board />);
```

The rule is the one `nearestInDirection` documents in `@nemesis-oss/termina-core`:

- **Position.** Each rectangle is compared by its center. A candidate qualifies when its center lies strictly ahead of the focused center in the direction. The test is a half-plane, so a candidate far off the axis still qualifies, and distance decides.
- **Distance.** The distance is `Math.hypot(along, across)`. A terminal row is about twice as tall as a column is wide, so a row counts as two columns of distance.
- **Ties.** The earlier component in registration order wins.
- **What takes part.** Only active components that passed a `ref`, are inside the top `KeyboardCapture` when one is active, and are at least partly drawn take part. A component clipped out of an `overflow="hidden"` parent or scrolled out of a `ScrollBox` does not, because its visible rectangle is empty.
- **No move.** When nothing is focused, or nothing lies that way, focus stays where it is.

Rectangles are measured on the last layout, so call `focusDirection` from input handlers and not during render.

### Focus scope

Each focusable component belongs to a scope. A component inside a `KeyboardCapture` belongs to that capture's scope, and a component outside every capture belongs to the app scope.

- While a capture is active, Tab and Shift+Tab cycle only through the focusable components in the innermost capture's scope, and they wrap within it. With none in that scope, Tab does nothing.
- With no capture active, Tab reaches every focusable component, as in the rules above.
- Focus that was on a component outside the capture is not moved by the capture. Such a component keeps `isFocused` but receives no keys until the capture is released.
- `useFocusScope()` returns `focusFirstInScope`, which focuses the first active focusable component in the scope of the nearest active capture. Outside every capture, it focuses the first focusable component that is not inside one. A dialog calls it when it opens, so focus moves inside.

```tsx
import {useEffect} from 'react';
import {KeyboardCapture, Text, useFocusScope} from '@nemesis-oss/termina-core';

function DialogBody() {
	const {focusFirstInScope} = useFocusScope();

	useEffect(() => {
		focusFirstInScope();
	}, [focusFirstInScope]);

	return <Text>Dialog</Text>;
}

const Dialog = () => (
	<KeyboardCapture>
		<DialogBody />
	</KeyboardCapture>
);
```

Signature: `useFocusScope(): {focusFirstInScope: () => void}`. The API entry is on [useFocusScope()](/api/core#usefocusscope).

## Non-TTY input

`useStdin()` returns `isRawModeSupported`. It is `false` when stdin cannot enter raw mode, such as a pipe.

- `useFocus`, `useInput`, `usePaste`, and `useMouse` check it. When it is `false`, they skip raw mode and stay idle instead of throwing, so the app still renders under a pipe or in CI.
- Calling `setRawMode(true)` from `useStdin()` directly still throws on a stdin without raw mode.

Upstream Ink throws from `useInput` in this case. This fork does not, so a component no longer needs to pass `isActive: isRawModeSupported` itself.

## Terminal replies

Complete CSI and SS3 sequences that name no key are dropped instead of being delivered as text. The parser tests pin these cases: focus-in (`ESC [ I`), focus-out (`ESC [ O`), cursor position reports, primary device attribute replies, a stray paste end marker, and an unmapped modified SS3 sequence.

A kitty keyboard query reply (`ESC [ ? digits u`) is consumed by the app and does not reach `useInput`. Inside a bracketed paste the same bytes are part of the pasted text, so they are not treated as a reply.

## Related

- [Mouse](/guide/mouse) for `Box` click handlers, wheel events, and `useMouse`.
- [Terminal Features](/guide/terminal-features) for the `kittyKeyboard` render option and terminal capability detection.
- [Rendering](/guide/rendering) for the rendering model.
- [Testing](/guide/testing) for testing components.
- UI kit components that use keyboard capture or focus scope: [Modal](/ui/components/modal) and [SplitPane](/ui/components/split-pane).
- UI kit components that read keys through `useInput`: [TextInput](/ui/components/text-input), [Select](/ui/components/select), [MultiSelect](/ui/components/multi-select), [ConfirmInput](/ui/components/confirm-input), [EmailInput](/ui/components/email-input), [PasswordInput](/ui/components/password-input), [MultilineTextInput](/ui/components/multiline-text-input), and [ScrollBox](/ui/components/scroll-box).
- [API: @nemesis-oss/termina-core](/api/core) for the full export list.
