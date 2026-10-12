---
outline: [2, 3]
---

# @nemesis-oss/termina-ui API Reference

This page lists every export of `packages/ui/source/index.ts`, the entry point of `@nemesis-oss/termina-ui`. Signatures are taken from the source and its emitted declarations. Prop tables are on each component page, and the component table links to them. For the component list, read the [UI Kit Overview](/ui/overview). For the theme shape, read [Theming](/ui/theming). `@nemesis-oss/termina-ui` is a workspace package and is not published to npm. Its compiled entry is `build/index.js`, with declarations in `build/index.d.ts`.

The entry re-exports nothing from `@nemesis-oss/termina-core`. Import `render`, `Box`, `Text`, and the other core names from `@nemesis-oss/termina-core`.

## Components

Each component has the form `(props: <Props>) => React.JSX.Element`.

| Export | Props type | Page |
| --- | --- | --- |
| `Alert` | `AlertProps` | [Alert](/ui/components/alert) |
| `Badge` | `BadgeProps` | [Badge](/ui/components/badge) |
| `ConfirmInput` | `ConfirmInputProps` | [ConfirmInput](/ui/components/confirm-input) |
| `EmailInput` | `EmailInputProps` | [EmailInput](/ui/components/email-input) |
| `LogStream` | `LogStreamProps` | [LogStream](/ui/components/log-stream) |
| `MultiSelect` | `MultiSelectProps` | [MultiSelect](/ui/components/multi-select) |
| `OrderedList` | `OrderedListProps` | [OrderedList](/ui/components/ordered-list) |
| `PasswordInput` | `PasswordInputProps` | [PasswordInput](/ui/components/password-input) |
| `ProgressBar` | `ProgressBarProps` | [ProgressBar](/ui/components/progress-bar) |
| `ScrollBox` | `ScrollBoxProps` | [ScrollBox](/ui/components/scroll-box) |
| `Select` | `SelectProps` | [Select](/ui/components/select) |
| `Spinner` | `SpinnerProps` | [Spinner](/ui/components/spinner) |
| `StatusMessage` | `StatusMessageProps` | [StatusMessage](/ui/components/status-message) |
| `TextInput` | `TextInputProps` | [TextInput](/ui/components/text-input) |
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

The props types of the components are listed in the components table above. Each one is exported under the name shown.

## Not exported from the root

These exist in the source but are not part of the entry. Do not import them from `@nemesis-oss/termina-ui`.

- `UnorderedListItemProps` and `OrderedListItemProps`. The item components are reachable only through `.Item`.
- `SelectOption` and `MultiSelectOption`, the row components inside `Select` and `MultiSelect`.
- `StatusMessageVariant`, the union of `info`, `success`, `error`, and `warning`. Use `StatusMessageProps['variant']` instead.
- The internal state and input hooks, such as `useTextInputState`, `useEmailInput`, and `usePasswordInput`.
- `cellAspectRatio` in `lib/spatial.ts`, which is a module constant.
