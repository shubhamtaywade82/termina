---
outline: [2, 3]
---

# MultiSelect

`MultiSelect` is a vertical list in which the user toggles any number of options with Space and submits the selection with Enter. Use it when the answer is a set of values, such as features to enable. The list shows a fixed number of rows and scrolls when focus moves past the visible rows.

`MultiSelect` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Space toggles an option, Enter submits the selection.

<TerminalDemo demo="multi-select-basic" title="MultiSelect — toppings" />

## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {MultiSelect} from '@nemesis-oss/termina-ui';

const toppings = [
	{label: 'Cheese', value: 'cheese'},
	{label: 'Ham', value: 'ham'},
	{label: 'Pineapple', value: 'pineapple'},
	{label: 'Olives', value: 'olives'},
	{label: 'Peppers', value: 'peppers'},
	{label: 'Onions', value: 'onions'},
];

function Order() {
	const {exit} = useApp();

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Toppings (space to toggle, enter to submit)</Text>
			<MultiSelect
				options={toppings}
				defaultValue={['cheese']}
				onSubmit={values => {
					console.log(values);
					exit();
				}}
			/>
		</Box>
	);
}

render(<Order />);
```

## Props

`MultiSelectProps` is exported from `@nemesis-oss/termina-ui`. `Option` is also exported from `@nemesis-oss/termina-ui`. It has the shape `{label: string; value: string}`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isDisabled` | `boolean` | `false` | When true, key input is ignored and no focus pointer is shown. |
| `visibleOptionCount` | `number` | `5` | Number of rows shown at once. Capped at the number of options. It is read when the component mounts and when `options` changes. |
| `highlightText` | `string` | `undefined` | Text to make bold inside each label. Only the first match in a label is bold. |
| `options` | `Option[]` | Required | Options, in display order. |
| `defaultValue` | `string[]` | `[]` | Values selected when the component mounts. |
| `onChange` | `(value: string[]) => void` | `undefined` | Called after the selection changes, with the whole selection. |
| `onSubmit` | `(value: string[]) => void` | `undefined` | Called on Enter with the selection. |

## Keyboard

| Key | Effect |
| --- | --- |
| Down | Focuses the next option. When focus moves past the last visible row, the list scrolls down by one row. |
| Up | Focuses the previous option. When focus moves onto the first visible row, the list scrolls up by one row, unless it is already at the top. |
| Space | Toggles the focused option. |
| Enter | Calls `onSubmit` with the selection. |
| Any other key | Ignored. |

When `isDisabled` is true, the key handler is inactive and no key has an effect.

The selection is an array in selection order. Values from `defaultValue` come first, in the order given. Each option you select is appended, and an option you deselect is removed.

## Theme keys

The component reads the `MultiSelect` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'` |
| `styles.option` | `{isFocused}` | Box props: `gap: 1`, `paddingLeft` of `0` when focused and `2` otherwise |
| `styles.focusIndicator` | none | Text props: `color: 'blue'`. The indicator is the `figures.pointer` glyph. |
| `styles.selectedIndicator` | none | Text props: `color: 'green'`. The indicator is the `figures.tick` glyph. |
| `styles.label` | `{isFocused, isSelected}` | Text props: `color` of `'blue'` when focused, otherwise `'green'` when selected, otherwise unset. Focus takes precedence over selection. |
| `styles.highlightedText` | none | Text props: `bold: true` |

## Edge cases

- Changing `options` to a list that is not deeply equal to the previous one resets the component. The selection returns to `defaultValue`, focus moves to the first option, and the list shows its first rows. The reset does not call `onChange`, so a parent that stores the selection keeps the old array until the next change.
- Passing a new array with the same contents does not reset the component.
- Values in `defaultValue` that match no option stay in the selection. They are passed to `onChange` and `onSubmit`.
- An empty `options` array renders no output.
- `highlightText` is matched case-sensitively, and only its first occurrence in each label is bold.
- If the parent re-renders with a new `onChange` function, `onChange` runs again with the current selection. Wrap the callback in `useCallback` to avoid this.
- A change to `visibleOptionCount` after mount has no effect until `options` changes.
