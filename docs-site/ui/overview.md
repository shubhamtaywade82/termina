---
outline: [2, 3]
---

# UI Kit Overview

`@nemesis-oss/termina-ui` is a kit of 15 components for terminal interfaces: text input, selection, status, progress, lists, and two scrolling viewers, `ScrollBox` and `LogStream`. The components render through `@nemesis-oss/termina-core`. Thirteen of them read their styles from a theme, so one `ThemeProvider` can restyle a whole screen. The two viewers do not use the theme. Use the kit when you need these standard parts in a terminal app built on `@nemesis-oss/termina-core`. It is a fork of `ink-ui` 2.0.0, ported onto `@nemesis-oss/termina-core`. If you have not set up a workspace app yet, start with [Getting Started](/guide/getting-started).

## Install in this workspace

`@nemesis-oss/termina-ui` is a workspace package in this repository. It is not published to npm. Another package in the workspace uses it by declaring it as a workspace dependency:

```json
{
  "type": "module",
  "dependencies": {
    "@nemesis-oss/termina-core": "workspace:*",
    "@nemesis-oss/termina-ui": "workspace:*",
    "react": ">=19.3.0"
  }
}
```

`@nemesis-oss/termina-ui` depends on `@nemesis-oss/termina-core` through the workspace and declares `react` (`>=19.3.0`) as a peer dependency. Its `engines` field requires Node.js 22 or newer. The package entry is `build/index.js`, so run `pnpm build` from the repository root before another package imports it. The root `build` script runs each package's build in dependency order, so `@nemesis-oss/termina-core` builds before `@nemesis-oss/termina-ui`.

`examples/turnstream` is a workspace consumer. It imports `LogStream`, `ScrollBox`, and `TextInput` from `@nemesis-oss/termina-ui`.

## Import

Everything the kit exports comes from `@nemesis-oss/termina-ui`: components, hooks, theme helpers, and types. The entry does not re-export anything from `@nemesis-oss/termina-core`, so `render`, `Box`, and `Text` come from `@nemesis-oss/termina-core`.

```tsx
import {render} from '@nemesis-oss/termina-core';
import {Alert, Select, TextInput} from '@nemesis-oss/termina-ui';

const App = () => (
	<>
		<Alert variant="info" title="Deploy">
			Choose a target, then enter a tag.
		</Alert>
		<Select
			options={[
				{label: 'staging', value: 'staging'},
				{label: 'production', value: 'production'},
			]}
			onChange={target => {
				// target is the value of the selected option
			}}
		/>
		<TextInput
			placeholder="tag"
			onSubmit={tag => {
				// tag is the input value
			}}
		/>
	</>
);

render(<App />);
```

## Components

| Component | Purpose |
| --- | --- |
| [Alert](/ui/components/alert) | Bordered message with a variant color, an icon, and an optional title. Variants: `info`, `success`, `error`, `warning`. |
| [Badge](/ui/components/badge) | Short inline label on a background color. Default color `magenta`. String children are uppercased. |
| [ConfirmInput](/ui/components/confirm-input) | `Y/n` or `y/N` prompt. `y` confirms and `n` cancels. Enter picks the default choice unless `submitOnEnter` is `false`. |
| [EmailInput](/ui/components/email-input) | Single-line email entry. After `@`, it completes the domain from a list of common providers. |
| [LogStream](/ui/components/log-stream) | Tail-following viewer for an array of strings. Keeps the newest `maxLines` entries. |
| [MultiSelect](/ui/components/multi-select) | Scrollable list where Space toggles an option and Enter submits the selected values. |
| [OrderedList](/ui/components/ordered-list) | Numbered list. A nested list prefixes the parent number, for example `2.1.`. |
| [PasswordInput](/ui/components/password-input) | Single-line input that shows one `*` per grapheme cluster. |
| [ProgressBar](/ui/components/progress-bar) | Horizontal bar. `value` is clamped to 0 through 100. The bar characters come from the theme config. |
| [ScrollBox](/ui/components/scroll-box) | Fixed-height viewport over taller content, scrolled by keys and the mouse wheel. |
| [Select](/ui/components/select) | Scrollable single-choice list. Up and Down move focus, and Enter selects. |
| [Spinner](/ui/components/spinner) | Animated frame with an optional label. `type` selects a cli-spinners animation, default `dots`. |
| [StatusMessage](/ui/components/status-message) | Icon and text for a `success`, `error`, `warning`, or `info` status. |
| [TextInput](/ui/components/text-input) | Single-line input with optional `suggestions`. Enter accepts the shown suggestion and submits the completed value. |
| [UnorderedList](/ui/components/unordered-list) | Bulleted list. The marker comes from the theme config and can vary by nesting depth. |

The kit also exports these, which are not components:

- `ThemeProvider`, `defaultTheme`, `extendTheme`, and `useComponentTheme` are covered in [Theming](/ui/theming).
- `nearestInDirection` and the `Rect`, `Direction`, and `FocusCandidate` types are covered in [Spatial Focus Geometry](/ui/spatial).
- `useSpinner` is the hook behind `Spinner`. See [Spinner](/ui/components/spinner).

Every export, with its signature, is listed in the [API Reference](/api/ui).

## Shared conventions

- Inputs and selects take `isDisabled` (default `false`). When it is `true`, the component ignores keyboard input. This applies to `ConfirmInput`, `EmailInput`, `MultiSelect`, `PasswordInput`, `Select`, and `TextInput`.
- `LogStream` and `ScrollBox` take `isActive` (default `true`) instead. When it is `false`, they ignore keyboard and wheel input.
- Themed components read their styles from the nearest `ThemeProvider` above them. Without a provider, they use `defaultTheme`. See [Theming](/ui/theming).
- `Select` and `MultiSelect` take options of the `Option` type, which is `{label: string; value: string}`.

## What the fork changes

`FORK.md` in the repository root lists every local change. The points below affect behavior, and each one was checked against the source in `packages/ui/source`.

- The components import from `@nemesis-oss/termina-core`. The package does not depend on `ink`.
- `TextInput` and `PasswordInput` edit by grapheme cluster. The cursor moves, inserts, and deletes by cluster, so an emoji or a letter with a combining mark is not split. Backspace at offset 0 does nothing. Delete removes the cluster after the cursor. Ctrl and Meta chords are not inserted as text. Pasted control characters are removed. The shared helpers are in `source/lib/grapheme.ts`.
- `PasswordInput` shows one `*` per grapheme cluster.
- `ScrollBox` and `LogStream` are new. See their component pages for behavior.
- `nearestInDirection` and its types are new. It is pure geometry and is not wired into focus. See [Spatial Focus Geometry](/ui/spatial).

`EmailInput` is not covered by these changes. It moves and deletes by UTF-16 code unit, it does not remove control characters from pasted text, Delete acts as Backspace, and a Ctrl chord with a letter inserts that letter. Code that needs grapheme-aware editing should use `TextInput` or `PasswordInput`.

## Testing

Run the package tests from the repository root with `pnpm --filter @nemesis-oss/termina-ui test`. The suite uses Node's built-in `node:test` runner through `tsx`. The helper in `packages/ui/test/helpers/render.tsx` renders a component to an in-memory stdout and exposes `lastFrame()`. For the wider testing approach, read [Testing](/guide/testing).
