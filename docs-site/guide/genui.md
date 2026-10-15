# Generative UI

`@nemesis-oss/termina-genui` is the GenUI package for Termina. It lets an external model or agent stream a declarative UI description, which Termina parses incrementally and renders as native terminal components via `@nemesis-oss/termina-core` and `@nemesis-oss/termina-ui`.

## How it works

```
External AI Model / Agent
        |
        | streamed structured output (openui-lang)
        v
@nemesis-oss/termina-genui
 ├── Language adapter & parser
 ├── Component registry & schemas
 ├── Prompt generation
 ├── Streaming coordinator
 ├── AST-to-Termina renderer
 ├── Runtime form state
 └── Registered action dispatcher
        |
        v
@nemesis-oss/termina-ui
        |
        v
@nemesis-oss/termina-core
        |
        v
    Terminal
```

The model never executes code. It produces a structured `openui-lang` program. The host application controls which components and actions are available.

## Installation

```bash
pnpm add @nemesis-oss/termina-genui
```

`zod@^4.0.0` is a peer dependency.

## Quick start

```tsx
import React from 'react';
import { render } from '@nemesis-oss/termina-core';
import {
  createDefaultRegistry,
  createLanguageAdapter,
  GenUIRenderer,
} from '@nemesis-oss/termina-genui';

const registry = createDefaultRegistry();
const adapter = createLanguageAdapter(registry);

// openui-lang output from your model
const program = `
root = Container("column", 1, "single", [title, status])
title = Text("Deployment complete", "green", true)
status = StatusMessage("All 3 pods running", "success")
`;

const { root } = adapter.parse(program);

render(<GenUIRenderer node={root} registry={registry} />);
```

## Language

GenUI uses [openui-lang](https://github.com/openuidev/openui-lang) — a declarative, positional-argument language for describing component trees.

Each statement binds a name to a component call:

```
name = ComponentName(arg1, arg2, ...)
```

The root of the rendered tree is always the statement bound to `root`. References to other statements may appear in any order (they are hoisted).

### Generating model instructions

Use `generateGenUIPrompt` to produce a system-prompt string that describes all registered components, their arguments, and the expected format:

```ts
import { generateGenUIPrompt } from '@nemesis-oss/termina-genui';

const systemPrompt = generateGenUIPrompt(registry, {
  preamble: 'You are a terminal dashboard assistant.',
});
```

The prompt is derived directly from the component registry, so it stays in sync automatically.

## Component registry

The registry controls what the model is allowed to render. Only registered components may appear in the output.

### Default components

`createDefaultRegistry()` provides a ready-to-use registry backed by actual `@nemesis-oss/termina-ui` components:

| Component | Description |
|-----------|-------------|
| `Container` | Flex layout box with optional border |
| `Text` | Styled text with color and weight |
| `Badge` | Uppercased label with accent color |
| `Alert` | Titled message with variant |
| `StatusMessage` | Status indicator with icon |
| `ProgressBar` | Percentage fill bar |
| `LoadingBar` | Animated spinner/bar |
| `CodeBlock` | Syntax-highlighted code |
| `Markdown` | Formatted markdown |
| `Table` | Rows and columns |
| `Button` | Labeled action trigger |
| `TextInput` | Form text field |
| `Select` | Form dropdown |

### Custom components

Define and register your own components:

```ts
import { z } from 'zod';
import {
  createGenUIRegistry,
  defineGenUIComponent,
} from '@nemesis-oss/termina-genui';
import { Spinner } from '@nemesis-oss/termina-ui';

const TaskCard = defineGenUIComponent({
  name: 'TaskCard',
  description: 'A task with a spinner while pending',
  schema: z.object({
    title: z.string(),
    done: z.boolean().optional(),
  }),
  render: (props) => (
    <Box gap={1}>
      {props.done ? <Text color="green">✓</Text> : <Spinner />}
      <Text>{props.title}</Text>
    </Box>
  ),
});

const registry = createGenUIRegistry([TaskCard]);
```

## Streaming

The streaming coordinator handles arbitrary chunk boundaries — chunks need not align with tokens, lines, or expressions.

```ts
import {
  createStreamCoordinator,
  GenUIRenderer,
} from '@nemesis-oss/termina-genui';

const coordinator = createStreamCoordinator(adapter);
let currentTree = null;

coordinator.subscribe((update) => {
  currentTree = update.tree; // re-render on each update
});

// Feed chunks from your model transport
for await (const chunk of modelStream) {
  coordinator.append(chunk);
}

coordinator.complete();
```

`update.tree` holds the last successfully parsed tree. Partial or invalid text is safely ignored while streaming continues.

## Runtime form state

`createGenUIRuntime` maintains form field values across re-renders and makes them available to form components:

```ts
const runtime = createGenUIRuntime({ username: 'alice' });

// Initial values are seeded; components update them via onChange
<GenUIRenderer node={root} registry={registry} runtime={runtime} />

// Read current values in your application
const values = runtime.getValues(); // { username: 'alice', ... }
```

## Action dispatcher

Registered actions are the only way a model-generated UI can trigger application logic. Unregistered action names are rejected before dispatch.

```ts
import { z } from 'zod';
import { createActionDispatcher } from '@nemesis-oss/termina-genui';

const dispatcher = createActionDispatcher([
  {
    name: 'submitDeployment',
    schema: z.object({ env: z.string(), region: z.string() }),
    handler: async ({ env, region }) => {
      await deployTo(env, region);
    },
  },
]);

<GenUIRenderer
  node={root}
  registry={registry}
  runtime={runtime}
  actionDispatcher={dispatcher}
/>
```

A `Button` in the model output with `action="submitDeployment"` will invoke this handler — and only this handler. The model cannot call anything not in the dispatcher.

## Security model

- **No code execution.** The model outputs a declarative program; GenUI never evaluates arbitrary JavaScript, JSX, shell commands, or expressions.
- **Allowlist only.** Unknown components are rendered as error placeholders. Unknown action names throw `ActionNotFoundError`.
- **Input sanitization.** All string values pass through `sanitizeText`, which strips OSC sequences (hyperlink spoofing, clipboard access, title manipulation) and CSI sequences before rendering.
- **Resource bounds.** The adapter enforces configurable limits: `maxStreamLength` (100 KB), `maxTreeDepth` (20), `maxNodeCount` (1000), `maxTextLength` (10 KB). Exceed any limit and parsing fails with a `resource-limit` error instead of crashing.

## Dependency rules

| Package | May depend on GenUI? |
|---------|----------------------|
| `termina-core` | No |
| `termina-ui` | No |
| `termina-genui` | Yes — depends on both |
| Your application | Yes |

`termina-core` and `termina-ui` remain fully usable without GenUI. GenUI does not pull in any model-provider SDK — the host application supplies the stream.

## Playground example

An interactive playground lives in [`examples/genui-playground`](https://github.com/shubhamtaywade82/termina/tree/main/examples/genui-playground). It demonstrates a dashboard, a live form with runtime state, and a live-streaming scenario where tokens arrive chunk by chunk.

```bash
pnpm --filter termina-example-genui-playground start
```
