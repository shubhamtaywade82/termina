---
outline: [2, 3]
---

# Header

`Header` is a title bar for the top of a CLI screen. The title is bold, and an optional subtitle follows it on the same line, dimmed. It is one row high unless the title and subtitle are too wide for the row. Use it to name the app and show its current context, such as the target environment. It is display only and draws no rule underneath. For a horizontal rule that separates sections, use [Divider](/ui/components/divider), which draws a rule with an optional title.

`Header` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

This header is display only, so the demo shows it above a static status list.

<TerminalDemo demo="header-basic" title="Header — deploy status" />

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {Header} from '@nemesis-oss/termina-ui';

function Deployer() {
	return (
		<Box flexDirection="column" gap={1}>
			<Header
				title="Deployer"
				subtitle="Targeting: production · Region: us-east-1"
			/>
			<Text>Deploying 3 services</Text>
		</Box>
	);
}

render(<Deployer />);
```

Leave out `subtitle` to show the title alone.

## Props

`HeaderProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | Required | Title, drawn in bold. |
| `subtitle` | `string` | `undefined` | Text after the title on the same line, drawn dimmed. An empty string draws nothing. |

## Theme keys

The component reads the `Header` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'row'`, `gap: 2`. The gap is the two columns between the title and the subtitle when the row is wide enough for both. |
| `styles.title` | none | Text props: `bold: true` |
| `styles.subtitle` | none | Text props: `dimColor: true` |

`Header` has no config keys.

## Edge cases

- An empty `subtitle` draws nothing, the same as leaving it out.
- An empty `title` draws no title text. The two-column gap still comes before the subtitle, so the subtitle starts two columns in.
- When the title, the two-column gap and the subtitle are wider than the row, the title and subtitle each wrap inside their own column. The header then takes more than one row, and a long title can break mid-word.
- A title wider than the row, with no subtitle, wraps onto more rows.
