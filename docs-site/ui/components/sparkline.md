---
outline: [2, 3]
---

# Sparkline

`Sparkline` draws a list of numbers as one row of block characters, one character per value, so a short trend fits on one line. Use it for a series over time, such as requests per second or latency over the last few minutes. For one value against a fixed 0 to 100 range, use [Gauge](/ui/components/gauge) instead. `Gauge` draws a percent, while `Sparkline` has no fixed range: it scales the values it draws to their own smallest and largest value, so it shows how a series moves, not how close its latest value is to a limit.

`Sparkline` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The p95 row passes `width={12}`, so it draws only the last 12 values, scaled between those 12.

<TerminalDemo demo="sparkline-basic" title="Sparkline — API gateway" />

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {Sparkline} from '@nemesis-oss/termina-ui';

const requestsPerSecond = [42, 45, 51, 48, 63, 70, 66, 58, 61, 77, 84, 79, 71, 68, 74, 88];

function Traffic() {
	return (
		<Box gap={1}>
			<Text>req/s</Text>
			<Sparkline data={requestsPerSecond} width={8} />
		</Box>
	);
}

render(<Traffic />);
```

`width={8}` draws only the last eight values, and the scale covers those eight.

## Props

`SparklineProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `number[]` | Required | Values to draw, one column each, from left to right. Non-finite values (`NaN`, `Infinity`, `-Infinity`) count as 0. |
| `width` | `number` | All values | Number of trailing values to draw. Earlier values are not drawn. Use a whole number. |

## Theme keys

The component reads the `Sparkline` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.bars` | none | Text props: `color: 'cyan'` |

The block glyphs (`▁▂▃▄▅▆▇█`) are set in the component, so the theme controls only their color. `Sparkline` has no config keys.

## Edge cases

- An empty `data` array draws nothing.
- A `width` of 0 or less draws nothing.
- A `width` larger than the length of `data` draws every value.
- The scale covers only the values drawn. With `width={2}`, the data `100, 0, 7` draws `▁█`: `100` is not drawn, so the scale runs from 0 to 7.
- When the drawn values are not all equal, the smallest draws `▁` and the largest draws `█`. A value in between is rounded to the nearest of the eight blocks, so a value halfway between them draws `▅`.
- When every drawn value is equal, every cell draws `▁`. A single value draws `▁`.
- `NaN`, `Infinity` and `-Infinity` count as 0 on the scale. So `[20, NaN, 70]` draws `▃▁█`.
- New `data` or `width` values take effect on the next render.
