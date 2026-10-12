---
outline: [2, 3]
---

# Theming

Each themed component reads its styles and config from a theme object that React context supplies. `defaultTheme` is the theme used when no `ThemeProvider` is above a component. `ThemeProvider` gives a subtree a different theme, and `extendTheme` builds that theme from `defaultTheme` without changing it. This page covers the theme shape, the keys each component reads, and one override worked through in full. Use it when you need to change colors, characters, or icons across an app.

## Preview

The first frame is a 40 percent `ProgressBar` under `defaultTheme`, with filled cells in magenta.

<TerminalPreview id="theming-default-progress-bar" />

The second frame is the same bar after `extendTheme` overrides the `ProgressBar.config` entry, so filled cells are `#` and empty cells are `-`.

<TerminalPreview id="theming-extended-progress-bar-config" />

## Theme shape

```ts
type Theme = {
	components: Record<string, ComponentTheme>;
};

type ComponentTheme = {
	styles?: Record<string, (props?: any) => ComponentStyles>;
	config?: (props?: any) => Record<string, unknown>;
};

type ComponentStyles = Record<string, unknown>;
```

`components` is keyed by component name, such as `Spinner` or `ProgressBar`. Each entry has two optional parts:

- `styles` holds functions that return props for `Box` or `Text` from `@nemesis-oss/termina-core`. A component spreads the result, for example `<Text {...styles.frame()}>`. A style function receives the values the component computes, such as `isFocused`.
- `config` holds functions that return values which are not styles, such as the characters a `ProgressBar` draws or the icon an `Alert` shows.

## Default theme

`defaultTheme` has entries for 35 components: `Accordion`, `Alert`, `Autocomplete`, `Badge`, `CodeBlock`, `ConfirmInput`, `DataTable`, `Dialog`, `DiffView`, `Divider`, `EmailInput`, `Gauge`, `Header`, `JSONViewer`, `KeyHint`, `LoadingBar`, `Markdown`, `MultiSelect`, `OrderedList`, `PasswordInput`, `ProgressBar`, `Select`, `Sparkline`, `Spinner`, `Stepper`, `StatusMessage`, `StreamingText`, `Table`, `Tabs`, `TextInput`, `Toast`, `TokenCounter`, `Typewriter`, `TreeView`, and `UnorderedList`. `LogStream` and `ScrollBox` do not read the theme. They set their props directly in the component.

Each entry is defined in `packages/ui/source/components/<name>/theme.ts`, where `<name>` is the component's folder in kebab case, for example `progress-bar`. The table under "Where styles live" lists the keys in each file.

## Provide a theme

`ThemeProvider` takes `children` and `theme`, and both are required.

```tsx
<ThemeProvider theme={theme}>
	{/* components rendered here read from theme */}
</ThemeProvider>
```

The provider does not merge its value with `defaultTheme`. Pass a complete theme, which `extendTheme(defaultTheme, ...)` returns. If a component's entry is missing from the theme, `useComponentTheme` returns `undefined` for it, and its first render fails. With `components: {}` and a `Spinner` inside, the render fails with `TypeError: Cannot destructure property 'styles' of 'useComponentTheme(...)' as it is undefined`.

Providers nest. The nearest `ThemeProvider` above a component supplies that component's theme.

## Build a theme with extendTheme

```ts
extendTheme(originalTheme: Theme, newTheme: Theme): Theme
```

`extendTheme` returns `deepmerge(originalTheme, newTheme)`. It does not change either argument. The merge follows these rules:

1. Objects merge key by key at every level. A component that `newTheme` does not name keeps its default entry, and a style key that `newTheme` does not name keeps its default function.
2. A function in `newTheme` replaces the function at the same path. The original function is not called, and its return value is not merged into the replacement. This matters for `config`. The default `ProgressBar` config returns two characters. An override that returns only `completedCharacter` leaves `remainingCharacter` undefined.
3. Arrays in a plain, non-function field are concatenated rather than replaced. The default theme has no such field, so this rule applies only to fields you add yourself.

## Where styles live

Each component's `theme.ts` declares its entry with `satisfies ComponentTheme`. The components read the entry through `useComponentTheme`. The table lists the keys in each file. Parameters are the values the component passes to the function.

| Component | Style keys | Config keys |
| --- | --- | --- |
| `Accordion` | `container()`, `title({isFocused})`, `icon({isOpen})`, `content()` | none |
| `Alert` | `container({variant})`, `iconContainer()`, `icon({variant})`, `content()`, `title()`, `message()` | `config({variant})`: `icon` |
| `Autocomplete` | `container()`, `input()`, `option({isHighlighted})`, `noMatches()` | none |
| `Badge` | `container({color})`, `label()` | none |
| `CodeBlock` | `container()`, `label()`, `lineNumber({isHighlighted})`, `code({isHighlighted})`, `gutter()` | none |
| `ConfirmInput` | `input({isFocused})` | none |
| `DataTable` | `container()`, `headerCell({isFocused})`, `row({isFocused})`, `cell()`, `separator()`, `sortIndicator()` | none |
| `Dialog` | `container()`, `title()`, `body()`, `footer()` | none |
| `DiffView` | `container()`, `header()`, `hunk()`, `added()`, `removed()`, `context()` | none |
| `Divider` | `container()`, `line()`, `title()` | none |
| `EmailInput` | `value()` | none |
| `Gauge` | `container()`, `label()`, `filled()`, `empty()`, `value()` | `config({value})`: `color` |
| `Header` | `container()`, `title()`, `subtitle()` | none |
| `JSONViewer` | `key()`, `string()`, `number()`, `boolean()`, `null()`, `punctuation()` | none |
| `KeyHint` | `container()`, `key()`, `label()` | none |
| `LoadingBar` | `container()`, `track()`, `block()` | none |
| `Markdown` | `container()`, `heading({level})`, `paragraph()`, `listBullet()`, `code()`, `codeBlock()`, `blockquote()`, `bold()`, `italic()`, `link()` | none |
| `MultiSelect` | `container()`, `option({isFocused})`, `selectedIndicator()`, `focusIndicator()`, `label({isFocused, isSelected})`, `highlightedText()` | none |
| `OrderedList` | `list()`, `listItem()`, `marker()`, `content()` | none |
| `PasswordInput` | `value()` | none |
| `ProgressBar` | `container()`, `completed()`, `remaining()` | `config()`: `completedCharacter`, `remainingCharacter` |
| `Select` | `container()`, `option({isFocused})`, `selectedIndicator()`, `focusIndicator()`, `label({isFocused, isSelected})`, `highlightedText()` | none |
| `Sparkline` | `bars()` | none |
| `Spinner` | `container()`, `frame()`, `label()` | none |
| `StatusMessage` | `container()`, `iconContainer()`, `icon({variant})`, `message()` | `config({variant})`: `icon` |
| `Stepper` | `container()`, `icon({status})`, `label({status})` | none |
| `StreamingText` | `text()`, `cursor()` | none |
| `Table` | `container()`, `header()`, `row()`, `cell({align})`, `separator()` | none |
| `Tabs` | `tabBar()`, `tab({isActive})`, `panel()` | none |
| `TextInput` | `value()` | none |
| `Toast` | `container()` | none |
| `TokenCounter` | `container()`, `count({status})`, `label()` | none |
| `TreeView` | `container()`, `node({isFocused})`, `guide()`, `branch({isExpanded})`, `leaf()` | none |
| `Typewriter` | `text()`, `cursor()` | none |
| `UnorderedList` | `list()`, `listItem()`, `marker()`, `content()` | `config()`: `marker`, a `string` or a `string[]` indexed by depth |

## Worked example: a green ProgressBar with ASCII characters

The default `ProgressBar` draws a magenta `completed` run and a dim `remaining` run, with characters from `figures`. This example makes the filled part green, draws `#` for filled cells and `-` for unfilled ones, and leaves every other component on its default.

```tsx
import {render, type TextProps} from '@nemesis-oss/termina-core';
import {ProgressBar, ThemeProvider, defaultTheme, extendTheme} from '@nemesis-oss/termina-ui';

const theme = extendTheme(defaultTheme, {
	components: {
		ProgressBar: {
			styles: {
				completed: (): TextProps => ({
					color: 'green',
				}),
			},
			config: () => ({
				completedCharacter: '#',
				remainingCharacter: '-',
			}),
		},
	},
});

const App = () => (
	<ThemeProvider theme={theme}>
		<ProgressBar value={40} />
	</ThemeProvider>
);

render(<App />);
```

Three things happen here:

- `completed` replaces the default style function. `remaining` is not named, so it keeps its default `dimColor: true`.
- `config` replaces the default config function, so the replacement must return both characters. If it returned only `completedCharacter`, the bar would throw `TypeError: Cannot read properties of undefined (reading 'repeat')` as soon as it has unfilled cells.
- No other component is affected. Each one keeps its default entry.

## Read a theme in a custom component

```ts
useComponentTheme<T extends ComponentTheme>(component: string): T
```

`useComponentTheme` reads `theme.components[component]` from the nearest provider and casts it to `T`. The cast does not check that the entry exists. For a name that the theme does not contain, the call returns `undefined` at runtime, and destructuring the result throws. The entry must be part of the theme that the nearest provider receives, for example one built with `extendTheme`.

```tsx
import {Text, render, type TextProps} from '@nemesis-oss/termina-core';
import {
	ThemeProvider,
	defaultTheme,
	extendTheme,
	useComponentTheme,
	type ComponentTheme,
} from '@nemesis-oss/termina-ui';

const labelTheme = {
	styles: {
		label: (): TextProps => ({
			color: 'green',
		}),
	},
} satisfies ComponentTheme;

type LabelTheme = typeof labelTheme;

const theme = extendTheme(defaultTheme, {
	components: {
		Label: labelTheme,
	},
});

const Label = ({children}: {children: string}) => {
	const {styles} = useComponentTheme<LabelTheme>('Label');

	return <Text {...styles.label()}>{children}</Text>;
};

render(
	<ThemeProvider theme={theme}>
		<Label>Hello</Label>
	</ThemeProvider>,
);
```
