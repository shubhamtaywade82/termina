---
outline: [2, 3]
---

# LoadingBar

`LoadingBar` is an indeterminate progress bar. A four-cell block moves back and forth across a track, which shows that work is running when its total is not known. Use it for a wait such as a network request. When the total is known, use [ProgressBar](/ui/components/progress-bar), which fills in proportion to a value. When one animated glyph and a label are enough, use [Spinner](/ui/components/spinner).

`LoadingBar` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The demo switches `isActive` off and on every three seconds, so the block returns to the start of the track while the bar is paused.

<TerminalDemo demo="loading-bar-basic" title="LoadingBar — waiting for server" />

## Usage

```tsx
import {useEffect} from 'react';
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {LoadingBar} from '@nemesis-oss/termina-ui';

function WaitForServer() {
	const {exit} = useApp();

	useEffect(() => {
		const timer = setTimeout(() => {
			exit();
		}, 3000);

		return () => {
			clearTimeout(timer);
		};
	}, [exit]);

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Waiting for server...</Text>
			<LoadingBar width={30} />
		</Box>
	);
}

render(<WaitForServer />);
```

The bar animates until the app exits; set `isActive` to `false` to hold the block at the start of the track instead.

## Props

`LoadingBarProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number` | `20` | Width of the track, in cells. Fractions are rounded down. Zero and negative values draw an empty track. |
| `isActive` | `boolean` | `true` | When false, the animation stops and the block stays at the start of the track. |
| `interval` | `number` | `80` | Milliseconds between frames. |

`LoadingBar` clears its timer when it unmounts and when `isActive` turns false. It has no other props, and it draws no number or label.

## Theme keys

The component reads the `LoadingBar` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'row'` |
| `styles.track` | none | Text props: `dimColor: true`. Applied to the cells on either side of the block. |
| `styles.block` | none | Text props: `color: 'magenta'`. Applied to the block. |

The cell glyphs are set in the component, so the theme controls only their styles. The track is drawn with `figures.squareLightShade` (`░`) and the block with `figures.square` (`█`). `LoadingBar` has no config keys.

## Edge cases

- A track of one to three cells is filled by the block, and the block does not move.
- A zero or negative `width` draws nothing. The component does not throw.
- A fractional `width` is rounded down, so `width={10.9}` draws ten cells.
- Changing `width` after mount redraws the track at the new width and keeps the animation running. The block's position is calculated from the frame count, so it can jump to a different cell.
- Setting `isActive` back to `true` starts the sweep again from the start of the track.
