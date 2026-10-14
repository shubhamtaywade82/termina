---
outline: [2, 3]
---

# SplitPane

`SplitPane` shows two panes separated by a one-cell divider. The panes sit side by side when the width allows, and stack when it does not. Use it for a list beside a detail view, or for a log above a prompt. The first pane takes `ratio` of the length, and the second pane takes the rest. With `resizable`, the user can move the divider with the keyboard, and neither pane goes below `minSize`.

`SplitPane` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Press Tab to focus the split. Then Ctrl+Left and Ctrl+Right move the divider one cell at a time.

<TerminalDemo demo="split-pane-basic" title="SplitPane — files and editor" />

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {SplitPane} from '@nemesis-oss/termina-ui';

const files = ['src/index.ts', 'src/render.ts', 'src/App.tsx', 'README.md'];

function Workspace() {
	return (
		<Box height={12}>
			<SplitPane defaultRatio={0.3} minSize={12} resizable>
				<Box flexDirection="column">
					{files.map(file => (
						<Text key={file}>{file}</Text>
					))}
				</Box>
				<Text>Editor</Text>
			</SplitPane>
		</Box>
	);
}

render(<Workspace />);
```

The example gives the split a height. Stacked panes need one, as described in [Layout](#layout).

## Props

`SplitPaneProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | required | Exactly two elements, the first pane and the second pane. Any other count throws an error. |
| `direction` | `'row' \| 'column'` | `'row'` | `'row'` places the panes side by side. `'column'` stacks them. |
| `ratio` | `number` | `undefined` | Share of the length that the first pane takes, from `0` to `1`. The divider counts in the length. Setting it makes the ratio controlled. See Controlled ratio below. |
| `defaultRatio` | `number` | `0.5` | Starting ratio when `ratio` is not set. Resize keys then move the divider without any parent. |
| `onRatioChange` | `(ratio: number) => void` | `undefined` | Called with the new ratio after a resize key moves the divider. |
| `minSize` | `number` | `10` | Fewest cells either pane may take side by side. A resize key stops at this size. Stacked panes are not clamped to it. |
| `breakpoint` | `number` | `60` | Width below which a `'row'` layout stacks the panes. |
| `resizable` | `boolean` | `false` | Whether the split takes focus with Tab, and whether Ctrl+Left and Ctrl+Right move the divider while it has focus. |

## Keyboard

With `resizable` set:

| Key | Effect |
| --- | --- |
| Tab, Shift+Tab | Move focus to and from the split, as they move it to any other focusable component. |
| Ctrl+Left | Moves the divider one cell to the left, while the split has focus and the panes sit side by side. The first pane shrinks. |
| Ctrl+Right | Moves the divider one cell to the right, under the same condition. The first pane grows. |

Without `resizable`, the split does not take focus and reads no keys. Plain arrow keys do nothing in either case.

## Layout

The panes sit side by side when `direction` is `'row'` and the width is at least the larger of `breakpoint` and `2 * minSize + 1`. The `+ 1` is the divider. Below that width, or when `direction` is `'column'`, the first pane takes `ratio` of the height and the second pane takes the rest.

A stacked layout needs a height. The first pane's height is a percentage of the split, and the split takes its height from its parent. Give the parent a height when the panes may stack. The example above gives its `Box` a height of 12 for that reason.

Side by side, the first pane's width is `ratio` of the width, rounded to whole cells, and then moved as needed so that both panes keep `minSize`. Before the first layout, the width is not known, so the ratio is applied as a percentage and is not clamped.

## Controlled ratio

Pass `ratio` with `onRatioChange` to own the split in the parent. A resize key calls `onRatioChange`, and the divider moves only when the parent passes a new `ratio`:

```tsx
const [ratio, setRatio] = useState(0.3);

<SplitPane ratio={ratio} onRatioChange={setRatio} resizable>
	<Files />
	<Editor />
</SplitPane>;
```

Without `onRatioChange`, a controlled divider does not move on a resize key.

With `defaultRatio`, the split keeps its own ratio. Resize keys move it, and `onRatioChange` is still called.

## Callbacks

- `onRatioChange` is called with the new ratio when a resize key moves the divider by a cell. It is not called when the divider is already at a minimum, when the split is not focused, or when the panes are stacked.
- The ratio passed to `onRatioChange` is the first pane's width divided by the total width, so it is a fraction of the length.

## Theme keys

The component reads the `SplitPane` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props for the split: `{flexGrow: 1}`. |
| `styles.verticalDivider` | `{isFocused}` | Box props for the divider when the panes sit side by side. A one-cell-wide box with a single-line left border. The border is blue when focused and gray otherwise. |
| `styles.horizontalDivider` | `{isFocused}` | Box props for the divider when the panes are stacked. A one-row-high box with a single-line top border. The border is blue when focused and gray otherwise. |

`SplitPane` has no config keys.

## Edge cases

- Children other than exactly two throw an error when the component renders: `SplitPane needs exactly two children, got N.`
- A `ratio` outside `0` to `1` is clamped to that range.
- A width that cannot hold both minimum sizes stacks the panes, even when the width is at or above `breakpoint`.
- Resize keys are not read while the split is not focused, so an unfocused split ignores Ctrl+Left and Ctrl+Right even when `resizable` is set.
- A split behind an open [Modal](/ui/components/modal) receives no keys, so it cannot be resized until the modal closes.
