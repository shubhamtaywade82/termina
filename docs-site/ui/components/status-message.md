---
outline: [2, 3]
---

# StatusMessage

`StatusMessage` shows one message with an icon and a color that name its kind: `success`, `error`, `warning`, or `info`. Use it for the result of an action, such as a saved file or a failed request. For a bordered message that needs attention, use [Alert](/ui/components/alert).

`StatusMessage` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

<TerminalDemo demo="status-message-basic" title="StatusMessage — four variants" />

## Usage

```tsx
import {Box, render} from '@nemesis-oss/termina-core';
import {StatusMessage} from '@nemesis-oss/termina-ui';

function Results() {
	return (
		<Box flexDirection="column" gap={1}>
			<StatusMessage variant="success">Saved 3 files</StatusMessage>
			<StatusMessage variant="info">Watching for changes</StatusMessage>
			<StatusMessage variant="warning">
				The timeout key is deprecated
			</StatusMessage>
			<StatusMessage variant="error">Upload failed: connection reset</StatusMessage>
		</Box>
	);
}

render(<Results />);
```

## Props

`StatusMessageProps` is exported from `@nemesis-oss/termina-ui`. The type of `variant` is a union of four strings. That union is not exported under its own name, so use `StatusMessageProps['variant']` when you need it as a type.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | Message. It is rendered inside a `Text` element, so pass strings or `Text` elements. |
| `variant` | `'info' \| 'success' \| 'error' \| 'warning'` | Required | Sets the icon and the color. |

## Variants

| Variant | Icon | Color |
| --- | --- | --- |
| `success` | `figures.tick`: `✔`, or `√` in the fallback set | `green` |
| `error` | `figures.cross`: `✘`, or `×` in the fallback set | `red` |
| `warning` | `figures.warning`: `⚠`, or `‼` in the fallback set | `yellow` |
| `info` | `figures.info`: `ℹ`, or `i` in the fallback set | `blue` |

`figures` uses its Unicode set when the terminal supports Unicode, and its fallback set otherwise.

## Layout

The icon sits in its own box, which does not shrink. The message wraps beside the icon, and each continuation line starts at the message column.

## Theme keys

The component reads the `StatusMessage` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `gap: 1` |
| `styles.iconContainer` | none | Box props: `flexShrink: 0` |
| `styles.icon` | `{variant}` | Text props: `color` for the variant, `green`, `red`, `yellow`, or `blue` |
| `styles.message` | none | Text props: `{}` |
| `config` | `{variant}` | `icon`: the glyph for the variant |

A `config` override replaces the whole function, so it must return an icon for every variant. [Theming](/ui/theming) describes how overrides merge.

## Edge cases

- A `variant` value outside the four names has no icon and no color. The message is drawn without an icon.
- Empty `children` draws the icon with no text after it.
