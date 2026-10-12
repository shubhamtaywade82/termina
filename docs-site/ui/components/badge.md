---
outline: [2, 3]
---

# Badge

`Badge` shows a short label on a colored background, such as a status tag next to an item. It renders a `Text` element, so it sits inline with other text and can be placed in a `Box` row.

`Badge` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {Badge} from '@nemesis-oss/termina-ui';

function Checks() {
	return (
		<Box flexDirection="column">
			<Box gap={1}>
				<Badge color="green">pass</Badge>
				<Text>lint</Text>
			</Box>
			<Box gap={1}>
				<Badge color="red">fail</Badge>
				<Text>unit tests</Text>
			</Box>
		</Box>
	);
}

render(<Checks />);
```

## Props

`BadgeProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Required | Label. A string is uppercased before it is rendered. |
| `color` | `TextProps['color']` | `'magenta'` | Background color of the label. Accepts the same values as the `color` prop of `Text`. |

`TextProps` is exported from `@nemesis-oss/termina-core`. Its `color` type is `LiteralUnion<ForegroundColorName, string>`. The accepted forms are:

- A chalk color name, such as `green` or `redBright`.
- A hex string, such as `#f59e0b`.
- `ansi256(n)`, such as `ansi256(208)`.
- `rgb(r, g, b)`, such as `rgb(245, 158, 11)`.

`Badge` applies the value as the background color. The theme keys section below lists the style keys that use it.

## Keyboard

`Badge` takes no input and registers no key handler.

## Theme keys

The component reads the `Badge` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | `{color}` | Text props: `backgroundColor: color` |
| `styles.label` | none | Text props: `color: 'black'` |

The label is rendered inside the container with `styles.label`, so the text color of the label does not come from `color`.

## Edge cases

- A string child is converted with `toUpperCase()`, so `Success` renders as `SUCCESS`.
- Any other child is rendered unchanged. A `Text` element child keeps its case.
- The label has one space of padding on each side, inside the background. The colored area is one cell wider than the text on each side.
