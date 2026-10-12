---
outline: [2, 3]
---

# Alert

`Alert` is a bordered box that shows one message with an icon for its variant. Use it for a message the user must notice, such as a deprecated command or a completed step that needs a follow-up. The variant sets the border color and the icon. The optional `title` is a bold line above the message.

`Alert` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Usage

```tsx
import {Box, render} from '@nemesis-oss/termina-core';
import {Alert} from '@nemesis-oss/termina-ui';

function App() {
	return (
		<Box width={60}>
			<Alert variant="warning" title="Deprecated command">
				The sync command is deprecated. Run update instead.
			</Alert>
		</Box>
	);
}

render(<App />);
```

The alert takes the width its parent gives it, so the example places it in a `Box` with a fixed width.

## Props

`AlertProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | Message. It is rendered inside a `Text` element, so pass strings or `Text` elements. |
| `variant` | `'info' \| 'success' \| 'error' \| 'warning'` | Required | Sets the border color and the icon. |
| `title` | `string` | `undefined` | Bold line above the message. Not rendered when empty. |

The variant sets these values:

| `variant` | Border color | Icon |
| --- | --- | --- |
| `info` | `blue` | `figures.info` |
| `success` | `green` | `figures.tick` |
| `error` | `red` | `figures.cross` |
| `warning` | `yellow` | `figures.warning` |

The icons come from the `figures` package. The glyph that appears depends on the terminal.

## Keyboard

`Alert` takes no input and registers no key handler.

## Theme keys

The component reads the `Alert` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | `{variant}` | Box props: `flexGrow: 1`, `borderStyle: 'round'`, `borderColor` from the variant, `gap: 1`, `paddingX: 1` |
| `styles.iconContainer` | none | Box props: `flexShrink: 0` |
| `styles.icon` | `{variant}` | Text props: `color` from the variant |
| `styles.content` | none | Box props: `flexShrink: 1`, `flexGrow: 1`, `minWidth: 0`, `flexDirection: 'column'`, `gap: 1` |
| `styles.title` | none | Text props: `bold: true` |
| `styles.message` | none | Text props: none (`{}`) |
| `config` | `{variant}` | `{icon}`, where `icon` is the icon string for the variant |

## Edge cases

- Without `title`, the message is the only line of text in the box.
- With `title`, one blank row separates the title from the message. The row comes from the `gap` of the content column.
- An empty `title` is the same as no title.
- A `Box` passed as `children` renders no output. Use strings or `Text` elements.
- A message longer than the box wraps inside the border. The message uses the default `wrap` of `Text`.
