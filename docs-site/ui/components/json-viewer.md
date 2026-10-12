---
outline: [2, 3]
---

# JSONViewer

`JSONViewer` prints a JavaScript value as pretty JSON, with two-space indentation. Keys, strings, numbers, booleans and null each have their own color. Use it to show a parsed API response or a configuration object in a terminal. It is display only and takes no keyboard input. The closest component is [CodeBlock](/ui/components/code-block), which shows text that is already a string, with no syntax colors. `JSONViewer` takes the value itself, formats it, and colors it by type.

`JSONViewer` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The demo prints an order response, with the request line above it.

<TerminalDemo demo="json-viewer-basic" title="JSONViewer — API response" />

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {JSONViewer} from '@nemesis-oss/termina-ui';

const response = {
	id: 'ord_1042',
	status: 'shipped',
	total: 129.95,
	coupon: null,
	items: [{sku: 'KB-75', quantity: 1}],
};

function Order() {
	return (
		<Box flexDirection="column" gap={1}>
			<Text>GET /v1/orders/ord_1042</Text>
			<JSONViewer data={response} maxDepth={3} />
		</Box>
	);
}

render(<Order />);
```

`data` takes the value itself, so pass the parsed object rather than a JSON string, which would print as one quoted string.

## Props

`JSONViewerProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `unknown` | Required | Value to print. Any JavaScript value works, including `undefined` and values JSON cannot represent. |
| `maxDepth` | `number` | `8` | Objects and arrays nested deeper than this print as `...`. The root value is at depth 0. |

## Theme keys

The component reads the `JSONViewer` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.key` | none | Text props: `color: 'cyan'`. Applies to object keys, with their quotes. |
| `styles.string` | none | Text props: `color: 'green'`. Applies to string values, with their quotes. |
| `styles.number` | none | Text props: `color: 'yellow'`. Applies to numbers and bigints. |
| `styles.boolean` | none | Text props: `color: 'magenta'`. |
| `styles.null` | none | Text props: `color: 'gray'`. Also applies to `undefined`. |
| `styles.punctuation` | none | Text props: `dimColor: true`. Applies to brackets, braces, colons, commas, and the `...`, `[Circular]`, `[Function name]` and `Symbol(...)` markers. |

`JSONViewer` has no config keys.

## Edge cases

- The root value is at depth 0. An object or array deeper than `maxDepth` prints as `...` in place of its brackets, even when it is empty. With `maxDepth={0}`, only the top-level keys print, and each nested container prints as `...`.
- A negative `maxDepth` replaces the root object or array with `...`. Primitive values print as usual.
- Strings and keys are escaped the way `JSON.stringify` escapes them, so a newline prints as `\n` and stays on one line.
- `NaN`, `Infinity` and `-Infinity` print by name. `JSON.stringify` would print `null`.
- A key whose value is `undefined` prints as `undefined`, where `JSON.stringify` omits the key. An array hole also prints as `undefined`.
- Only own enumerable string keys print. A symbol key is omitted, and a `Date`, `Map` or `Set` has none, so it prints as `{}`.
- A function prints as `[Function name]`, or as `[Function (anonymous)]` when it has no name. A symbol value prints as `Symbol(description)`.
- Only a reference to an object that is still being printed is `[Circular]`. The same object under two keys prints in full under each key. A cycle prints as `[Circular]` even where `maxDepth` would hide it.
