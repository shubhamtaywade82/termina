---
outline: [2, 3]
---

# ProgressBar

`ProgressBar` draws one horizontal bar that fills in proportion to `value`, a number from 0 to 100. Use it when the total amount of work is known, such as bytes received out of a known size. When the total is not known, use [Spinner](/ui/components/spinner) instead.

`ProgressBar` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Usage

```tsx
import {useEffect, useState} from 'react';
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {ProgressBar} from '@nemesis-oss/termina-ui';

function Download() {
	const {exit} = useApp();
	const [value, setValue] = useState(0);

	useEffect(() => {
		if (value >= 100) {
			exit();
			return;
		}

		const timer = setTimeout(() => {
			setValue(current => Math.min(100, current + 10));
		}, 150);

		return () => {
			clearTimeout(timer);
		};
	}, [value, exit]);

	return (
		<Box flexDirection="column" width={40} gap={1}>
			<Text>Downloading {value}%</Text>
			<ProgressBar value={value} />
		</Box>
	);
}

render(<Download />);
```

The example gives the bar's parent a width of 40 columns, and the bar fills that width.

## Props

`ProgressBarProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | Required | Progress, from 0 to 100. Values below 0 are drawn as 0, and values above 100 are drawn as 100. |

`ProgressBar` has no other props. It draws no number or label. To show a percentage, render it in a separate `Text`.

## Sizing

The bar's container has `flexGrow: 1` and `minWidth: 0`, so the bar takes the free width of its parent. The component measures its own width with `measureElement` after it mounts. Give the parent a fixed width, as the example does, to control the bar's width.

## Characters

Completed cells are drawn with `figures.square` (`█`). Remaining cells are drawn with `figures.squareLightShade` (`░`). Both glyphs are the same in the Unicode and fallback sets of `figures`.

For a bar `w` columns wide, the number of completed cells is `Math.round(value / 100 * w)`. The rest of the width is drawn as remaining cells.

## Theme keys

The component reads the `ProgressBar` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexGrow: 1`, `minWidth: 0` |
| `styles.completed` | none | Text props: `color: 'magenta'` |
| `styles.remaining` | none | Text props: `dimColor: true` |
| `config()` | none | `completedCharacter` (`figures.square`) and `remainingCharacter` (`figures.squareLightShade`) |

A `config` override replaces the whole function, so it must return both characters. [Theming](/ui/theming) shows a complete override.

## Edge cases

- A `value` of `NaN` draws no cells. The component renders an empty box.
- A bar with a width of 0 draws no cells.
- The bar has no animation. Each render draws the bar for the current value.
