---
outline: [2, 3]
---

# Modal

`Modal` is a dialog drawn over the content of the container it sits in. While it is open, the keys, paste and `useMouse` reports that would reach the content behind it are not delivered, and Escape calls `onClose`. Use it for a question or a form that the user must finish before the screen goes on. [Dialog](/ui/components/dialog) is a bordered box in the normal layout. It does not overlay other content and does not take input.

`Modal` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Press `m` to open the dialog. While it is open, the arrow keys do not move the list behind it. Press Escape to close the dialog, and the arrow keys move the list again.

<TerminalDemo demo="modal-basic" title="Modal — over a Select" />

## Usage

```tsx
import {useState} from 'react';
import {Box, Text, render, useInput} from '@nemesis-oss/termina-core';
import {Modal, Select} from '@nemesis-oss/termina-ui';

const environments = [
	{label: 'Development', value: 'development'},
	{label: 'Staging', value: 'staging'},
	{label: 'Production', value: 'production'},
];

function Deploy() {
	const [isOpen, setIsOpen] = useState(false);
	const [target, setTarget] = useState('development');

	useInput(input => {
		if (input === 'd') {
			setIsOpen(true);
		}
	});

	return (
		<Box flexDirection="column" width={50} height={10}>
			<Text>Target. Press d to deploy.</Text>
			<Select options={environments} onChange={setTarget} />
			<Modal
				isOpen={isOpen}
				title="Deploy"
				width={40}
				onClose={() => {
					setIsOpen(false);
				}}
			>
				<Text>Deploy to {target}?</Text>
				<Text>Escape cancels.</Text>
			</Modal>
		</Box>
	);
}

render(<Deploy />);
```

`onClose` runs when Escape is pressed while the modal is open. The modal does not close itself, so the parent sets `isOpen` to `false` in that callback. The `Select` keeps its highlight while the modal is open, because the arrow keys are not delivered to it.

## Props

`ModalProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | required | Whether the modal is shown. While it is `false`, the modal renders nothing, and the content behind it receives input as usual. |
| `onClose` | `() => void` | required | Called when Escape is pressed while the modal is open. The modal does not close itself, so the parent sets `isOpen` to `false` here. |
| `title` | `string` | `undefined` | Shown on the first line inside the border. |
| `width` | `number` | Fits the content | Width in columns, including the border. The height follows the content. |
| `children` | `ReactNode` | `undefined` | Content, stacked in one column below the title. |

## Keyboard

While the modal is open:

| Key | Effect |
| --- | --- |
| Escape | Calls `onClose`. |
| Printable characters, Enter, arrows, Backspace, Delete, and other keys | Delivered to the components inside the modal only. The components behind it do not receive them. |
| Tab, Shift+Tab | Move focus among the components inside the modal that take focus with `useFocus`. With none, they do nothing. |
| Ctrl+C | Exits the app, as it does at any time. |

Input is routed by the component tree, not by focus. A component inside the modal receives its keys because it sits inside the modal, so it does not need focus. The components in this kit do not take focus, except [SplitPane](/ui/components/split-pane) when it is `resizable`. Tab matters only for your own components that call `useFocus` inside the modal.

## Layering

The modal is an absolute overlay. Its box is the size of the container it is rendered in, and the dialog is centred in that box. The dialog's background covers the cells under it. The cells outside the dialog still show the content behind the overlay.

Render the modal as the last child of the container it covers. An element that comes after it in the same container draws over it.

Give the container a width and a height, because the overlay is sized to them.

## Focus

- When the modal opens, focus moves to the first component inside it that takes focus. If none does, the modal does not move focus.
- A focusable component outside the modal keeps `isFocused` while the modal is open, but it receives no keys until the modal closes.
- When the modal closes, focus returns to the component that had it when the modal opened, if that component is still mounted and takes focus. If it has unmounted, focus is not moved.
- A plain Escape does not clear focus while the modal is open.

## Callbacks

- `onClose` is called once for each Escape pressed while the modal is open. Nothing else calls it.

## Theme keys

The component reads the `Modal` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props for the dialog: `{flexDirection: 'column', borderStyle: 'round', borderColor: 'blue', backgroundColor: 'black', paddingX: 1}`. |
| `styles.title` | none | Text props for the title: `{bold: true}`. |

`Modal` has no config keys. The `width` prop is applied on top of `styles.container`.

## Edge cases

- Nested modals work. While both are open, only the inner one receives input. Closing the inner modal returns input to the outer one.
- Mouse reports for `Box` handlers (`onClick`, `onWheel`, `onMouseDown`, `onMouseUp`) are routed by hit testing, not by the capture. A report on the modal reaches the nearest handler on the modal's ancestors. Handlers on the covered elements do not run, but a handler on an ancestor of the container does.
- A closed modal renders nothing and takes no part in input or focus.
