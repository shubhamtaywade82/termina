# Changelog

All notable changes to the `@nemesis-oss/termina-*` packages. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The packages share one version number, which `scripts/check-release.mjs` enforces at tag time. The release steps are in [docs/RELEASING.md](docs/RELEASING.md).

This file starts at 0.2.0. Earlier history is in `git log`, and the release commit for 0.2.0 is `c70858f`.

## [Unreleased]

## [0.3.0] - 2026-10-25

This is a minor release. Before 1.0.0, a minor release may change public API, so the two changes marked **API change** below can break code that depends on the old types. The rest are behavior changes or additions.

### Added

- Directional focus. `useFocusManager().focusDirection('up' | 'down' | 'left' | 'right')` moves focus to the nearest focusable component on screen. `nearestInDirection()` exposes the same geometry. A component takes part when it passes a `ref` to `useFocus`. Components without one stay in Tab order only.
- `examples/starter`: a small app built on core and ui. It is not published.
- Developer tooling in the repository. `pnpm lint` runs xo in each package, and CI runs it. `pnpm docs:check` checks the API pages against the built declarations and the sidebar links. `pnpm release:rehearse` dry-runs the publish and checks each tarball. `pnpm --filter @nemesis-oss/termina-core run bench` writes a JSON render throughput report.

### Fixed

- Soft-wrapped text no longer starts a line with the space it broke at.
- Tables and `DataTable` fit their container. Their columns shrink, and the widest one truncates.
- List text wraps inside its marker. Markers no longer shrink, so `1.` keeps its space after it at narrow widths.
- Text in a box that shares a row with a sibling wraps inside the box instead of overflowing the row. Components no longer need `flexBasis={0}` to get this.
- `Select` scrolls when focus moves above the visible window.
- A controlled `ScrollBox` does not drift past an offset its parent refused.
- `core` imports `onExit` from `signal-exit` 4 by its named export.

### Changed

- **API change (genui):** `GenUIRegistry.toJSONSchema()` returns the `LibraryJSONSchema` type from `@openuidev/lang-core`, not `Record<string, unknown>`. Code that reads a string key from the result needs a cast or a typed access.
- **API change (genui):** `GenUINode` includes plain objects, which the adapter emits for data such as table rows. Code that switches over `GenUINode` must handle that member.
- **genui renderer:** each node's props are checked against its component's schema before `render` runs. A node that fails shows an "Invalid props" error box. Components receive the schema's parsed output, so unknown keys are dropped and zod defaults apply.
- **genui `Table`:** cells that are objects print as JSON instead of `[object Object]`. Rows that are not objects are still skipped.
- **genui children:** a top-level `0`, `false` or `""` child renders as text, as an array child already did.
- **genui `TextInput`:** shows its default value when the stored value is not a string.
- `@openuidev/lang-core` is declared as `^1.0.1`. The lock still pins 1.0.1.
- Dependency updates from Dependabot: `chalk` 6, `cli-cursor` 5, `p-queue` 10 (dev), and `@xterm/xterm` 6 for the docs site. `typescript` stays pinned to 5.9.3.
