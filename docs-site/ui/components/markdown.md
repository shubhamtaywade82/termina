---
outline: [2, 3]
---

# Markdown

`Markdown` renders a string of Markdown source in the terminal. It supports headings, paragraphs, bullet and numbered lists, nested lists, fenced code, block quotes, bold, italic, inline code and links. Use it when the text is Markdown already, such as a release note or a README excerpt. It is display only and takes no keyboard input. It has no height limit, so put it in a [ScrollBox](/ui/components/scroll-box) when the document is taller than the screen. To show one block of code with line numbers and highlighted lines, use [CodeBlock](/ui/components/code-block). To build a list from React elements, use [UnorderedList](/ui/components/unordered-list) or [OrderedList](/ui/components/ordered-list).

`Markdown` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

The preview renders a short README excerpt with a heading, lists, a block quote and a code block.

<TerminalDemo demo="markdown-basic" title="Markdown — README excerpt" />

## Usage

```tsx
import {render} from '@nemesis-oss/termina-core';
import {Markdown} from '@nemesis-oss/termina-ui';

const source = `# Release notes

- Faster startup
- **Breaking:** \`renderToString\` moved

Run \`npm install\` to upgrade.`;

render(<Markdown>{source}</Markdown>);
```

Pass the source as `children`. The component keeps no state, so a new string shows new content on the next render.

## Props

`MarkdownProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `string` | Required | Markdown source. |

## Theme keys

The component reads the `Markdown` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'` and `gap: 1`. One blank row separates the blocks. |
| `styles.heading` | `{level}` | Text props. Level 1 is bold, underlined and cyan. Level 2 is bold and cyan. Level 3 is bold. |
| `styles.paragraph` | none | Text props: none. Applied to paragraph text, list item text and block quote text. |
| `styles.listBullet` | none | Text props: `dimColor: true`. Applied to the bullet or number, and to the space after it. |
| `styles.code` | none | Text props: `color: 'yellow'`. Applied to inline code and to fenced code. |
| `styles.codeBlock` | none | Box props: `paddingLeft: 2`. Indents each fenced code block. |
| `styles.blockquote` | none | Box props: a dimmed left border, with `paddingLeft: 1`. There is no top, right or bottom border. |
| `styles.bold` | none | Text props: `bold: true`. |
| `styles.italic` | none | Text props: `italic: true`. |
| `styles.link` | none | Text props: `color: 'blue'` and `underline: true`. Applied to the link text. |

No theme key covers four things, so they are fixed in the component: the bullet glyph (`figures.bullet`, which is `●`), the two-space indent for each nested list level, the dim on block quote text, and the dim on link URLs.

## Edge cases

- An empty source renders nothing.
- Line breaks inside a paragraph are kept. Each line wraps to the width of its container.
- Consecutive blank lines make one blank row between blocks.
- Only one to three `#` marks start a heading. `####`, and `#tag` with no space after the hash, print as plain text with the hash marks.
- Nesting depth is the leading spaces divided by two, rounded down. Three spaces make one level.
- A line that starts with `**` is not a list item. A marker that never closes, such as `**open`, prints as typed.
- An underscore inside a word and a `*` followed by a space do not start italics, so `snake_case_name` and `2 * 3 * 4` print as typed.
- Fenced code is not highlighted. Its spacing and blank lines are kept, and the language after the opening fence is ignored.
- A fence that is never closed runs to the end of the source.
- Bold text in a block quote is not dimmed. The text after it stays dimmed.
- Every wrapped line of a block quote keeps the bar.
- A link shows its URL in dim parentheses after the link text. Underscores in the URL are not emphasis.
- Images, tables and HTML are not supported. Their lines print as written, one row per line, and inline markers such as `**` still apply.
