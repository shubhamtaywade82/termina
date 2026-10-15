---
outline: [2, 3]
---

# Select

`Select` is a vertical list in which the user moves focus with Up and Down and selects the focused option with Enter. Use it when the answer is one value from a short list. For a set of values, use [MultiSelect](/ui/components/multi-select). The list shows a fixed number of rows and scrolls when focus moves past them.

`Select` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Move with Up and Down, press Enter to choose.

<TerminalDemo demo="select-basic" title="Select — environments" />

## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {Select} from '@nemesis-oss/termina-ui';

const environments = [
	{label: 'Development', value: 'development'},
	{label: 'Staging', value: 'staging'},
	{label: 'Production', value: 'production'},
];

function Target() {
	const {exit} = useApp();

	return (
		<Box flexDirection="column" gap={1}>
			<Text>Target (up and down to move, enter to select)</Text>
			<Select
				options={environments}
				onChange={value => {
					console.log(value);
					exit();
				}}
			/>
		</Box>
	);
}

render(<Target />);
```

The selected value is reported through `onChange`. `Select` has no submit callback.

## Props

`SelectProps` is exported from `@nemesis-oss/termina-ui`. `Option` is also exported. It has the shape `{label: string; value: string}`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isDisabled` | `boolean` | `false` | When true, key input is ignored and no focus pointer is shown. |
| `visibleOptionCount` | `number` | `5` | Number of rows shown at once. Capped at the number of options. Read at mount and when `options` changes. |
| `highlightText` | `string` | `undefined` | Text to bold inside each label. Only the first occurrence in a label is bold. The match is case-sensitive. |
| `options` | `Option[]` | Required | Options, in display order. Each `value` must be unique. |
| `defaultValue` | `string` | `undefined` | Value selected at mount. Focus does not move to it. |
| `onChange` | `(value: string) => void` | `undefined` | Called with the value after the selection changes to a different value. |

## Keyboard

| Key | Effect |
| --- | --- |
| Down | Focuses the next option. When focus moves past the last visible row, the list scrolls down by one row. Focus does not wrap from the last option to the first. |
| Up | Focuses the previous option. When focus moves above the first visible row, the list scrolls up by one row. Focus does not wrap from the first option to the last. |
| Enter | Selects the focused option. Calls `onChange` when the value differs from the current selection. |
| Any other key | Ignored. |

When `isDisabled` is true, no key has an effect. Moving focus does not select an option.

Focus starts on the first option, even when `defaultValue` names a later option.

## Theme keys

The component reads the `Select` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'` |
| `styles.option` | `{isFocused}` | Box props: `gap: 1`, `paddingLeft` of `0` when focused and `2` otherwise |
| `styles.focusIndicator` | none | Text props: `color: 'blue'`. The glyph is `figures.pointer`. |
| `styles.selectedIndicator` | none | Text props: `color: 'green'`. The glyph is `figures.tick`. |
| `styles.label` | `{isFocused, isSelected}` | Text props: `color` of `'blue'` when focused, otherwise `'green'` when selected, otherwise unset. Focus takes precedence over selection. |
| `styles.highlightedText` | none | Text props: `bold: true` |

The indicator glyphs are set in the component, so the theme controls only their colors. `figures.pointer` is `❯` in a Unicode terminal and `>` otherwise. `figures.tick` is `✔` in a Unicode terminal and `√` otherwise.

`Select` has no config keys.

## Edge cases

- Changing `options` to a list that is not deeply equal to the previous one resets the component. The value returns to `defaultValue`, focus returns to the first option, and the list scrolls to the top. The reset does not call `onChange`, so a parent that stores the selection keeps its old value until the next change.
- A new array with the same contents does not reset the component.
- If `defaultValue` matches no option, no row is marked as selected.
- A change to `visibleOptionCount` after mount has no effect until `options` changes.
- `onChange` is called once per selection, synchronously from the key that made it. A new callback, or a new `options` array with the same contents, does not repeat the last call.
- An empty `options` array renders no output.
- Each `value` is used as a React key and to find the focused option, so values must be unique.
