---
outline: [2, 3]
---

# Typewriter

`Typewriter` reveals a string one character at a time, as if it were being typed, and shows a block cursor after the revealed text while it types. Use it for a short message that is known in full before it is shown, such as a greeting or onboarding text. For text that arrives in pieces from a stream, use [StreamingText](/ui/components/streaming-text) instead. `StreamingText` shows the text its parent passes, as it arrives, and it has no timer. `Typewriter` runs its own timer over a complete string, and its cursor disappears once the reveal ends.

`Typewriter` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The greeting types out at 40 characters per second, and the status line changes to ready once the second line is complete.

<TerminalDemo demo="typewriter-basic" title="Typewriter — onboarding" />

## Usage

```tsx
import {useState} from 'react';
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {Typewriter} from '@nemesis-oss/termina-ui';

function Welcome() {
	const [isReady, setIsReady] = useState(false);

	return (
		<Box flexDirection="column" gap={1}>
			<Typewriter
				text="Welcome to termina. Build terminal apps with React."
				speed={40}
				onComplete={() => {
					setIsReady(true);
				}}
			/>
			{isReady && <Text color="green">› ready</Text>}
		</Box>
	);
}

render(<Welcome />);
```

`onComplete` runs after the last character is rendered, so the status line appears right after the full text.

## Props

`TypewriterProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | Required | Text to reveal. Changing it restarts the reveal from the first character. |
| `speed` | `number` | `30` | Characters revealed per second. |
| `cursor` | `boolean` | `true` | Show a block cursor after the revealed text while it is still typing. The cursor is hidden once the whole text is shown. |
| `onComplete` | `() => void` | `undefined` | Called once when the whole text is shown. |

## Theme keys

The component reads the `Typewriter` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.text` | none | Text props: none. The revealed text uses the terminal's default color. |
| `styles.cursor` | none | Text props: `color: 'blue'`. |

The cursor glyph, `▋`, is set in the component, so the theme controls only its color.

`Typewriter` has no config keys.

## Edge cases

- Empty `text` is complete at once. No cursor is shown, and `onComplete` runs once after mount.
- Changing `text` restarts the reveal from the first character. `onComplete` runs again when the new text is shown, including when the new text is empty.
- Changing `speed` after mount restarts the timer at the new rate. The reveal keeps its position.
- Re-rendering with the same `text` does not restart the reveal. `onComplete` is called once per text, with the function from the latest render before the text completes. A new function passed after completion does not call it again.
- Text is split by code point, so an emoji such as `😀` is never cut in half. A character made of several code points, such as a skin-tone emoji, is revealed one code point at a time, so a partial character can show for one step.
- `onComplete` runs after the last character is rendered.
- For text that is not empty, a `speed` of zero, a negative number, or `NaN` starts no timer. The cursor stays, and `onComplete` is not called.
- Unmounting before the text is shown stops the timer, and `onComplete` is not called.
