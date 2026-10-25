# Changelog

All notable changes to the `@nemesis-oss/termina-*` packages. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The packages share one version number, which `scripts/check-release.mjs` enforces at tag time. The release steps are in [docs/RELEASING.md](docs/RELEASING.md).

This file starts at 0.2.0. Earlier history is in `git log`, and the release commit for 0.2.0 is `c70858f`.

## [Unreleased]

### Added

- Directional focus. `useFocusManager().focusDirection('up' | 'down' | 'left' | 'right')` moves focus to the nearest focusable component on screen. `nearestInDirection()` exposes the same geometry. A component takes part when it passes a `ref` to `useFocus`. Components without one stay in Tab order only.
- `examples/starter`: a small app built on core and ui. It is not published.

### Fixed

- Soft-wrapped text no longer starts a line with the space it broke at.
- Tables and `DataTable` fit their container. Their columns shrink, and the widest one truncates.
- List text wraps inside its marker. Markers no longer shrink, so `1.` keeps its space after it at narrow widths.
- Text in a box that shares a row with a sibling wraps inside the box instead of overflowing the row. Components no longer need `flexBasis={0}` to get this.
- `Select` scrolls when focus moves above the visible window.
- A controlled `ScrollBox` does not drift past an offset its parent refused.
- `core` imports `onExit` from `signal-exit` 4 by its named export.

### Changed

- Dependency updates from Dependabot: `chalk` 6, `cli-cursor` 5, `p-queue` 10 (dev), and `@xterm/xterm` 6 for the docs site. `typescript` stays pinned to 5.9.3.
