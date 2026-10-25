# termina

A fork of [Ink 8](https://github.com/vadimdemedes/ink) (React for terminal UIs) and
[@inkjs/ui 2](https://github.com/vadimdemedes/ink-ui), with engine fixes and new
components.

- `packages/core` (`@nemesis-oss/termina-core`): the engine. Upstream Ink plus reflow-aware resize
  erase, mouse tracking, OSC 8 hyperlinks, OSC 52 clipboard, and a capability probe.
- `packages/ui` (`@nemesis-oss/termina-ui`): the component kit. Upstream ink-ui plus 22 new
  components, grapheme-correct text editing, `ScrollBox`, and `LogStream`.
- `packages/genui` (`@nemesis-oss/termina-genui`): generative UI for agents. An external model
  streams a declarative UI description that is parsed incrementally and rendered as native
  terminal components.
- `examples/turnstream`: a three-column agentic-loop dashboard built on both packages.
- `examples/starter`: a small app built on both packages. Copy it to start a new app.

Provenance and every local change: [`FORK.md`](FORK.md). The verified architecture
of upstream and the measurements behind the design: [`docs/research/ink-architecture.md`](docs/research/ink-architecture.md).

## Install

```sh
npm install @nemesis-oss/termina-core @nemesis-oss/termina-ui react
```

Node 22 or newer and React 19.3 or newer. For agent-driven generative UI,
`npm install @nemesis-oss/termina-genui`. Documentation with live previews:
https://shubhamtaywade82.github.io/termina/

## Develop

Node 22 or newer, pnpm 10.

## Commands

```sh
pnpm install
pnpm build              # builds @nemesis-oss/termina-core, then @nemesis-oss/termina-ui
pnpm --filter @nemesis-oss/termina-core test
pnpm --filter @nemesis-oss/termina-ui test
pnpm --filter termina-example-turnstream start   # press / to edit the prompt, q to quit
```

## CI and release

Workflows live in `.github/workflows/`. The Node version comes from `.node-version`, and pnpm comes from the `packageManager` field.

| Workflow | Runs on | Gates |
| --- | --- | --- |
| `ci.yml` | pushes to `main`, pull requests | typecheck and build; `pnpm test` (both suites with the pseudo-terminal and emulator fixtures); docs site build and a check that `previews.json` is current; production dependency audit at high severity; CodeQL; dependency review on pull requests |
| `docs.yml` | pushes to `main` that touch `docs-site/` | builds and deploys the docs site to GitHub Pages |
| `publish.yml` | semver tags `v*` | the release gate `scripts/check-release.mjs` (public packages, versions equal the tag), then typecheck, test, and `pnpm publish` |

The same gates run locally with `pnpm ci`, which stops at the first failure.

Not gated yet:

- **Lint.** `pnpm --filter @nemesis-oss/termina-core run lint` (`xo`) reports about a thousand problems on the current tree, mostly formatting and unsafe-call typing. Gating on it would fail every pull request. It should become a gate once that backlog is cleared.
- **Coverage thresholds.** The suites run on `node:test`, which supports `--test-coverage-*` thresholds. Nothing enforces them yet.
- **Full audit.** The high advisory in `xo`'s devDependencies (`braces`, GHSA-vfj7-8cjw-p6xm) has no patched version. The gate covers production dependencies only.
