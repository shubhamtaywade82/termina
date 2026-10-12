---
outline: [2, 3]
---

# Tabs

`Tabs` shows one panel at a time. A tab bar on the first line lists the tabs, and Left and Right switch between them. Use it when several views share one area of the screen and the user looks at one at a time. It differs from [Select](/ui/components/select), which picks one value from a list and shows no content: `Tabs` renders the active tab's content below the bar.

`Tabs` is exported from `@nemesis-oss/termina-ui`. `@nemesis-oss/termina-ui` is a workspace package in this repository and is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Live preview

This is the real component, running on the termina renderer inside a
terminal emulator in the page — not a screenshot. Click the preview to
focus it; your keystrokes go to the app.

Press Left and Right to switch tabs.

<TerminalDemo demo="tabs-basic" title="Tabs — project views" />

## Usage

```tsx
import {Text, render} from '@nemesis-oss/termina-core';
import {Tabs} from '@nemesis-oss/termina-ui';

const tabs = [
	{id: 'files', label: 'Files', content: <Text>src/index.ts</Text>},
	{id: 'logs', label: 'Logs', content: <Text>No errors in the last hour</Text>},
	{id: 'config', label: 'Config', content: <Text>theme: dark</Text>},
];

render(<Tabs tabs={tabs} defaultTabId="logs" />);
```

`Tabs` keeps the active tab in its own state, so pass `onChange` only when the parent needs to know which tab is active.

## Props

`TabsProps` is exported from `@nemesis-oss/termina-ui`. `TabsItem` is also exported. It has the shape `{id: string; label: string; content: ReactNode}`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tabs` | `TabsItem[]` | Required | Tabs, in display order. Each `id` must be unique. |
| `defaultTabId` | `string` | First tab | Id of the tab active at mount. Later changes are ignored. If no tab has this id, the first tab is active. |
| `onChange` | `(id: string) => void` | `undefined` | Called with the id of the newly active tab when Left or Right changes the tab. |
| `isActive` | `boolean` | `true` | When false, key input is ignored. The tab bar and the active content still render. |

## Keyboard

| Key | Effect |
| --- | --- |
| Left | Activates the previous tab. Does nothing on the first tab, and does not wrap to the last one. |
| Right | Activates the next tab. Does nothing on the last tab, and does not wrap to the first one. |
| Any other key | Ignored. |

When `isActive` is false, no key has an effect.

## Theme keys

The component reads the `Tabs` entry of the theme. To change a key, pass a theme to `ThemeProvider`, as described in [Theming](/ui/theming).

| Key | Arguments | Returns |
| --- | --- | --- |
| `styles.tabBar` | none | Box props: `flexDirection: 'row'` and `gap: 2`. The gap is the two spaces between labels. |
| `styles.tab` | `{isActive}`. Here `isActive` means this tab is the selected one. It is not the `isActive` prop. | Text props: `bold` set to `isActive`, and `color: 'blue'` when selected. Other tabs have no color. |
| `styles.panel` | none | Box props: `flexDirection: 'column'`, so content with several elements stacks vertically. |

`Tabs` has no config keys.

## Edge cases

- An unknown `defaultTabId`, or no `defaultTabId`, makes the first tab active.
- `defaultTabId` is read at mount. Later changes to it have no effect.
- `onChange` runs only when Left or Right changes the tab. It does not run on mount or on re-render, including when `tabs` changes.
- Removing the active tab from `tabs` makes the first tab active, without calling `onChange`.
- Reordering `tabs` keeps the same tab active, because the active tab is tracked by `id`.
- Only the active tab's content is mounted. Leaving a tab discards the state of its content, even when two tabs hold the same component.
- Content with several elements stacks them vertically.
- With an empty `tabs` array, nothing renders, and keys have no effect.
- Left and Right presses that arrive together, such as when input is buffered, each move the tab and each call `onChange`.
