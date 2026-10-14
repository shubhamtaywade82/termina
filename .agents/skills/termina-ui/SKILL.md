---
name: termina-ui
description: Use when implementing, debugging, reviewing, or testing Termina's higher-level terminal components in packages/ui: inputs, selectors, tables, dialogs, scrolling, themes, rendering, keyboard/mouse interaction, component APIs, docs, or live demos.
---

# Termina UI Component Engineering

Use this skill for changes to `@nemesis-oss/termina-ui`, the reusable component kit built on `@nemesis-oss/termina-core`. Keep component behavior predictable in a terminal, not just visually plausible in a screenshot.

## Start with repository facts

- Read `FORK.md` before changing component behavior. It lists the pinned upstream ink-ui 2.0.0 base, local extensions, and known deviations/gaps.
- Source lives in `packages/ui/source/components/<component>/`; component entry points are re-exported by `packages/ui/source/index.ts`.
- Tests live in `packages/ui/test/` and use the shared test renderer under `packages/ui/test/helpers/`.
- VitePress documentation and runnable demos live in `docs-site/`; demos are under `docs-site/.vitepress/theme/demos/`. Find the nearest existing component's docs page before adding a new one—do not guess routes or filenames.
- Core runtime behavior belongs in `@nemesis-oss/termina-core`. Do not reach into core internals from a UI component to avoid a needed public API.

## Workflow

1. **Read adjacent components.** Match local conventions for prop types, defaults, themes, styling, component exports, test setup, and documentation.
2. **Define the interaction contract.** Specify keyboard behavior, selection semantics, disabled/loading/empty states, focus behavior, and whether mouse support is required.
3. **Test-first.** Add focused tests for expected output and interaction before modifying implementation. Use the existing `node:test` patterns and render helper.
4. **Implement the smallest component-level change.** Keep reusable layout logic in the component, not duplicated across demos. Use the core public API.
5. **Finish the whole feature.** For a new component, add its public export, tests, a documentation page, a live demo, and theme support when applicable. For an existing component, update all affected artifacts.
6. **Verify.** Run the UI tests, typecheck/build the package, and run broader workspace checks when the change crosses package boundaries.

## Routing to companion skills

- Use `termina-tui-design` to decide information hierarchy, component composition, responsive fallbacks, and the interaction contract before implementing a substantial screen.
- Use `termina-tui-app-architecture` for multi-screen state, keyboard ownership, navigation, and async lifecycle.
- Use `termina-agentic-ui-patterns` for agent plans, tool activity, streaming, approvals, cancellation, and recovery behavior.
- Use `termina-tui-validation` for terminal-size matrices, interaction acceptance tests, xterm-backed layout checks, and docs previews.

## Component quality rules

### Terminal layout and text

- Use `Box` and `Text` semantics correctly; `Text` should contain text and nested `Text` elements, not layout containers.
- Measure displayed width with the existing `string-width` dependency or established project helpers. JavaScript `string.length` is not terminal display width for emoji, combining marks, or full-width characters.
- Handle narrow terminal widths, long labels, wrapping, empty data, and content larger than the viewport. Avoid hard-coded widths unless the API intentionally requires them.
- Keep color decorative rather than the only signal for status or selection. Preserve readable output in monochrome/limited-color terminals.

### Keyboard, mouse, and focus

- Document and test key bindings. Check arrows, Enter, Escape, Home/End, PageUp/PageDown, and boundary behavior whenever they apply to the component.
- Do not assume a component can capture stdin in non-interactive mode. Respect core's raw-mode behavior and avoid registering competing input handlers.
- Use current state safely in bursts of key/mouse events. If an event path can observe stale React state, follow established ref/current-value patterns and test repeated events.
- Clamp scrolling and selection offsets after data changes; cover empty lists and shrinking datasets.
- Mouse interaction requires the core render configuration and terminal support. Verify it end-to-end rather than testing only the callback in isolation.
- Clean up timers, subscriptions, and event handlers. Animated or streaming components must stop work when unmounted.

### Themes, API, and compatibility

- Follow `packages/ui/source/theme.ts` and the existing theme-provider/extension patterns instead of embedding unrelated global colors.
- Keep props and callbacks explicitly typed. Handle optional callbacks without crashing and document intentional behavior changes.
- Add the export to `packages/ui/source/index.ts` when a component is public; verify the build output and declaration files.
- Keep the UI package decoupled from core internals. If core needs a new capability, make a deliberate public API change and test it in the core package first.
- Check `FORK.md` for known limitations before claiming behavior. In particular, the current `Dialog` has no focus trap; do not document or imply that it does unless you implement and test one.

## Required verification

```sh
pnpm --filter @nemesis-oss/termina-ui run test
pnpm --filter @nemesis-oss/termina-ui run typecheck
pnpm --filter @nemesis-oss/termina-ui run build
pnpm run docs:previews:check
pnpm run verify
```

The UI package uses Node's built-in test runner with `tsx`. Run focused tests first. `pnpm run docs:previews:check` validates docs demo previews; run the full docs build when you change VitePress configuration or navigation.

## Completion checklist

- [ ] Props, defaults, empty/disabled states, and keyboard bindings are explicit.
- [ ] Tests cover visual output and state transitions, including boundaries.
- [ ] Unicode display width and narrow-terminal behavior are addressed where relevant.
- [ ] The public export, docs page, and live demo are updated for new components.
- [ ] Timers/listeners are cleaned up and no stale-state race remains.
- [ ] Tests, docs checks, and any unrun verification are reported accurately.
