---
outline: [2, 3]
---

# @nemesis-oss/termina-ui API Reference

This page lists every export of `packages/ui/source/index.ts`, the entry point of `@nemesis-oss/termina-ui`. Signatures are taken from the source and its emitted declarations. Prop tables are on each component page, and the component table links to them. For the component list, read the [UI Kit Overview](/ui/overview). For the theme shape, read [Theming](/ui/theming). `@nemesis-oss/termina-ui` is published to npm from `packages/ui`. Its compiled entry is `build/index.js`, with declarations in `build/index.d.ts`.

The entry re-exports nothing from `@nemesis-oss/termina-core`. Import `render`, `Box`, `Text`, and the other core names from `@nemesis-oss/termina-core`.

## Components

Each component has the form `(props: <Props>) => React.JSX.Element`.

| Export | Props type | Page |
| --- | --- | --- |
| `Accordion` | `AccordionProps` | [Accordion](/ui/components/accordion) |
| `Alert` | `AlertProps` | [Alert](/ui/components/alert) |
| `Autocomplete` | `AutocompleteProps` | [Autocomplete](/ui/components/autocomplete) |
| `Badge` | `BadgeProps` | [Badge](/ui/components/badge) |
| `CodeBlock` | `CodeBlockProps` | [CodeBlock](/ui/components/code-block) |
| `ConfirmInput` | `ConfirmInputProps` | [ConfirmInput](/ui/components/confirm-input) |
| `DataTable` | `DataTableProps` | [DataTable](/ui/components/data-table) |
| `Dialog` | `DialogProps` | [Dialog](/ui/components/dialog) |
| `DiffView` | `DiffViewProps` | [DiffView](/ui/components/diff-view) |
| `Divider` | `DividerProps` | [Divider](/ui/components/divider) |
| `EmailInput` | `EmailInputProps` | [EmailInput](/ui/components/email-input) |
| `Gauge` | `GaugeProps` | [Gauge](/ui/components/gauge) |
| `Header` | `HeaderProps` | [Header](/ui/components/header) |
| `JSONViewer` | `JSONViewerProps` | [JSONViewer](/ui/components/json-viewer) |
| `KeyHint` | `KeyHintProps` | [KeyHint](/ui/components/key-hint) |
| `LoadingBar` | `LoadingBarProps` | [LoadingBar](/ui/components/loading-bar) |
| `LogStream` | `LogStreamProps` | [LogStream](/ui/components/log-stream) |
| `Markdown` | `MarkdownProps` | [Markdown](/ui/components/markdown) |
| `Modal` | `ModalProps` | [Modal](/ui/components/modal) |
| `MultilineTextInput` | `MultilineTextInputProps` | [MultilineTextInput](/ui/components/multiline-text-input) |
| `MultiSelect` | `MultiSelectProps` | [MultiSelect](/ui/components/multi-select) |
| `OrderedList` | `OrderedListProps` | [OrderedList](/ui/components/ordered-list) |
| `PasswordInput` | `PasswordInputProps` | [PasswordInput](/ui/components/password-input) |
| `ProgressBar` | `ProgressBarProps` | [ProgressBar](/ui/components/progress-bar) |
| `ScrollBox` | `ScrollBoxProps` | [ScrollBox](/ui/components/scroll-box) |
| `Select` | `SelectProps` | [Select](/ui/components/select) |
| `Sparkline` | `SparklineProps` | [Sparkline](/ui/components/sparkline) |
| `Spinner` | `SpinnerProps` | [Spinner](/ui/components/spinner) |
| `SplitPane` | `SplitPaneProps` | [SplitPane](/ui/components/split-pane) |
| `StatusMessage` | `StatusMessageProps` | [StatusMessage](/ui/components/status-message) |
| `Stepper` | `StepperProps` | [Stepper](/ui/components/stepper) |
| `StreamingText` | `StreamingTextProps` | [StreamingText](/ui/components/streaming-text) |
| `Table` | `TableProps` | [Table](/ui/components/table) |
| `Tabs` | `TabsProps` | [Tabs](/ui/components/tabs) |
| `TextInput` | `TextInputProps` | [TextInput](/ui/components/text-input) |
| `Toast` | `ToastProps` | [Toast](/ui/components/toast) |
| `TokenCounter` | `TokenCounterProps` | [TokenCounter](/ui/components/token-counter) |
| `TreeView` | `TreeViewProps` | [TreeView](/ui/components/tree-view) |
| `Typewriter` | `TypewriterProps` | [Typewriter](/ui/components/typewriter) |
| `UnorderedList` | `UnorderedListProps` | [UnorderedList](/ui/components/unordered-list) |

### Static members

`OrderedList` and `UnorderedList` each carry an `Item` member. Use it as the list item component.

```ts
OrderedList.Item: typeof OrderedListItem // children: ReactNode
UnorderedList.Item: typeof UnorderedListItem // children: ReactNode
```

The props types of the two item components are not exported from the root. Their only public form is the `Item` member.

## Hooks

```ts
useSpinner(props: UseSpinnerProps): UseSpinnerResult
useComponentTheme<T extends ComponentTheme>(component: string): T
```

`useSpinner` holds the animation frame behind `Spinner`. It is documented on the [Spinner](/ui/components/spinner) page. `useComponentTheme` returns the entry for `component` from the nearest theme provider. It returns `undefined` for a name the theme does not contain. See [Theming](/ui/theming).

## Theme

```ts
const defaultTheme: Theme
const ThemeContext: React.Context<Theme> // default value: defaultTheme
function ThemeProvider(props: ThemeProviderProps): React.JSX.Element
const extendTheme: (originalTheme: Theme, newTheme: Theme) => Theme
```

`extendTheme` returns `deepmerge(originalTheme, newTheme)` and changes neither argument. The merge rules are described on the [Theming](/ui/theming) page.

## Spatial geometry

```ts
const nearestInDirection: (
	origin: Rect,
	candidates: readonly FocusCandidate[],
	direction: Direction,
) => string | undefined
```

`nearestInDirection` is pure. It is not connected to focus management. See [Spatial Focus Geometry](/ui/spatial).

## Types

| Type | Definition |
| --- | --- |
| `Option` | `{label: string; value: string}` |
| `Theme` | `{components: Record<string, ComponentTheme>}` |
| `ComponentTheme` | `{styles?: Record<string, (props?: any) => ComponentStyles>; config?: (props?: any) => Record<string, unknown>}` |
| `ComponentStyles` | `Record<string, unknown>` |
| `ThemeProviderProps` | `{children: ReactNode; theme: Theme}`, both required |
| `UseSpinnerProps` | `{type?: SpinnerName}`, default `dots`. `SpinnerName` is from `cli-spinners` and is not re-exported |
| `UseSpinnerResult` | `{frame: string}` |
| `Rect` | `{x: number; y: number; width: number; height: number}`, in cells |
| `Direction` | The string literals `up`, `down`, `left`, and `right` |
| `FocusCandidate` | `{id: string; rect: Rect}` |
| `AccordionItem` | `{id: string; title: string; content: ReactNode}`. A string `content` is drawn as text |
| `TabsItem` | `{id: string; label: string; content: ReactNode}`. A string `content` is drawn as text |
| `TableColumn` | `{key: string; header: string; align?: 'left' \| 'right'}`, with `align` defaulting to `'left'` |
| `TableRow` | `Record<string, string \| number>` |
| `TreeViewNode` | `{label: string; children?: TreeViewNode[]}`. A node with children is a branch |

The props types of the components are listed in the components table above. Each one is exported under the name shown.

## Not exported from the root

These exist in the source but are not part of the entry. Do not import them from `@nemesis-oss/termina-ui`.

- `UnorderedListItemProps` and `OrderedListItemProps`. The item components are reachable only through `.Item`.
- `SelectOption` and `MultiSelectOption`, the row components inside `Select` and `MultiSelect`.
- `StatusMessageVariant`, the union of `info`, `success`, `error`, and `warning`. Use `StatusMessageProps['variant']` instead.
- The internal state and input hooks, such as `useTextInputState`, `useEmailInput`, and `usePasswordInput`.
- `cellAspectRatio` in `lib/spatial.ts`, which is a module constant.
