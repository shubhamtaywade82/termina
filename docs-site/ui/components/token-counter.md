---
outline: [2, 3]
---

# TokenCounter

`TokenCounter` shows how many tokens a prompt, response or session has used, with thousands separators. Give it a `limit` to show the count against a budget and the percent used. The count is green below 80 percent, yellow from 80 percent up to 100, and red from 100 percent up. Use it for a count of tokens. For a percentage drawn as a bar, use [Gauge](/ui/components/gauge) instead. Gauge has a bar and a percent, but it shows no count and changes color at 70 and 90 percent. `TokenCounter` draws no bar.

`TokenCounter` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The demo shows a session with no limit, then three prompts under, near and over their budget.

<TerminalDemo demo="token-counter-basic" title="TokenCounter — context budget" />

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {TokenCounter} from '@nemesis-oss/termina-ui';

function Prompt() {
	return (
		<Box flexDirection="column">
			<Text>Prompt budget</Text>
			<TokenCounter count={3512} limit={4096} />
		</Box>
	);
}

render(<Prompt />);
```

`TokenCounter` displays the count you pass in. It does not count tokens or call a model.

## Props

`TokenCounterProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | Required | Tokens used. Shown with thousands separators, in en-US format. |
| `limit` | `number` | `undefined` | Token budget. When set, the counter shows `count / limit` and the percent used, rounded to a whole number. Use a value greater than 0. |
| `label` | `string` | `'tokens'` | Unit name shown after the count. |

## Theme keys

The component reads the `TokenCounter` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `gap: 1`. The gap separates the count, the label and the percent. |
| `styles.count` | `{status}`, where `status` is `'ok'`, `'warning'` or `'over'` | Text props: `color` of `'green'` for `ok`, `'yellow'` for `warning` and `'red'` for `over`. The component picks the status. The count and the percent both use this style. |
| `styles.label` | none | Text props: an empty object, so the label has no color of its own. |

`TokenCounter` has no config keys.

## Edge cases

- Without `limit`, the count uses the `ok` style, which is green. There is no budget to warn about, so the counter never turns yellow or red.
- The color follows the exact usage, not the rounded percent. `799` of `1,000` shows `(80%)` in green.
- A count just under the limit shows `(100%)` in yellow. Only a count at or above the limit is red.
- A count above the limit shows a percent over 100 in red, for example `1,220 / 1,000 tokens (122%)`.
- A count of `0` shows `0` in green, with `(0%)` when a limit is set.
- Changing `count` or `limit` after mount updates the count, the color and the percent on the next render. The component keeps no state of its own.
