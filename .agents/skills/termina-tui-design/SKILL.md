---
name: termina-tui-design
description: Use when planning or improving a Termina terminal UI, dashboard, CLI workflow, screen layout, information hierarchy, responsive terminal view, theme, empty/loading/error state, or visual interaction before or during implementation.
---

# Termina TUI Design

Design terminal interfaces for clarity, predictable interaction, and constrained space. This skill owns **what the interface should communicate and how people use it**; it does not replace core runtime or component implementation skills.

## Read the real library before designing

- Start with `FORK.md` for current capabilities and known limitations.
- Check the UI kit overview and relevant component pages under `docs-site/ui/`; discover exact filenames from the repository instead of guessing routes.
- Inspect public exports in `packages/ui/source/index.ts` and `packages/core/src/index.ts`.
- Read the nearest component source, test, documentation, and live demo before deciding to create a new primitive.
- Use the project theme conventions in `packages/ui/source/theme.tsx` and `docs-site/ui/theming.md`. A `ThemeProvider` value should follow the documented shape; do not assume a partial theme automatically merges with `defaultTheme`.

## Design workflow

1. **Clarify the task.** Identify the primary user goal, essential data, decisions, secondary actions, frequency of use, and whether the interface is interactive or log-oriented. Do not add screens or controls that do not support a user need.
2. **Map information hierarchy.** Separate primary content, supporting metadata, status, actions, and diagnostics. Make the current task and most important result obvious without relying on color alone.
3. **Sketch terminal regions.** Plan header/title, navigation or context, main work area, feedback/status, and optional help/footer only when useful. Keep the composition functional in plain text and at narrow widths.
4. **Specify the interaction contract.** Document keys, focus order, selection, submit/cancel behavior, scrolling, confirmation, and the visible result of each meaningful action before implementing complex flows.
5. **Choose existing components.** Prefer the actual exported Termina components over bespoke lookalikes. Examples include `Header`, `StatusMessage`, `Alert`, `Table`/`DataTable`, `Tabs`, `TreeView`, `ScrollBox`, `LogStream`, `StreamingText`, `Gauge`, and the input components. Confirm each component's real API and constraints before use.
6. **Design all important states.** Consider initial, loading, streaming, empty, success, warning, error, cancellation, offline/unavailable, and recovery states as relevant. Never show an empty panel with no explanation when a clear empty-state message is possible.
7. **Validate at actual terminal dimensions.** Check narrow, typical, and wide sizes; long text; large datasets; Unicode; monochrome; and interactive versus piped output where applicable. Revise the composition based on observed rendering, not just source inspection.

## Terminal layout rules

- Treat terminal dimensions as rows and columns, not pixels. Use the actual core API such as `useWindowSize` when the composition must adapt to resize.
- Prefer Yoga-backed `Box` layouts and explicit width/height constraints where appropriate. Avoid brittle runs of spaces and hand-aligned text when a layout primitive can preserve alignment.
- Use `string-width` or the repository's existing width-aware helpers for manual column calculations. JavaScript `string.length` is not terminal display width for emoji, combining sequences, or full-width characters.
- Choose wrapping, truncation, scrolling, or a compact layout deliberately. Do not let long labels silently push essential status or controls off-screen.
- A `ScrollBox` has an explicit viewport height. Content does not become scrollable merely because it exceeds its parent's height; use a scroll component intentionally.
- A table should have an explicit strategy for column widths, missing values, long cells, row navigation, and large row counts. Use the existing `DataTable` contract where suitable.
- Reduce optional detail before sacrificing the primary action or the state of the current task. On a narrow screen, collapse secondary metadata or offer a detail view rather than cramming everything into one row.
- Keep decorative borders and separators subordinate to the content. Avoid a box around every label or excessive use of color, inverse text, symbols, and spinners.
- Every status must remain understandable without color. Pair color with plain-language labels, consistent symbols, or both.
- Keep prompts, key hints, and actions close to the content they affect. Use consistent, discoverable key bindings across screens.

## Interaction and accessibility rules

- Design keyboard-first. Mouse input may supplement it but must not be the only way to perform essential actions.
- Define one clear focus model. Visible focus must be distinguishable in a monochrome terminal, and focus order must follow the task's natural sequence.
- Avoid multiple simultaneously active components consuming the same key. Use the component's `isActive` controls or app-level focus state where the API provides them.
- Always show how to leave, cancel, or go back from a nontrivial interaction. Destructive or externally consequential actions require explicit, informed confirmation.
- Do not treat the existing `Dialog` as a fully modal overlay: its current documented behavior does not trap focus, and the surrounding app can still receive keys.
- Consider screen-reader/non-interactive output, clear labels, logical reading order, and text alternatives to purely decorative symbols where the application needs them.
- Do not print secrets, raw credentials, or unredacted tool payloads into a TUI just because the screen is local.

## Design deliverable for substantial requests

Before implementation, provide a compact screen specification in the work plan or PR:
- Primary user goal and key information.
- Screen regions and responsive fallback behavior.
- Key bindings, focus behavior, and state transitions.
- Loading, empty, failure, cancellation, and success states that apply.
- Existing Termina components to reuse and any genuine component gaps.
- Acceptance checks at selected terminal sizes.

Avoid producing a long design document for a trivial one-component fix. Scale the specification to the size and risk of the feature.

## Anti-patterns to reject

- A dashboard that is attractive at 120 columns but unusable at 80 or in a small terminal.
- Progress bars or percentage estimates that are not tied to measured progress.
- Color-only error/success indicators or unlabeled glyphs.
- A modal-like design that assumes focus is trapped when it is not.
- Bespoke layout code that duplicates an existing component without a concrete requirement.
- Snapshots that look correct while keyboard navigation, scrolling, resize, or cancellation is broken.

## Handoffs

- Use `termina-ui` for implementing reusable components and their public APIs.
- Use `termina-tui-app-architecture` when the feature spans screens, focus ownership, navigation, or complex state transitions.
- Use `termina-agentic-ui-patterns` for AI plans, tool execution, streaming, approval, cancellation, and recovery UX.
- Use `termina-tui-validation` to turn the acceptance criteria into executable terminal tests.
- Use `termina-core` only when the needed renderer/runtime capability is absent or incorrect.
