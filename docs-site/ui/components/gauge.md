---
outline: [2, 3]
---

# Gauge

`Gauge` shows one percentage as a row: an optional label, a bar of filled and empty cells, and the percent. Use it for a value with a known good and bad range, such as CPU or memory use. The filled cells turn yellow from 70 percent and red from 90 percent. For a bar that fills the width of its parent as work completes, use [ProgressBar](/ui/components/progress-bar) instead. `ProgressBar` draws no label, no number and no color bands, and its width comes from its parent, not from a prop.

`Gauge` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The four metrics show all three colors: CPU and DSK are green, MEM is yellow, and NET is red.

<TerminalDemo demo="gauge-basic" title="Gauge — host metrics" />

## Usage

```tsx
import {Box, render} from '@nemesis-oss/termina-core';
import {Gauge} from '@nemesis-oss/termina-ui';

function Metrics() {
	return (
		<Box flexDirection="column" gap={1}>
			<Gauge label="CPU" value={42} />
			<Gauge label="MEM" value={78} />
			<Gauge label="NET" value={93} width={30} />
		</Box>
	);
}

render(<Metrics />);
```

Each gauge takes one row, and the `Box` puts a blank row between them.

## Props

`GaugeProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | Required | Percent to show, from 0 to 100. Values outside the range are clamped, and `NaN` counts as 0. The shown percent is rounded to a whole number. The bar and the color use the exact value. |
| `label` | `string` | `undefined` | Text drawn before the bar, with one column between them. An empty string draws nothing. |
| `width` | `number` | `20` | Number of cells in the bar. Use a whole number of 1 or more. |
| `showValue` | `boolean` | `true` | Draws the percent after the bar. When false, the bar is the last thing in the row. |

## Theme keys

The component reads the `Gauge` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'row'`, `gap: 1` |
| `styles.label` | none | Text props: none set |
| `styles.filled` | none | Text props: none set. The component sets `color` from `config` first, so a `color` returned here overrides it. |
| `styles.empty` | none | Text props: `dimColor: true` |
| `styles.value` | none | Text props: none set |
| `config` | `{value}` | `{color}`: `'green'` below 70, `'yellow'` from 70 to below 90, `'red'` from 90 |

The bar is drawn with `figures.square` (`█`) for filled cells and `figures.squareLightShade` (`░`) for empty cells. The glyphs are set in the component, so the theme controls how the cells are styled, not which characters are drawn. `config` receives the clamped value, before the text is rounded.

## Edge cases

- Values above 100 draw a full bar and show `100%`. Values below 0 draw an empty bar and show `0%`.
- `NaN` draws as an empty bar and shows `0%`.
- The shown percent is rounded to a whole number, but the bar and the color use the exact value. So `89.6` draws 18 cells in yellow and shows `90%`.
- A value of exactly 70 is yellow, and a value of exactly 90 is red.
- An empty `label` draws nothing, so the bar starts at the left edge of the row.
- A negative `width` throws a `RangeError` when the component renders. The component does not guard against it.
- A `width` of `0` draws no bar, so the row starts with the space before the percent.
- Changing `value` takes effect on the next render.
