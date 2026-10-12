---
outline: [2, 3]
---

# DiffView

`DiffView` displays a unified diff, the text that `git diff` prints, with each line styled by its first characters: file headers in bold, hunk headers in cyan, additions in green, and removals in red. Use it to show a patch or a proposed change in a terminal UI. It is display only. It has no keyboard input, no line numbers, and no scrolling, and it does not compute a diff, so pass it the patch text. [CodeBlock](/ui/components/code-block) shows code as plain text, with optional line numbers. It does not color lines by their diff markers.

`DiffView` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The demo shows a small patch to `src/server.ts` with file headers, a hunk header, additions, a removal, and a blank context line.

<TerminalDemo demo="diff-view-basic" title="DiffView — unified diff" />

## Usage

```tsx
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {DiffView} from '@nemesis-oss/termina-ui';

const patch = [
	'--- a/config.ts',
	'+++ b/config.ts',
	'@@ -1,2 +1,2 @@',
	'-export const retries = 3;',
	'+export const retries = 5;',
	' export const timeout = 30;',
].join('\n');

function Review() {
	return (
		<Box flexDirection="column">
			<Text>Review the change</Text>
			<DiffView patch={patch} />
		</Box>
	);
}

render(<Review />);
```

`patch` takes the text that `git diff` prints, and `DiffView` styles each line by its first characters.

## Props

`DiffViewProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `patch` | `string` | Required | Unified diff, as `git diff` prints it. Each patch line starts a new row, and tabs expand to spaces. An empty string renders nothing. |

## Theme keys

The component reads the `DiffView` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'`, so each line is a row. |
| `styles.header` | none | Text props: `bold: true`. Applies to lines that start with `diff`, `index`, `---` or `+++`. |
| `styles.hunk` | none | Text props: `color: 'cyan'`. Applies to lines that start with `@@`. |
| `styles.added` | none | Text props: `color: 'green'`. Applies to lines that start with `+`, except `+++` file headers. |
| `styles.removed` | none | Text props: `color: 'red'`. Applies to lines that start with `-`, except `---` file headers. |
| `styles.context` | none | Text props: `{}`, so no color is set. Applies to every other line. |

`DiffView` has no config keys.

## Edge cases

- An empty `patch` renders nothing.
- Only one trailing newline is dropped, so the newline that ends `git diff` output does not add a blank row. A patch that ends with a blank line keeps that row.
- An empty line keeps its row, so it still separates the lines around it.
- A removed line whose text begins with `--`, such as a SQL comment, starts with `---`, so it is styled as a file header. An added line whose text begins with `++` is styled the same way.
- A `\ No newline at end of file` line is styled as context.
- A line that begins with an ANSI color code, as `git diff --color=always` prints colored lines, matches no marker and is styled as context. Its own color codes are printed unchanged, so the theme colors do not apply to it.
- A line wider than its container wraps onto the following rows, so no text is cut off. The container is the terminal width, or the width of a narrower parent `Box`.
- Changing `patch` after mount re-renders the lines.
- `DiffView` reads no input, so it renders when stdin is piped.
