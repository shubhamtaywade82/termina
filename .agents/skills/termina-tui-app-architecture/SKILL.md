---
name: termina-tui-app-architecture
description: Use when structuring a multi-screen or stateful Termina CLI/TUI application: navigation, focus ownership, keyboard routing, shared state, forms, dialogs, long-running tasks, screen composition, or reusable application-level modules.
---

# Termina TUI Application Architecture

Use this skill when a feature is larger than a single component. It defines **how the application is composed and how state and interactions move through it**. Follow the current Termina APIs; do not import assumptions from a browser SPA framework without evidence that they fit a terminal.

## Establish the boundaries

- Renderer/runtime: `packages/core/` and public exports from `@nemesis-oss/termina-core`.
- Reusable visual and interactive components: `packages/ui/` and public exports from `@nemesis-oss/termina-ui`.
- Application-specific screens, domain state, API clients, orchestration, and persistence belong in the consuming application, not in the UI component library.
- Read `FORK.md`, the relevant public API pages, and adjacent examples before choosing a pattern.
- Do not create a router, state-management dependency, event bus, or abstraction layer for a small app unless the existing architecture or requirements justify it.

## Architecture workflow

1. **Model the user flows.** List screens/views, entry points, exits, decisions, and cancel/retry paths. Draw the state transitions for workflows where invalid sequences would be harmful.
2. **Assign state ownership.** Separate domain state (jobs, records, agent runs) from ephemeral UI state (focused panel, active tab, open help). Give each state a single authoritative owner.
3. **Define navigation and focus.** Establish what receives input on each screen, how focus moves, which keys are global, and how nested components are deactivated when they should not consume input.
4. **Build screen compositions.** Compose existing Termina components inside app-owned screen components. Keep layout, state transitions, domain operations, and transport/API calls from becoming one large component.
5. **Define lifecycle handling.** Specify loading, completion, failure, cancellation, retry, unmount, and process exit behavior for asynchronous operations, subscriptions, and timers.
6. **Test workflows, not only components.** Cover important transitions end-to-end using the project test helpers and a terminal-like fixture where necessary. Verify teardown and recovery as well as the happy path.

## State and component boundaries

- Keep domain operations outside presentational components. A button callback may request an operation; it should not hide networking, authorization, persistence, or side effects in display logic.
- Pass explicit typed props and callbacks at component boundaries. Avoid global mutable state when a local state owner or explicit context is enough.
- Use reducer/state-machine style modeling when a workflow has distinct valid states and transitions. Reject impossible transitions rather than rendering contradictory combinations.
- Keep UI state derived from authoritative domain state when possible. Avoid separate booleans that can contradict one another (for example, `isRunning`, `isComplete`, and `hasFailed` all becoming true).
- Model collections with stable identifiers. Do not rely on array positions as identities when rows may be inserted, removed, reordered, or streamed.
- Keep data refresh and rerenders from resetting user's selection or scroll position unless the interaction contract requires it.
- Define empty and unavailable values explicitly; do not use fabricated domain values as visual placeholders.

## Input and focus ownership

- The core exports `useInput`, `useFocus`, and related stream/terminal hooks. Inspect their actual API and examples before use.
- Make key ownership explicit: global commands, screen navigation, and component-local interactions should not accidentally handle the same key simultaneously.
- Use `isActive` on components that expose it when they should temporarily stop reading keys. Do not assume every component supports the same prop.
- Check `isRawModeSupported`/piped-input behavior through the public APIs and tests; an app must not crash simply because it is run under a pipe or CI.
- Avoid registering multiple always-active arrow-key handlers in nested or side-by-side components. This is especially important for `ScrollBox`, `DataTable`, `Tabs`, selectors, and trees.
- Specify shortcut collisions, modifier behavior, Escape semantics, and whether Enter submits, expands, selects, or confirms in each context.
- On exit, restore terminal behavior through the renderer's lifecycle rather than implementing parallel ANSI mode management in application components.

## Navigation and dialogs

- Termina is a component renderer, not a browser DOM. Use existing composition patterns and terminal rendering semantics.
- Do not assume the current `Dialog` provides modal overlaying or focus trapping. Its documented implementation renders in normal layout and Escape only closes it when `onClose` is supplied.
- Confirmation UX should explicitly state the operation and consequences, have clear confirm/cancel options, and leave domain authorization in the operation layer.
- If the app needs a true focus-trapped modal, first assess the known gap in `FORK.md`; implement and test the required behavior deliberately rather than simulating it with a title box.

## Async tasks and cleanup

- Keep async work separate from the rendering tree; feed progress/results into typed application state.
- Support cancellation only if the underlying operation can actually be cancelled. If cancellation is cooperative, represent the request and final outcome separately.
- Prevent stale responses from overwriting newer selections or requests; use request IDs, abort signals, or the established project pattern where appropriate.
- Clean up timers, event listeners, subscriptions, and streams on unmount and process exit.
- Retry only recoverable operations, preserve useful error context, and avoid duplicate side effects. Make idempotency or duplicate-submission behavior explicit for consequential operations.
- Never infer task completion from a closed spinner or a progress animation; use the operation's actual outcome.

## Recommended structure

Adapt to the consuming application's conventions. For a multi-screen app, a reasonable conceptual separation is:

- **Domain/services:** typed operations and data contracts; no React rendering.
- **Application state:** current route/screen, domain entities, operation state, focus/selection state.
- **Screens:** major user workflows.
- **Components:** reusable widgets, preferably from Termina UI.
- **Effects/adapters:** input streams, API clients, timers, cancellation and persistence, with cleanup.
- **Tests:** unit tests for transitions plus integration tests for rendered screens and input sequences.

This is a responsibility map, not a mandate to create a folder for every bullet.

## Handoffs

- Use `termina-tui-design` to specify the information hierarchy and interaction UX before composing complex screens.
- Use `termina-agentic-ui-patterns` for AI run/tool lifecycle states and approval/cancellation workflows.
- Use `termina-ui` for new reusable components; use `termina-core` only for missing/incorrect terminal runtime capability.
- Use `termina-tui-validation` for terminal-size, input, and workflow acceptance tests.
