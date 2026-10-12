# termina

A fork of [Ink 8](https://github.com/vadimdemedes/ink) (React for terminal UIs) and
[@inkjs/ui 2](https://github.com/vadimdemedes/ink-ui), with engine fixes and new
components.

- `packages/core` (`@nemesis-oss/termina-core`): the engine. Upstream Ink plus reflow-aware resize
  erase, mouse tracking, OSC 8 hyperlinks, OSC 52 clipboard, and a capability probe.
- `packages/ui` (`@nemesis-oss/termina-ui`): the component kit. Upstream ink-ui plus grapheme-correct
  text editing, `ScrollBox`, and `LogStream`.
- `examples/turnstream`: a three-column agentic-loop dashboard built on both packages.

Provenance and every local change: [`FORK.md`](FORK.md). The verified architecture
of upstream and the measurements behind the design: [`docs/research/ink-architecture.md`](docs/research/ink-architecture.md).

## Requirements

Node 22 or newer, pnpm 10.

## Commands

```sh
pnpm install
pnpm build              # builds @nemesis-oss/termina-core, then @nemesis-oss/termina-ui
pnpm --filter @nemesis-oss/termina-core test
pnpm --filter @nemesis-oss/termina-ui test
pnpm --filter termina-example-turnstream start   # press / to edit the prompt, q to quit
```
