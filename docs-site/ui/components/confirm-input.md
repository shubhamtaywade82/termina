---
outline: [2, 3]
---

# ConfirmInput

`ConfirmInput` shows a `Y/n` or `y/N` hint and calls `onConfirm` or `onCancel` when the user answers. Use it to ask one yes-or-no question before an operation. The component does not record the answer or hide itself. The parent decides what to render after a callback runs.

`ConfirmInput` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Press `y` to confirm or `n` to cancel; Enter picks the highlighted default.

<TerminalDemo demo="confirm-input-basic" title="ConfirmInput — confirm or cancel" />

## Usage

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';
import {ConfirmInput} from '@nemesis-oss/termina-ui';

function Cleanup() {
	const {exit} = useApp();

	return (
		<Box gap={1}>
			<Text>Delete the build cache?</Text>
			<ConfirmInput
				defaultChoice="cancel"
				onConfirm={() => {
					// Delete the cache here.
					exit();
				}}
				onCancel={() => {
					exit();
				}}
			/>
		</Box>
	);
}

render(<Cleanup />);
```

## Props

`ConfirmInputProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isDisabled` | `boolean` | `false` | When true, key input is ignored and the hint is dimmed. |
| `defaultChoice` | `'confirm' \| 'cancel'` | `'confirm'` | The answer Enter selects. The hint is `Y/n` for `'confirm'` and `y/N` for `'cancel'`. |
| `submitOnEnter` | `boolean` | `true` | When false, Enter does nothing. `y` and `n` still answer. |
| `onConfirm` | `() => void` | Required | Called on `y` or `Y`, or on Enter when `submitOnEnter` is true and `defaultChoice` is `'confirm'`. |
| `onCancel` | `() => void` | Required | Called on `n` or `N`, or on Enter when `submitOnEnter` is true and `defaultChoice` is `'cancel'`. |

## Keyboard

| Key | Effect |
| --- | --- |
| `y` or `Y` | Calls `onConfirm`. |
| `n` or `N` | Calls `onCancel`. |
| Enter | When `submitOnEnter` is true, calls `onConfirm` if `defaultChoice` is `'confirm'`, and `onCancel` otherwise. |
| Any other key | Ignored. |

When `isDisabled` is true, the key handler is inactive and no callback runs.

The handler checks the text of the key, not its modifiers. Ctrl+Y calls `onConfirm`, and Ctrl+N calls `onCancel`. Only a single `y` or `n` matches. A longer string, such as a pasted `yes`, does nothing.

## Theme keys

The component reads the `ConfirmInput` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.input` | `{isFocused}`, where `isFocused` is `!isDisabled` | Text props: `dimColor: !isFocused` |

## Edge cases

- The component keeps listening while it is mounted and enabled. A second key press calls the callback again. Unmount the component or disable it after the answer.
- With `submitOnEnter={false}`, Enter does nothing, and `Y` or `N` still answer.
- With `defaultChoice="cancel"`, Enter calls `onCancel`. The hint is `y/N`.
