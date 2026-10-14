# Termina agent skills

These repository-local skills are focused instruction sets for agents working on Termina or building applications with it. Select by task; do not load every skill for every change.

## Skill routing

| Skill | Use it for |
| --- | --- |
| [termina-tui-design](termina-tui-design/SKILL.md) | Information hierarchy, screen layouts, responsive design, interaction contracts, UX states |
| [termina-tui-app-architecture](termina-tui-app-architecture/SKILL.md) | Multi-screen applications, state ownership, navigation, focus/input ownership, asynchronous workflows |
| [termina-agentic-ui-patterns](termina-agentic-ui-patterns/SKILL.md) | Agent plans, tool execution, streaming, approvals, cancellation, retries, run history and outcomes |
| [termina-ui](termina-ui/SKILL.md) | Reusable component implementation, public APIs, themes, component tests, docs and demos |
| [termina-core](termina-core/SKILL.md) | React renderer, terminal protocol, input routing, capabilities, rendering, resize/reflow, runtime lifecycle |
| [termina-tui-validation](termina-tui-validation/SKILL.md) | Acceptance tests for layout, terminal modes, keyboard/mouse interaction, reflow, async behavior and docs previews |
| [termina-skill-evaluation](termina-skill-evaluation/SKILL.md) | Evaluate skill routing and actual agent outputs with repeatable tasks, hard gates, and evidence-based scoring |

The evaluation skill has a runnable fixture suite in [`.agents/evals/`](../evals/README.md). Run `pnpm evals:check` to validate the task manifests; this verifies fixture integrity, not agent output quality.

## Recommended routing order

For a substantial new terminal application or feature, think in this order:

1. **Design** the screen and interaction contract.
2. **Architect** the screens, state ownership, focus, and workflows.
3. Apply **agentic UI patterns** if the application exposes AI/tool execution.
4. Implement reusable primitives with **Termina UI**; change **Termina Core** only when a runtime capability is missing or broken.
5. **Validate** the finished behavior at representative terminal sizes and interaction modes.

Use only the applicable subset for a small bug fix. A task that only changes a low-level parser should not need the design or agentic UI skills; a composition-only feature usually should not need changes to the renderer.
