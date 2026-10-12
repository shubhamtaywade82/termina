---
outline: [2, 3]
---

# Stepper

`Stepper` lists the steps of an ordered flow, each on its own row, and marks each step as done, current or pending. Use it to show where a multi-step process stands, such as an installer or a deploy. It only displays state: it has no keyboard input and no callbacks, and the parent decides which step is current. For a single value that fills toward a total, use [ProgressBar](/ui/components/progress-bar) instead. For a numbered list with no per-item state, use [OrderedList](/ui/components/ordered-list) instead.

`Stepper` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The second step is current, so the first is done and the last two are pending.

<TerminalDemo demo="stepper-basic" title="Stepper — install progress" />

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {Stepper} from '@nemesis-oss/termina-ui';

const steps = ['Install dependencies', 'Configure API keys', 'Deploy to production'];

function Install() {
	return (
		<Box flexDirection="column" gap={1}>
			<Text>Installing my-cli</Text>
			<Stepper steps={steps} current={1} />
		</Box>
	);
}

render(<Install />);
```

Pass the index of the active step as `current`; the component does not advance on its own.

## Props

`StepperProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `steps` | `string[]` | Required | Step labels, in order. Each step is drawn on its own row. |
| `current` | `number` | `0` | Index of the active step. Steps before it are done and steps after it are pending. Values below 0 act as 0. A value at or above `steps.length` marks every step as done. |

## Theme keys

The component reads the `Stepper` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'` |
| `styles.icon` | `{status}` | Text props: `color: 'green'` when `status` is `'done'`, `color: 'blue'` when it is `'current'`, and `dimColor: true` when it is `'pending'`. |
| `styles.label` | `{status}` | Text props: `bold: true` when `status` is `'current'`, otherwise `bold: false`. |

`status` is `'done'`, `'current'` or `'pending'`. Only the icon of a pending step is dimmed; done and pending labels are not bold. The step glyphs are set in the component, so the theme controls only their style: `figures.tick` (`✔`) marks a done step, `figures.circleFilled` (`◉`) marks the current step, and `figures.circle` (`◯`) marks a pending step. In a terminal without Unicode support, `figures` substitutes its fallback characters.

`Stepper` has no config keys.

## Edge cases

- An empty `steps` array renders no output.
- A `current` below 0 acts as 0, so the first step is current.
- A `current` equal to or above `steps.length` marks every step as done, and no step is current.
- Changing `steps` or `current` after mount redraws the list on the next render. The component keeps no state of its own, so nothing carries over from the previous values.
- A label wider than the terminal wraps onto more rows, so that step takes more than one row.
