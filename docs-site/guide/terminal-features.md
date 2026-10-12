---
outline: [2, 3]
---

# Terminal Features

These exports report what the terminal can do and produce escape sequences for hyperlinks and the clipboard. The kitty keyboard protocol is turned on with a render option. Use this page when output depends on the terminal: choosing whether to color text, linking text, copying to the clipboard, or enabling the enhanced keyboard protocol.

All exports on this page come from `@nemesis-oss/termina-core`.

## Preview

The frame shows three colored lines, a named green, a hex orange, and an RGB blue, rendered at the truecolor level that the docs generator forces with FORCE_COLOR=3.

<TerminalPreview id="terminal-features-color-truecolor" />

## detectTerminalCapabilities

`detectTerminalCapabilities` reads the environment and a stream once, and returns the features the stream supports.

```ts
import {detectTerminalCapabilities} from '@nemesis-oss/termina-core';

const capabilities = detectTerminalCapabilities(process.env, process.stdout);

if (capabilities.colorLevel === 'none') {
	// Print plain text without styling.
}
```

Signature: `detectTerminalCapabilities(environment: Readonly<Record<string, string | undefined>>, stream: {readonly isTTY?: boolean}, inCi?: boolean): TerminalCapabilities`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `environment` | `Readonly<Record<string, string \| undefined>>` | none | The variables to read. Pass `process.env` in most cases. |
| `stream` | `{readonly isTTY?: boolean}` | none | The output stream. Only `isTTY` is read. |
| `inCi` | `boolean` | `Boolean(environment.CI)` | Whether the process counts as running in CI. |

`render()` does not use the `inCi` default. It passes the result of the `is-in-ci` package, so the two can disagree.

### TerminalCapabilities

`TerminalCapabilities` is exported as a type.

| Field | Type | Value |
|---|---|---|
| `interactive` | `boolean` | `true` when `stream.isTTY` is `true`, `TERM` is not `dumb`, and `inCi` is `false`. |
| `colorLevel` | `ColorLevel` | The color support level. See [Color level](#color-level). |
| `synchronizedOutput` | `boolean` | `true` when `interactive` is `true` and `TERM` is not `linux`. Describes support for DEC 2026 synchronized output. |
| `alternateScreen` | `boolean` | Equal to `interactive`. |
| `mouse` | `boolean` | Equal to `interactive`. |
| `hyperlinks` | `boolean` | `true` when `stream.isTTY` is `true` and `TERM` is neither `dumb` nor `linux`. `CI` does not affect it. |

`ColorLevel` is exported as a type with the values `'none'`, `'ansi16'`, `'ansi256'`, and `'truecolor'`.

Of these fields, `render()` reads only `interactive`. The renderer decides synchronized output with its own check, so `synchronizedOutput` is informational for application code.

### Color level

The level is chosen by the first rule that applies:

1. If `FORCE_COLOR` is set, even to an empty string, its value decides. See the table below.
2. A non-empty `NO_COLOR` gives `'none'`.
3. A stream that is not a TTY, or a `TERM` of `dumb`, gives `'none'`.
4. A `COLORTERM` of `truecolor` or `24bit` gives `'truecolor'`.
5. A `TERM` that contains `256color` gives `'ansi256'`.
6. Anything else gives `'ansi16'`.

`FORCE_COLOR` values:

| `FORCE_COLOR` | `colorLevel` |
|---|---|
| `''` or `'true'` | `'ansi16'` |
| `'false'` or `'0'` | `'none'` |
| `'1'` | `'ansi16'` |
| `'2'` | `'ansi256'` |
| `'3'` or higher | `'truecolor'` |
| Any other value, including text and negative numbers | `'ansi16'` |

`FORCE_COLOR` forces color on a stream that is not a TTY, and it does not make the app interactive. The test suite asserts that this mapping matches the level chalk selects for `''`, `'0'`, `'false'`, `'true'`, `'1'`, `'2'`, `'3'`, and `'9'`.

## hyperlink

`hyperlink` wraps a label in an OSC 8 hyperlink. Terminals that support OSC 8 show the label as a clickable link.

```tsx
import {Text, detectTerminalCapabilities, hyperlink, useStdout} from '@nemesis-oss/termina-core';

function DocsLink() {
	const {stdout} = useStdout();
	const {hyperlinks} = detectTerminalCapabilities(process.env, stdout as NodeJS.WriteStream);
	const label = 'Documentation';

	return <Text>{hyperlinks ? hyperlink('https://example.com/docs', label) : label}</Text>;
}
```

Signature: `hyperlink(url: string, label: string): string`

- The result is `ESC ] 8 ; ; url ESC \`, then the label, then `ESC ] 8 ; ; ESC \`. The sequence ends with the string terminator `ESC \`.
- `hyperlink` throws a `RangeError` when `url` is empty or contains any control character: C0 (0x00 to 0x1F), DEL (0x7F), or C1 (0x80 to 0x9F). A control character could end the sequence early or start a new one, so the URL is rejected rather than escaped.
- It does not check the URL scheme or any other part of the URL.
- It does not check the terminal. Gate the call on `capabilities.hyperlinks`. Written to a non-TTY stream, the escape bytes appear as raw text in logs.
- The label may carry SGR styling. Layout measures the visible width of the label, because the OSC 8 bytes have no width.

## Clipboard

`clipboardSequence` builds an OSC 52 sequence that asks the terminal to place text on the system clipboard. `copyToClipboard` writes it. OSC 52 works over SSH without a local clipboard tool, but only where the terminal allows clipboard writes.

```tsx
import {useState} from 'react';
import {Text, copyToClipboard, render, useInput} from '@nemesis-oss/termina-core';

const message = 'Press y to copy this line';

function CopyLine() {
	const [status, setStatus] = useState('');

	useInput(input => {
		if (input === 'y') {
			setStatus(copyToClipboard(message) ? 'Copied.' : 'Output is not a terminal.');
		}
	});

	return <Text>{status === '' ? message : status}</Text>;
}

render(<CopyLine />);
```

Signatures:

- `clipboardSequence(text: string): string`
- `copyToClipboard(text: string, stream?: {isTTY?: boolean; write: (data: string) => unknown}): boolean`. The default for `stream` is `process.stdout`.

Behavior:

- `clipboardSequence` encodes `text` as UTF-8, then base64, and returns `ESC ] 52 ; c ; <base64> BEL`.
- The payload is limited to 74,000 base64 characters. A larger payload throws a `RangeError`. Base64 uses four characters for every three bytes, so the limit is about 55,500 bytes of UTF-8 text. The limit exists because terminals commonly cap the payload and would truncate a larger copy silently.
- `copyToClipboard` checks `stream.isTTY` first. When the stream is not a TTY, it returns `false` and writes nothing, even for a payload that would be too large. When the stream is a TTY, it builds the sequence, which can throw, writes it, and returns `true`.
- The sequence moves no cursor and draws nothing, so it is safe to write while Ink owns the screen.
- `copyToClipboard` returns `true` whenever it writes. It cannot tell whether the terminal accepted the copy.

## kittyKeyboard

The `kittyKeyboard` render option turns on the kitty keyboard protocol. With the protocol active, `Key` reports the Super, Hyper, Caps Lock, and Num Lock modifiers and the event type. See [The Key object](/guide/keyboard-and-focus#the-key-object).

```tsx
import {Text, render} from '@nemesis-oss/termina-core';

const App = () => <Text>Keyboard protocol enabled when the terminal supports it.</Text>;

render(<App />, {
	kittyKeyboard: {
		mode: 'auto',
		flags: ['disambiguateEscapeCodes', 'reportEventTypes'],
	},
});
```

The option is `KittyKeyboardOptions`, which is exported as a type.

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | `'auto' \| 'enabled' \| 'disabled'` | `'auto'` | When the protocol is turned on. See the modes below. |
| `flags` | `KittyFlagName[]` | `['disambiguateEscapeCodes']` | The protocol features to request. |

`KittyFlagName` is the union of the keys of `kittyFlags`, which is exported with its bit values.

Modes:

- `'auto'`: when the app is interactive and both stdin and stdout are TTYs, Ink sends the query `CSI ? u` and waits up to 200 ms. A reply turns the protocol on with `flags`. With no reply, the protocol stays off. Suspending the terminal cancels a pending query.
- `'enabled'`: turns the protocol on when both stdin and stdout are TTYs. This happens even when `interactive` is `false`, for example in CI.
- `'disabled'`: never turns the protocol on.

Flags:

| Flag | Bit | Effect |
|---|---|---|
| `disambiguateEscapeCodes` | 1 | Default. Requests disambiguated escape codes. |
| `reportEventTypes` | 2 | Reports press, repeat, and release events in `key.eventType`. |
| `reportAlternateKeys` | 4 | The parser accepts these sequences, but Ink does not expose alternate keys. |
| `reportAllKeysAsEscapeCodes` | 8 | Reports every key as an escape code, including printable keys. |
| `reportAssociatedText` | 16 | Reports the text a key produces. It also turns on `reportAllKeysAsEscapeCodes`. |

Without associated text, `input` is the primary, unshifted key. For example, Shift+a gives `input` `'a'` with `key.shift` set. Enable `reportAssociatedText` to receive the shifted text.

The protocol is written as `CSI > flags u` when it is enabled, and `CSI < u` on unmount to restore the previous state. After a suspension, the same flags are enabled again on resume.

The bit values are exported as `kittyFlags` and `kittyModifiers`. The protocol is described at https://sw.kovidgoyal.net/kitty/keyboard-protocol/.

## Related

- [Keyboard and Focus](/guide/keyboard-and-focus) for `useInput`, the `Key` fields, and paste.
- [Mouse](/guide/mouse) for mouse capability and tracking.
- [Rendering](/guide/rendering) for the rendering model.
- [Alternate Screen and Suspend](/guide/alternate-screen-and-suspend) for the alternate screen and suspension.
- [API: @nemesis-oss/termina-core](/api/core) for the full export list.
