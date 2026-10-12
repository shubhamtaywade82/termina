---
outline: [2, 3]
---

# CodeBlock

`CodeBlock` shows a block of code with one row per line of code, an optional line number gutter, and optional highlighted lines. Use it to show a snippet of code, such as an example or a config file. The code is plain text: `language` is a label above the block, and no syntax colors are applied. The block is display only, takes no keyboard input, and has no height limit. To show a change between two versions of text, use [DiffView](/ui/components/diff-view). To render a Markdown document, use [Markdown](/ui/components/markdown).

`CodeBlock` is exported from `@nemesis-oss/termina-ui`. Install it with `npm install @nemesis-oss/termina-ui @nemesis-oss/termina-core react`. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The demo shows a short TypeScript snippet with its sixth line highlighted.

<TerminalDemo demo="code-block-basic" title="CodeBlock — highlighted line" />

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {CodeBlock} from '@nemesis-oss/termina-ui';

const code = `const total = prices.reduce((sum, price) => sum + price, 0);
console.log(total);`;

function Snippet() {
	return (
		<Box flexDirection="column" gap={1}>
			<Text>Total of the cart</Text>
			<CodeBlock code={code} language="typescript" highlightLines={[1]} />
		</Box>
	);
}

render(<Snippet />);
```

`CodeBlock` takes no callbacks and reads no input, so it is an ordinary element inside any layout.

## Props

`CodeBlockProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | `string` | Required | Code to show. Each line starts a new row. |
| `language` | `string` | `undefined` | Label shown on its own line above the code. |
| `showLineNumbers` | `boolean` | `true` | Show the line number gutter and the vertical rule beside the code. When false, neither is drawn. |
| `highlightLines` | `number[]` | `[]` | 1-based line numbers to draw in the highlighted style. |

## Theme keys

The component reads the `CodeBlock` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'` |
| `styles.label` | none | Text props: `dimColor: true` |
| `styles.lineNumber` | `{isHighlighted}` | Text props: `bold: true` and `dimColor: false` when highlighted, otherwise `bold: false` and `dimColor: true` |
| `styles.code` | `{isHighlighted}` | Text props: `backgroundColor: 'gray'` when highlighted, otherwise no props |
| `styles.gutter` | none | Box props: `flexShrink: 0`, `paddingRight: 1`, `marginRight: 1`, `borderStyle: 'single'` with only the right border drawn (`borderTop`, `borderBottom` and `borderLeft` are `false`), and `borderDimColor: true` |

`CodeBlock` has no config keys.

## Edge cases

- An empty `code` string renders one row, numbered `1`, with no code.
- A trailing newline adds an empty last row with its own number, so `'a\n'` renders two rows.
- The gutter is as wide as the largest line number, so every number in the block takes the same width. In a block of 10 lines, the number on line 1 is padded to two digits.
- `highlightLines` values that match no row, such as `0` or a number past the last line, have no effect.
- A line longer than the code column wraps inside it. Its number appears on the first row only, and the vertical rule continues down the wrapped rows.
- Each tab is drawn as two spaces.
- An empty `language` string shows no label line.
- With `showLineNumbers` set to false, the gutter and rule are not drawn, and `highlightLines` still applies to the code.
- With `showLineNumbers` set to false, a blank line still takes a row.
- An empty line is drawn as one space, so a highlighted empty line shows a one-cell highlight.
