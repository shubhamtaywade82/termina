---
name: termina-agentic-ui-patterns
description: Use when building terminal UX for AI agents, coding assistants, tool-using workflows, plans, streaming model output, tool logs, human approval, cancellations, retries, execution progress, or agent run history with Termina.
---

# Termina Agentic UI Patterns

Use this skill when an application exposes an AI or automation process to a person. The UI must make the agent's **real state, proposed actions, tool activity, and outcomes** understandable and controllable. Visual indicators must reflect facts from the execution layer, not model-generated claims.

## Read Termina-specific capabilities first

- Check `FORK.md`, exports in `packages/ui/source/index.ts`, and docs under `docs-site/ui/components/`.
- Existing relevant primitives include `StreamingText`, `LogStream`, `ScrollBox`, `StatusMessage`, `Alert`, `LoadingBar`, `ProgressBar`, `Stepper`, `Accordion`, `DataTable`, `TokenCounter`, and input/confirmation components. Verify each API and intended behavior in its source and docs.
- `StreamingText` receives the accumulated text from the parent and shows a cursor while `isStreaming` is true; it does not fetch data or manage the stream.
- `LogStream` is suitable for growing log entries and tail-following. Scrolling up pauses following; returning to the bottom resumes it.
- `Dialog` is not a focus-trapped modal. Do not use it as a security or authorization boundary.
- Keep the UI as a view of the orchestrator's state. Agent execution, tool invocation, permission checks, and durable history must live in the appropriate application/service layer.

## Model execution state explicitly

Keep the run lifecycle distinct from the state of an individual step or tool call. A common run-state vocabulary is:

- `idle`: no run has started.
- `planning`: the system is preparing or exposing a plan.
- `running`: actual work is in progress.
- `awaiting_approval`: a specific action is paused pending a human decision.
- `cancelling`: cancellation has been requested but is not yet confirmed.
- `completed`: the execution layer reports success or an explicitly defined successful partial result.
- `failed`: execution ended with an error.
- `cancelled`: the execution layer confirms cancellation.

Adapt names to the application's existing contracts rather than inventing a parallel state system. A step/tool may separately be `queued`, `running`, `succeeded`, `failed`, `skipped`, or `awaiting_approval`. Represent retries as attempts or transitions, not as mysterious resets.

## Workflow presentation

1. **Expose orientation.** Show the run/task name, current phase, and available global actions. When run history exists, distinguish the selected run from a new run.
2. **Show the plan honestly.** Separate proposed steps from completed steps. Mark a step complete only when the orchestrator reports that result.
3. **Expose tool activity.** For meaningful tool calls, show a concise name, purpose, lifecycle state, duration when measured, and a useful result/error summary. Keep raw verbose output available in a scrollable log or detail panel.
4. **Separate answer content from execution logs.** Use a streaming content area for incremental assistant output and a distinct event/log view for tool activity. Avoid making the user infer tool execution from prose alone.
5. **Design interruptions.** Show approval requests, tool errors, timeouts, retries, rate limits, and cancellation state distinctly. Preserve prior output when useful.
6. **Summarize at the end.** Present the final outcome, changed artifacts or actions, failed/skipped steps, and actionable follow-up. Do not leave the user staring at a spinner after the run has terminated.

## Streaming and progress integrity

- Append stream chunks to authoritative app state and pass the accumulated string to `StreamingText`; do not assume the component owns a network stream.
- Stop the streaming cursor when the stream actually ends or is cancelled. Handle empty streams, partial chunks, stream errors, and reconnects.
- Show indeterminate activity when the total work is unknown. Show a percentage only when the execution layer has a meaningful denominator and progress signal.
- Do not invent elapsed time, token counts, ETA, tool duration, confidence, probability, or completion percentages. Label estimates as estimates and explain their source where material.
- Buffer or cap high-volume event output intentionally. Keep logs scrollable and allow users to inspect old output while new events arrive.
- Avoid rerendering the entire event history inefficiently for each token when the data volume is significant; measure before introducing complex rendering optimizations.
- Keep structured execution events separate from formatted display strings so logs can be tested, filtered, and rendered in alternate modes.

## Human approval and side effects

- An approval request must identify the proposed action, target/resource, consequential parameters, and material side effects in plain language.
- Provide explicit approve and reject/cancel choices. Show whether a decision is still pending and what will happen after it.
- Do not treat a UI flag or a button click as proof of authorization. The orchestration/service layer must enforce policy and verify the approval for the exact action.
- Bind an approval to the relevant action/run/version so a stale approval cannot authorize a changed command or payload. Revalidate after material changes.
- Redact secrets and sensitive arguments. Prefer concise summaries with an explicit way to inspect safe details.
- For irreversible operations, require an unambiguous confirmation and make the consequence clear before submission.

## Cancellation, errors, and retry

- Distinguish “cancel requested” from “cancelled” until the worker/runtime confirms it.
- Disable or change controls when operations cannot safely be repeated. Protect against double submission and duplicate side effects.
- Show recoverable versus terminal errors distinctly. Include a sanitized reason and a concrete next action where available.
- Preserve a failed tool's identity, attempt, and error context so retries are diagnosable.
- Do not silently restart an agent or discard a failed run. Make automatic retry policy visible when it affects user expectations.
- Ensure exiting the UI does not falsely imply that a remote agent stopped. Explain the actual detach/cancel behavior supported by the application.

## Interaction design

- Define keyboard shortcuts for run, cancel, approve, reject, show/hide logs, switch panels, and help. Avoid conflicts with input editing and component navigation.
- Use one active owner for each key context. Deactivate hidden or unfocused widgets that would otherwise consume the same keys.
- Preserve copyable plain-text results and provide a useful piped/non-interactive summary when appropriate.
- Color is supplementary: use labels such as `Running`, `Needs approval`, `Failed`, and `Completed` as well as visual signals.
- Design for narrow terminals; logs/details may need switching views instead of side-by-side panels.

## Test scenarios

At minimum, test the flows relevant to the feature:

- Successful run with multiple steps and tool calls.
- Model output that arrives in multiple chunks, then ends.
- Empty output or a tool that returns no rows.
- Tool failure followed by retry or terminal failure.
- Approval accepted, rejected, stale, or no longer applicable.
- Cancellation requested, delayed, and confirmed; cancellation failure where supported.
- Long logs while the user scrolls away from the tail.
- Narrow terminal layout and non-interactive/piped output.
- Duplicate input events and double submission for consequential actions.

## Handoffs

- Use `termina-tui-design` for screen information hierarchy and responsive layout decisions.
- Use `termina-tui-app-architecture` for ownership, workflows, state transitions, and async lifecycle.
- Use `termina-ui` when a reusable component or API needs implementation.
- Use `termina-core` only when the renderer/input/terminal protocol lacks needed behavior.
- Use `termina-tui-validation` for reproducible acceptance tests across terminal sizes and input modes.
- Use `termina-genui` when the UI is generated by an external model or agent and must be validated before rendering.

## Generative UI with `@nemesis-oss/termina-genui`

Use this when a model or agent produces structured terminal UI dynamically. Read `packages/genui/source/` and `docs-site/guide/genui.md` before implementing.

### Core invariants

- The model outputs `openui-lang` text — it never executes code. GenUI is the enforced boundary.
- Only registered components render. Unknown names produce a visible error placeholder.
- Only registered actions dispatch. Unregistered names throw `ActionNotFoundError`.
- All string props are sanitized via `sanitizeText` before render (strips OSC/CSI sequences).
- Resource limits (`maxStreamLength`, `maxTreeDepth`, `maxNodeCount`, `maxTextLength`) are enforced on every parse.

### Registry inspection

Before generating a system prompt, inspect the registry:

```ts
const components = registry.getAll();
// Each entry has: name, description, schema (Zod), render
```

Use `generateGenUIPrompt(registry, { preamble })` to produce model instructions derived directly from the registry — do not hand-write component lists.

### Streaming responses

Feed incoming chunks to `createStreamCoordinator(adapter)`. Subscribe to updates and render the latest `update.tree`. Do not wait for the full response before rendering — the coordinator maintains a stable last-valid tree throughout.

```ts
const coordinator = createStreamCoordinator(adapter);
coordinator.subscribe(update => {
  // update.tree: GenUIElementNode | null (last valid tree)
  // update.status: 'streaming' | 'completed' | 'error'
});
coordinator.append(chunk); // called per chunk from your transport
coordinator.complete();    // called when the model stream ends
```

Pass `isStreaming={true}` to `<GenUIRenderer />` during active streaming so components can show in-progress states.

### Form state

Use `createGenUIRuntime(initialValues)` to seed form field values. Pass `runtime` to `<GenUIRenderer />`. The runtime is reactive — components call `ctx.runtime.setValue(name, value)` and the renderer re-renders automatically. Read final values with `runtime.getValues()`.

### Action boundaries

Register every action the UI may trigger. Provide a `zod` schema for the payload. The dispatcher validates the payload before calling the handler — validation failures throw `ActionValidationError`, not silently drop the event.

```ts
const dispatcher = createActionDispatcher([{
  name: 'deployToRegion',
  schema: z.object({ region: z.string(), env: z.string() }),
  handler: async ({ region, env }) => { /* your logic */ },
}]);
```

### Security reminder

- Never import model-generated text as code. The language adapter is the only permitted execution path.
- Do not expose `createActionDispatcher` to model-generated code. Actions must be registered by the host application at startup.
- Do not disable resource limits in production (`maxStreamLength`, `maxTreeDepth`, `maxNodeCount`, `maxTextLength`).
