---
outline: [2, 3]
---

# Layout and Text

`Box` is the flex container and the element that carries layout and styling props. `Text` holds strings and styles them. `Newline`, `Spacer`, and `Transform` complete the set of text and spacing elements. `measureElement()` and `useBoxMetrics()` read the layout of a `Box` after it has been laid out. Layout is computed by Yoga, the flexbox engine that `@nemesis-oss/termina-core` uses. Use this page for the props of these components and their rules. For how frames reach the terminal, read [Rendering](/guide/rendering).

## Preview

A row with a border and padding holds a text at each end, with a `Spacer` between them.

<TerminalPreview id="layout-and-text-status-bar" />

A column with a fixed height has a one-row header and footer, and a body that takes the remaining rows.

<TerminalPreview id="layout-and-text-column-screen" />

A column holds a `Newline` that splits one `Text` into two rows, and a line with `wrap="truncate"` that is cut to one row.

<TerminalPreview id="layout-and-text-newline-truncate" />

## Box

`Box` accepts the style props of the renderer, except `textWrap`, which belongs to `Text`. It also accepts accessibility props, mouse handlers, and a `ref`. The tables below list every prop. For the props that `Box` sets itself, the default column shows that value. For the other props, it shows the layout engine's default, or `unset` when there is no default to show.

### Flex container and item props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `flexDirection` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'` | `'row'` | Main axis of the children. |
| `flexWrap` | `'nowrap' \| 'wrap' \| 'wrap-reverse'` | `'nowrap'` | Whether children wrap onto new lines. |
| `flexGrow` | `number` | `0` | Share of the free space this element takes along its parent's main axis. |
| `flexShrink` | `number` | `1` | Share of the overflow this element gives up along its parent's main axis. |
| `flexBasis` | `number \| string` | `auto` | Initial size before free space is distributed. A string is a percentage of the parent. |
| `alignItems` | `'flex-start' \| 'center' \| 'flex-end' \| 'stretch' \| 'baseline'` | `'stretch'` | Alignment of the children on the cross axis. |
| `alignSelf` | `'flex-start' \| 'center' \| 'flex-end' \| 'auto' \| 'stretch' \| 'baseline'` | `'auto'` | Overrides `alignItems` for this element. |
| `alignContent` | `'flex-start' \| 'flex-end' \| 'center' \| 'stretch' \| 'space-between' \| 'space-around' \| 'space-evenly'` | `'flex-start'` | Alignment of wrapped lines on the cross axis. |
| `justifyContent` | `'flex-start' \| 'flex-end' \| 'space-between' \| 'space-around' \| 'space-evenly' \| 'center'` | `'flex-start'` | Alignment of the children on the main axis. |
| `display` | `'flex' \| 'none'` | `'flex'` | `'none'` removes the element from layout and output. |

### Size props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number \| string` | `auto` | Width in columns. A string is a percentage of the parent width. |
| `height` | `number \| string` | `auto` | Height in rows. A string is a percentage of the parent height. |
| `minWidth` | `number` | `unset` | Minimum width in columns. Percentages are not supported. |
| `minHeight` | `number \| string` | `unset` | Minimum height in rows. A string is a percentage of the parent height. |
| `maxWidth` | `number` | `unset` | Maximum width in columns. Percentages are not supported. |
| `maxHeight` | `number \| string` | `unset` | Maximum height in rows. A string is a percentage of the parent height. |
| `aspectRatio` | `number` | `unset` | Width-to-height ratio. Needs at least one of `width`, `height`, `minHeight`, or `maxHeight`. |

### Position props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `'absolute' \| 'relative' \| 'static'` | `'relative'` | How the element is positioned. `top`, `right`, `bottom`, and `left` are ignored when this is `'static'`. |
| `top` | `number \| string` | `unset` | Offset from the top edge. A string is a percentage of the parent. |
| `right` | `number \| string` | `unset` | Offset from the right edge. A string is a percentage of the parent. |
| `bottom` | `number \| string` | `unset` | Offset from the bottom edge. A string is a percentage of the parent. |
| `left` | `number \| string` | `unset` | Offset from the left edge. A string is a percentage of the parent. |

### Spacing props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `margin` | `number` | `unset` | Margin on all four sides. |
| `marginX` | `number` | `unset` | Left and right margin. |
| `marginY` | `number` | `unset` | Top and bottom margin. |
| `marginTop` | `number` | `unset` | Top margin. |
| `marginBottom` | `number` | `unset` | Bottom margin. |
| `marginLeft` | `number` | `unset` | Left margin. |
| `marginRight` | `number` | `unset` | Right margin. |
| `padding` | `number` | `unset` | Padding on all four sides. |
| `paddingX` | `number` | `unset` | Left and right padding. |
| `paddingY` | `number` | `unset` | Top and bottom padding. |
| `paddingTop` | `number` | `unset` | Top padding. |
| `paddingBottom` | `number` | `unset` | Bottom padding. |
| `paddingLeft` | `number` | `unset` | Left padding. |
| `paddingRight` | `number` | `unset` | Right padding. |
| `gap` | `number` | `unset` | Space between columns and between rows. |
| `columnGap` | `number` | `unset` | Space between columns. |
| `rowGap` | `number` | `unset` | Space between rows. |

The shorthand props are applied first, then the axis props, then the side props, so a later prop overrides an earlier one. For example, `margin={1} marginX={0}` leaves the left and right margins at 0 and the top and bottom margins at 1. `gap` is applied before `columnGap` and `rowGap` in the same way.

### Border props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `borderStyle` | `'single' \| 'double' \| 'round' \| 'bold' \| 'singleDouble' \| 'doubleSingle' \| 'classic' \| 'arrow' \| BoxStyle` | `unset` (no border) | Border characters. See the Borders section. |
| `borderTop` | `boolean` | `true` | Whether the top border is drawn. |
| `borderBottom` | `boolean` | `true` | Whether the bottom border is drawn. |
| `borderLeft` | `boolean` | `true` | Whether the left border is drawn. |
| `borderRight` | `boolean` | `true` | Whether the right border is drawn. |
| `borderColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Color of all four borders. |
| `borderTopColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Color of the top border. Overrides `borderColor`. |
| `borderBottomColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Color of the bottom border. Overrides `borderColor`. |
| `borderLeftColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Color of the left border. Overrides `borderColor`. |
| `borderRightColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Color of the right border. Overrides `borderColor`. |
| `borderDimColor` | `boolean` | `false` | Dims all four borders. |
| `borderTopDimColor` | `boolean` | `false` | Dims the top border. Overrides `borderDimColor`. |
| `borderBottomDimColor` | `boolean` | `false` | Dims the bottom border. Overrides `borderDimColor`. |
| `borderLeftDimColor` | `boolean` | `false` | Dims the left border. Overrides `borderDimColor`. |
| `borderRightDimColor` | `boolean` | `false` | Dims the right border. Overrides `borderDimColor`. |
| `borderBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Background of all four borders. |
| `borderTopBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Background of the top border. Overrides `borderBackgroundColor`. |
| `borderBottomBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Background of the bottom border. Overrides `borderBackgroundColor`. |
| `borderLeftBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Background of the left border. Overrides `borderBackgroundColor`. |
| `borderRightBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Background of the right border. Overrides `borderBackgroundColor`. |

Color values are the same as the `color` prop of `Text`. See the Text colors section.

### Overflow and content offset props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `overflow` | `'visible' \| 'hidden'` | `'visible'` | Overflow in both directions. |
| `overflowX` | `'visible' \| 'hidden'` | `'visible'` | Overflow in the horizontal direction. Overrides `overflow` for that axis. |
| `overflowY` | `'visible' \| 'hidden'` | `'visible'` | Overflow in the vertical direction. Overrides `overflow` for that axis. |
| `contentOffsetX` | `number` | `0` | Columns to shift the children left. |
| `contentOffsetY` | `number` | `0` | Rows to shift the children up. |

Offsets are truncated toward zero. A value that is not finite, such as `NaN` or `Infinity`, is treated as `0`.

### Color props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `backgroundColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Background of the element. Descendant `Box` and `Text` elements inherit it unless they set their own. |

### Accessibility props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | `string` | `unset` | Text that replaces the children in screen reader mode. |
| `aria-hidden` | `boolean` | `unset` | In screen reader mode, the element renders nothing. |
| `aria-role` | `'button' \| 'checkbox' \| 'combobox' \| 'list' \| 'listbox' \| 'listitem' \| 'menu' \| 'menuitem' \| 'option' \| 'progressbar' \| 'radio' \| 'radiogroup' \| 'tab' \| 'tablist' \| 'table' \| 'textbox' \| 'timer' \| 'toolbar'` | `unset` | Role of the element for the screen reader output. |
| `aria-state` | `{busy?, checked?, disabled?, expanded?, multiline?, multiselectable?, readonly?, required?, selected?: boolean}` | `unset` | State of the element for the screen reader output. |

These props take effect in screen reader mode. See [Screen reader mode](/guide/rendering).

### Mouse props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onClick` | `(event: MouseEvent) => void` | `unset` | Called when the element is pressed and released in place. A descendant without its own `onClick` passes the click to this element. |
| `onMouseDown` | `(event: MouseEvent) => void` | `unset` | Called when a mouse button goes down over this element or a descendant. |
| `onMouseUp` | `(event: MouseEvent) => void` | `unset` | Called when a mouse button comes up over this element or a descendant. |
| `onWheel` | `(event: MouseEvent) => void` | `unset` | Called for each wheel step over this element or a descendant. |

Mouse handlers receive events only when the app is rendered with `mouse: true`. `MouseEvent` is exported from `@nemesis-oss/termina-core`. See [Mouse](/guide/mouse).

### Other props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | `unset` | Content of the element. |
| `ref` | `Ref<DOMElement>` | `unset` | Receives the underlying element. Pass it to `measureElement()` or `useBoxMetrics()`. |

### Flex layout

`Box` sets `flexDirection="row"`, `flexWrap="nowrap"`, `flexGrow={0}`, and `flexShrink={1}`. Yoga's own defaults are a column direction and a `flexShrink` of `0`, and `Box` overrides both.

- Children of a row container are as wide as their content, unless `flexGrow` or `width` changes that.
- Children of a column container stretch to the container's width by default, because `alignItems` defaults to `'stretch'`.
- The root of a render has no style of its own. Its top-level elements stack vertically and, because of the stretch default, span the terminal width.
- Because `flexShrink` is `1` by default, children of a fixed-size container shrink to fit. A child can lose rows or columns. Set `flexShrink={0}` on a child to keep its natural size.

```tsx
import {Box, Spacer, Text, render} from '@nemesis-oss/termina-core';

const StatusBar = () => (
	<Box width={40} paddingX={1} borderStyle="single">
		<Text bold>termina</Text>
		<Spacer />
		<Text color="gray">ready</Text>
	</Box>
);

render(<StatusBar />);
```

A column with a header, a body that takes the remaining rows, and a footer:

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';

const Screen = () => (
	<Box flexDirection="column" height={8} borderStyle="round">
		<Box height={1}>
			<Text>header</Text>
		</Box>
		<Box flexGrow={1} paddingX={1}>
			<Text>The body takes the rows that remain.</Text>
		</Box>
		<Box height={1}>
			<Text color="gray">footer</Text>
		</Box>
	</Box>
);

render(<Screen />);
```

Children that wrap onto new lines when they do not fit the row:

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';

const tags = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];

const Tags = () => (
	<Box width={24} flexWrap="wrap" columnGap={1}>
		{tags.map(tag => (
			<Box key={tag} borderStyle="single" paddingX={1}>
				<Text>{tag}</Text>
			</Box>
		))}
	</Box>
);

render(<Tags />);
```

### Position

- `position="absolute"` removes the element from the flow. It is placed by its `top`, `right`, `bottom`, and `left` offsets, measured from the parent.
- `position="relative"` shifts the element by its offsets, and it keeps its place in the flow.
- `position="static"` ignores the offsets.
- A string offset such as `top="50%"` is a percentage of the parent.

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';

const Card = () => (
	<Box width={30} height={4} borderStyle="round" paddingX={1}>
		<Text>Deploy</Text>
		<Box position="absolute" top={0} right={2}>
			<Text color="yellow">new</Text>
		</Box>
	</Box>
);

render(<Card />);
```

`display="none"` removes the element from layout and output. Its siblings close the gap.

### Borders

`borderStyle` selects the characters. The named styles are `single`, `double`, `round`, `bold`, `singleDouble`, `doubleSingle`, `classic`, and `arrow`. Pass an object to use other characters. It needs the eight string fields `topLeft`, `top`, `topRight`, `right`, `bottomRight`, `bottom`, `bottomLeft`, and `left`.

- Each drawn side takes one column or row from the box. The `clientWidth` and `clientHeight` values of `measureElement()` and `useBoxMetrics()` exclude the borders.
- A side set to `false` with `borderTop`, `borderBottom`, `borderLeft`, or `borderRight` is not drawn and takes no space.
- With no `borderStyle`, no border is drawn, and the four side props have no effect.

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';

const Notice = () => (
	<Box
		width={30}
		paddingX={1}
		borderStyle="double"
		borderColor="cyan"
		borderBottom={false}
	>
		<Text color="cyan" bold>
			Heads up
		</Text>
	</Box>
);

render(<Notice />);
```

### Overflow and content offset

With `overflow="hidden"`, children are clipped to the area inside the element's border. `overflowX` and `overflowY` set the clipping per axis.

`contentOffsetX` and `contentOffsetY` move the children without changing the element's size. A positive offset moves the children left or up. Combined with `overflow="hidden"`, they make a scrolling view. To keep the content at its natural height, give the content wrapper `flexShrink={0}`, as the next example does. [ScrollBox](/ui/components/scroll-box) implements this pattern.

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';

const lines = Array.from({length: 12}, (_, index) => `line ${index + 1}`);

const Viewport = ({offset}: {readonly offset: number}) => (
	<Box height={5} overflow="hidden" borderStyle="single">
		<Box flexDirection="column" flexShrink={0} contentOffsetY={offset}>
			{lines.map(line => (
				<Box key={line} flexShrink={0}>
					<Text>{line}</Text>
				</Box>
			))}
		</Box>
	</Box>
);

render(<Viewport offset={4} />);
```

### Color

`backgroundColor` fills the element's area. A `Box` or `Text` inside it inherits the background unless it sets its own `backgroundColor`.

### Accessibility and mouse

The accessibility props change output only in screen reader mode. `aria-hidden` removes the element. `aria-label` replaces the children with the label text. `aria-role` and `aria-state` are attached to the element for the screen reader output.

The mouse handlers are described in the Mouse props table above.

## Text

`Text` renders strings. Strings that are not inside a `Text` throw an error during rendering. `Text` elements can be nested. An inner `Text` keeps the outer styles and applies its own.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Foreground color. See the Text colors section. |
| `backgroundColor` | `LiteralUnion<ForegroundColorName, string>` | `unset` | Background color. When unset, the background of the nearest ancestor `Box` or `Text` is used. |
| `dimColor` | `boolean` | `false` | Dims the text. |
| `bold` | `boolean` | `false` | Bold text. |
| `italic` | `boolean` | `false` | Italic text. |
| `underline` | `boolean` | `false` | Underlined text. |
| `strikethrough` | `boolean` | `false` | Text with a line through it. |
| `inverse` | `boolean` | `false` | Swaps the foreground and background colors. |
| `wrap` | `'wrap' \| 'hard' \| 'truncate-end' \| 'truncate' \| 'truncate-middle' \| 'truncate-start'` | `'wrap'` | How text wider than its element is wrapped or cut. See the Wrapping and truncation section. |
| `aria-label` | `string` | `unset` | Text that replaces the children in screen reader mode. |
| `aria-hidden` | `boolean` | `false` | In screen reader mode, the element renders nothing. |
| `children` | `ReactNode` | `unset` | Content of the element. |

### Text colors

`color` and `backgroundColor` accept these values:

- A named color from the chalk list: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `blackBright`, `gray`, `grey`, `redBright`, `greenBright`, `yellowBright`, `blueBright`, `magentaBright`, `cyanBright`, and `whiteBright`.
- A hex value, `#rrggbb`.
- `ansi256(n)`, where `n` is a palette index.
- `rgb(r, g, b)`.

Any other string is ignored, and the text is drawn without that color. Hex, `ansi256`, and `rgb` values are converted to the color level that chalk detects from the environment, such as `FORCE_COLOR`, `NO_COLOR`, `TERM`, and `COLORTERM`.

### Wrapping and truncation

| `wrap` | Behavior |
| --- | --- |
| `'wrap'` (default) | Wraps at spaces to fit the element's width. A word wider than the element is broken. |
| `'hard'` | Fills each line to the full width and breaks at the column edge, ignoring word boundaries. |
| `'truncate-end'` | Keeps one line for each line of the text and cuts the end with `…`. |
| `'truncate'` | Same as `'truncate-end'`. |
| `'truncate-middle'` | Keeps one line for each line of the text and cuts the middle with `…`, keeping both ends. |
| `'truncate-start'` | Keeps one line for each line of the text and cuts the start with `…`, keeping the end. |

Truncation applies to each line of multi-line text separately. When the element has no room, `'wrap'` and `'hard'` keep the text at its natural width, and truncation produces no text.

```tsx
import {Box, Newline, Text, render} from '@nemesis-oss/termina-core';

const Message = () => (
	<Box flexDirection="column" width={20}>
		<Text color="green" bold>
			Build passed
		</Text>
		<Text dimColor wrap="truncate">
			{'3 suites, 42 tests, and a long trailing summary'}
		</Text>
		<Text>
			line one
			<Newline />
			line two
		</Text>
	</Box>
);

render(<Message />);
```

## Newline

`Newline` inserts line breaks inside a `Text`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | `1` | Number of line breaks to insert. |

## Spacer

`Spacer` takes all the free space along its parent's main axis. It is a `Box` with `flexGrow={1}`. It has no props.

```tsx
import {Box, Spacer, Text, render} from '@nemesis-oss/termina-core';

const Row = () => (
	<Box width={20}>
		<Text>Left</Text>
		<Spacer />
		<Text>Right</Text>
	</Box>
);

render(<Row />);
```

## Transform

`Transform` passes the rendered text of its children to a function, and writes the function's result. Use it for line prefixes, numbering, or links. The function receives text that still contains escape sequences for the styles of its children, so it must keep those sequences intact.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `transform` | `(children: string, index: number) => string` | Required | Receives the text of each line and its line index, and returns the text to write. |
| `accessibilityLabel` | `string` | `unset` | In screen reader mode, the text rendered in place of the children. |
| `children` | `ReactNode` | `unset` | Content to transform. Renders nothing when this is `undefined` or `null`. |

The rules are as follows:

- `index` is the zero-based line index of the line. It stays the same when overflow clips the top rows.
- Nested `Transform` elements apply the innermost function first.
- Layout is measured before `transform` runs. A function that makes a line wider does not widen the layout, so the output can extend past the element's box.
- In screen reader mode the `transform` function is not applied. `accessibilityLabel`, when set, is rendered in place of the children.

```tsx
import {Text, Transform, render} from '@nemesis-oss/termina-core';

const Numbered = () => (
	<Transform transform={(line, index) => `${index + 1}. ${line}`}>
		<Text color="green">
			first
			{'\n'}
			second
		</Text>
	</Transform>
);

render(<Numbered />);
```

## Measuring layout

Layout is available after the first layout pass. Two APIs read it. `measureElement()` takes a snapshot when you call it. `useBoxMetrics()` tracks the values and re-renders when they change.

### measureElement()

```ts
measureElement(node: DOMElement): ElementMetrics;
```

Call it after rendering, for example in `useEffect`, `useLayoutEffect`, an input handler, or a timer. Before layout is calculated, for example during render, the function returns zeros for every field.

`ElementMetrics` has these fields:

| Field | Type | Description |
| --- | --- | --- |
| `x` | `number` | Column of the element. Sums the layout offsets of the element and each of its ancestors, so the value is relative to the top-left of the live layout region, not the terminal viewport. |
| `y` | `number` | Row of the element. Summed the same way as `x`. |
| `width` | `number` | Width of the element, including its borders. |
| `height` | `number` | Height of the element, including its borders. |
| `clientWidth` | `number` | Width without the left and right borders. Padding is not excluded. |
| `clientHeight` | `number` | Height without the top and bottom borders. Padding is not excluded. |

The `x` and `y` values do not include the `contentOffsetX` or `contentOffsetY` of an ancestor. To hit-test inside a scrolled container, subtract those offsets.

```tsx
import {useEffect, useRef, useState} from 'react';
import {Box, Text, measureElement, render, type DOMElement} from '@nemesis-oss/termina-core';

const Measured = () => {
	const ref = useRef<DOMElement>(null);
	const [size, setSize] = useState('not measured');

	useEffect(() => {
		if (ref.current) {
			const {clientWidth, clientHeight} = measureElement(ref.current);
			setSize(`${clientWidth} x ${clientHeight}`);
		}
	}, []);

	return (
		<Box ref={ref} width={20} height={5} borderStyle="single">
			<Text>{size}</Text>
		</Box>
	);
};

render(<Measured />);
```

### useBoxMetrics()

```ts
useBoxMetrics(ref: RefObject<DOMElement | null>): UseBoxMetricsResult;
```

`useBoxMetrics()` returns the metrics of the element that `ref` points to. It updates after each render of the component that calls it, and after each layout pass of the app. Every metric is `0` until the first layout pass. `hasMeasured` is `false` until the ref points to an element.

| Field | Type | Description |
| --- | --- | --- |
| `width` | `number` | Width of the element, including its borders. |
| `height` | `number` | Height of the element, including its borders. |
| `left` | `number` | Distance from the left edge of the parent. Layout coordinates, without an ancestor's `contentOffsetX`. |
| `top` | `number` | Distance from the top edge of the parent. Layout coordinates, without an ancestor's `contentOffsetY`. |
| `clientWidth` | `number` | Width without the left and right borders. |
| `clientHeight` | `number` | Height without the top and bottom borders. |
| `hasMeasured` | `boolean` | `true` once the ref points to an element. |

```tsx
import {useRef} from 'react';
import {Box, Text, render, useBoxMetrics, type DOMElement} from '@nemesis-oss/termina-core';

const LiveWidth = () => {
	const ref = useRef<DOMElement>(null);
	const {width, hasMeasured} = useBoxMetrics(ref);

	return (
		<Box ref={ref} borderStyle="single" paddingX={1}>
			<Text>{hasMeasured ? `width ${width}` : 'measuring'}</Text>
		</Box>
	);
};

render(<LiveWidth />);
```

### Choosing between them

| | `measureElement()` | `useBoxMetrics()` |
| --- | --- | --- |
| Timing | Reads the layout at the moment of the call. | Re-renders the component when the layout changes. |
| Position | `x` and `y` are summed from the root of the layout region. | `left` and `top` are relative to the parent. |
| Use when | You need a value once, such as after mount or in an input handler. | The rendered output depends on the size or position of an element. |

For the internal layout pipeline, see [Ink Internals](/architecture/ink-internals).
