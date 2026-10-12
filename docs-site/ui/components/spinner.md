---
outline: [2, 3]
---

# Spinner

`Spinner` shows one frame of an animation and an optional label. Use it while work runs and the time it needs is not known. When the progress is known, use [ProgressBar](/ui/components/progress-bar).

`Spinner` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Usage

```tsx
import {useEffect} from 'react';
import {render, useApp} from '@nemesis-oss/termina-core';
import {Spinner} from '@nemesis-oss/termina-ui';

function Install() {
	const {exit} = useApp();

	useEffect(() => {
		const timer = setTimeout(() => {
			exit();
		}, 3000);

		return () => {
			clearTimeout(timer);
		};
	}, [exit]);

	return <Spinner type="dots" label="Installing dependencies" />;
}

render(<Install />);
```

The example exits after three seconds.

## Props

`SpinnerProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `SpinnerName` from `cli-spinners` | `'dots'` | The animation to play. The names are the keys of the `cli-spinners` package, such as `dots` and `line`. |
| `label` | `string` | `undefined` | Text drawn after the frame, separated by one column. Not drawn when empty. |

## Frames

Each animation is a list of frames and an interval in milliseconds. The component moves to the next frame on each interval and returns to the first frame after the last one. The default, `dots`, has 10 frames at 80 ms. `line` has 4 frames at 130 ms.

## Hook

`useSpinner` is exported from `@nemesis-oss/termina-ui`, and the component is built on it. The hook takes the same `type` option and returns the current frame as a string. `UseSpinnerProps` and `UseSpinnerResult` are also exported. Use the hook when the frame has to sit inside your own layout.

```tsx
import {Text, render} from '@nemesis-oss/termina-core';
import {useSpinner} from '@nemesis-oss/termina-ui';

function Waiting() {
	const {frame} = useSpinner({type: 'line'});

	return <Text>{frame} Waiting for the server</Text>;
}

render(<Waiting />);
```

The example runs until the process is stopped.

## Theme keys

The component reads the `Spinner` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `gap: 1` |
| `styles.frame` | none | Text props: `color: 'blue'` |
| `styles.label` | none | Text props: `{}`. The label has no style by default. |

`Spinner` has no config keys.

## Edge cases

- The timer starts on mount and is cleared on unmount.
- Changing `type` restarts the timer but keeps the current frame index. If that index is past the last frame of the new animation, the frame is empty, and the index keeps increasing, so no frame is drawn for the rest of the component's life. To avoid this, give the component a new `key` when `type` changes, so React mounts it again.
- An unknown `type` name is not checked by the component. Nothing is drawn.
- An empty `label` draws no label text.
