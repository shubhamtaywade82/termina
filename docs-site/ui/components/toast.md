---
outline: [2, 3]
---

# Toast

`Toast` shows one message for a few seconds, then hides itself and calls `onDismiss`. Use it to confirm an action that needs no reply, such as a finished deploy. It is a [StatusMessage](/ui/components/status-message) with a countdown: the icon and colors are the same, and the message hides once the countdown ends. For a bordered message that stays until the parent removes it, use [Alert](/ui/components/alert).

`Toast` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Press `d` to deploy; the toast hides itself after three seconds, and pressing `d` again while it shows restarts the countdown.

<TerminalDemo demo="toast-basic" title="Toast — auto-dismiss" />

## Usage

```tsx
import {useState} from 'react';
import {Box, Text, render, useInput} from '@nemesis-oss/termina-core';
import {Toast} from '@nemesis-oss/termina-ui';

function Save() {
	const [saveCount, setSaveCount] = useState(0);

	useInput(input => {
		if (input === 's') {
			setSaveCount(count => count + 1);
		}
	});

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Press s to save</Text>
			{saveCount > 0 && (
				<Toast key={saveCount} variant="success">
					Saved {saveCount} time(s)
				</Toast>
			)}
		</Box>
	);
}

render(<Save />);
```

Changing `key` remounts the toast, so each save starts a new countdown.

## Props

`ToastProps` is exported from `@nemesis-oss/termina-ui`. The type of `variant` is a union of four strings that is not exported under its own name, so use `ToastProps['variant']` when you need it as a type.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | Message. It is rendered inside a `Text` element through `StatusMessage`, so pass strings or `Text` elements. |
| `variant` | `'info' \| 'success' \| 'error' \| 'warning'` | `'info'` | Sets the icon and color, as in `StatusMessage`. |
| `durationMs` | `number` | `3000` | Milliseconds before the toast hides itself. `0`, a negative value, or a value above 2147483647 (including `Infinity`) keeps it until it unmounts. |
| `onDismiss` | `() => void` | `undefined` | Called once, when the toast hides itself. It is not called if the toast unmounts first. |

## Theme keys

The component reads the `Toast` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `paddingX: 1` |

`Toast` has no config keys. The icon and color come from the `StatusMessage` theme entry, so change them there.

## Edge cases

- Changing `key` remounts the toast, which restarts its countdown. Use this to show the toast again after it has hidden, or to restart it while it shows.
- Changing `durationMs` while the toast shows restarts the countdown with the new value.
- Re-rendering with new `children`, `variant`, or `onDismiss` does not restart the countdown. When the toast hides, `onDismiss` is the one from the latest render.
- After the toast hides, re-rendering it does not show it again and does not call `onDismiss` again.
- Unmounting before the countdown ends cancels it, so `onDismiss` is not called.
- A `durationMs` of `0`, a negative value, or a value above 2147483647 (including `Infinity`) keeps the toast until it unmounts, and `onDismiss` is never called. `setTimeout` fires a negative or oversized delay at once, so those values are treated like `0`.
