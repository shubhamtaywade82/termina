---
outline: [2, 3]
---

# StreamingText

`StreamingText` shows a block of text that is still arriving, such as a reply from a language model, with a cursor after its last character while the stream is open. It runs no timer and fetches nothing: the parent appends each chunk to its own state and passes the whole string as `text`. The text wraps to the width of its parent. Use it for one growing block of text. For a complete string that should appear one character at a time, use [Typewriter](/ui/components/typewriter) instead. `Typewriter` runs its own timer over that string, while `StreamingText` runs none.

`StreamingText` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The preview replays a sample answer one chunk at a time, then starts again.

<TerminalDemo demo="streaming-text-basic" title="StreamingText — streamed answer" />

## Usage

```tsx
import {useEffect, useState} from 'react';
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {StreamingText} from '@nemesis-oss/termina-ui';

const chunks = ['Streaming ', 'output ', 'arrives ', 'in ', 'chunks.'];

function Answer() {
	const [text, setText] = useState('');
	const [isStreaming, setIsStreaming] = useState(true);

	useEffect(() => {
		let index = 0;
		const timer = setInterval(() => {
			const chunk = chunks[index];
			index += 1;
			setText(previous => previous + chunk);

			if (index === chunks.length) {
				setIsStreaming(false);
				clearInterval(timer);
			}
		}, 200);

		return () => {
			clearInterval(timer);
		};
	}, []);

	return (
		<Box flexDirection="column">
			<Text>Assistant</Text>
			<StreamingText text={text} isStreaming={isStreaming} />
		</Box>
	);
}

render(<Answer />);
```

The parent appends each chunk to `text` and sets `isStreaming` to `false` when the stream ends, which removes the cursor.

## Props

`StreamingTextProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | Required | All text received so far. The parent appends each chunk and passes the whole string. The component keeps no copy of earlier text. |
| `isStreaming` | `boolean` | `true` | While true, a cursor (`▋`) follows the text. Set it to false when the stream ends to remove the cursor. |

## Theme keys

The component reads the `StreamingText` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.text` | none | Text props: none set. The text uses the terminal's default color. |
| `styles.cursor` | none | Text props: `color: 'blue'`. The glyph `▋` is set in the component, so the theme controls only its color. |

`StreamingText` has no config keys.

## Edge cases

- Empty `text` while `isStreaming` is true shows only the cursor.
- Empty `text` with `isStreaming` set to false renders no output.
- A shorter `text` on a later render replaces the earlier output. The component keeps no copy of the text it was given before.
- A line break in `text` starts a new line, and the cursor follows the last character.
- A line break at the end of `text` puts the cursor on an empty line.
- When the last line is full, the cursor moves to a new line.
- The component runs no timer. The cursor does not blink, and nothing redraws on its own.
