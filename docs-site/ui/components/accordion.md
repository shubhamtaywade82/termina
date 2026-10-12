---
outline: [2, 3]
---

# Accordion

`Accordion` is a vertical list of section titles. Each title opens to show its content below it, and the user moves between titles with the keyboard. Use it to hide details that are needed only sometimes, such as optional settings. [Select](/ui/components/select) and [MultiSelect](/ui/components/multi-select) report the values the user picks, while `Accordion` reports which sections are open. [ScrollBox](/ui/components/scroll-box) scrolls one long block of content in a fixed viewport, while `Accordion` shows many titled sections, each opened or closed on its own.

`Accordion` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Move with Up and Down, press Enter to open or close a section.

<TerminalDemo demo="accordion-basic" title="Accordion — settings" />

## Usage

```tsx
import {Text, render} from '@nemesis-oss/termina-core';
import {Accordion} from '@nemesis-oss/termina-ui';

const sections = [
	{id: 'database', title: 'Database', content: <Text>host: localhost</Text>},
	{id: 'api', title: 'API', content: <Text>timeout: 30s</Text>},
];

render(<Accordion items={sections} defaultOpenIds={['api']} />);
```

`defaultOpenIds` opens the listed sections at mount, and `onChange` receives the open ids after each change.

## Props

`AccordionProps` is exported from `@nemesis-oss/termina-ui`. `AccordionItem` is also exported. It has the shape `{id: string; title: string; content: ReactNode}`. Ink renders text only inside `<Text>`, so `content` must be an element such as `<Text>`, not a bare string.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `AccordionItem[]` | Required | Sections, in display order. Each `id` must be unique. |
| `defaultOpenIds` | `string[]` | `[]` | Ids of the sections open at mount. Read once, so later changes are ignored. |
| `multiple` | `boolean` | `false` | Allow several sections to be open at once. When false, opening a section closes the others. |
| `isActive` | `boolean` | `true` | When false, key input is ignored. |
| `onChange` | `(openIds: string[]) => void` | `undefined` | Called with the open ids after the user opens or closes a section. |

## Keyboard

| Key | Effect |
| --- | --- |
| Up or `k` | Focuses the previous section. Focus does not wrap from the first section to the last. |
| Down or `j` | Focuses the next section. Focus does not wrap from the last section to the first. |
| `g` | Focuses the first section. |
| `G` | Focuses the last section. |
| Enter or Space | Opens the focused section if it is closed, and closes it if it is open. |
| Any other key | Ignored. This includes Ctrl and Alt combinations, such as Ctrl+K and Alt+j. |

The focused section's title changes color, and nothing else marks focus. When `isActive` is false, no key has an effect and the focused title keeps its color. Keys are read only when stdin supports raw mode, so the accordion still renders under piped stdin and ignores keys there.

## Theme keys

The component reads the `Accordion` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.container` | none | Box props: `flexDirection: 'column'` |
| `styles.title` | `{isFocused}` | Text props: `color` of `'blue'` when focused, otherwise `undefined`. Only the color changes. |
| `styles.icon` | `{isOpen}` | Text props: `dimColor` of `true` when closed and `false` when open. |
| `styles.content` | none | Box props: `flexDirection: 'column'` and `paddingLeft: 2` |

The icon glyphs are set in the component, so the theme controls only the icon's dimming: `figures.triangleRight` when closed, `figures.triangleDown` when open. `Accordion` has no config keys.

## Edge cases

- Focus starts on the first section, even when `defaultOpenIds` names a later one.
- `defaultOpenIds` is read once at mount. Changing it later has no effect.
- Single mode acts only when a section opens, and then it closes every other open section. Sections that are already open, either from `defaultOpenIds` or because `multiple` changed to `false`, stay open until the user closes them or opens another section. Closing a section never opens another.
- `onChange` runs from the key handler, so it is called once per user change. It is not called at mount, or when the parent re-renders with a new callback. The next change calls the newest callback.
- The open set holds ids, not sections. Ids in `defaultOpenIds` that match no section stay in the set, and `onChange` reports them.
- If an open section is removed from `items`, its id stays in the open set, so a section added back with the same id is open again.
- If `items` shrinks past the focused section, focus moves to the last section.
- In multiple mode, `onChange` reports ids in the order they were opened, after the ids from `defaultOpenIds`.
- Empty `items` render nothing, and keys do nothing, so the focus position is kept for when sections arrive.
