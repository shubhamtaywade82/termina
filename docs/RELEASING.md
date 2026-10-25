# Releasing

This repository publishes three packages to npm: `@nemesis-oss/termina-core`, `@nemesis-oss/termina-ui` and `@nemesis-oss/termina-genui`. They are versioned together. A release is one commit that bumps all three, one tag, and one run of the publish workflow.

## Versioning policy

- Semantic Versioning. While the major version is `0`, a minor bump (`0.2.0` to `0.3.0`) may remove or change public API. Say so in the changelog.
- A patch bump (`0.2.0` to `0.2.1`) fixes behavior without changing the public API.
- Prerelease tags such as `v0.3.0-beta.1` go to the `next` dist-tag, so `latest` moves only on stable releases.
- The three packages always share one version. `scripts/check-release.mjs` fails the publish if they differ, or if any package is marked `private`.

## What CI already checks

Every pull request and every push to `main` runs these, and each must pass before a release:

| Check | Command |
| --- | --- |
| Typecheck, including `examples/*` | `pnpm typecheck` |
| Unit and pseudo-terminal tests | `pnpm test` |
| Docs names and links match the built packages | `pnpm docs:check` |
| Publish and pack rehearsal | `pnpm release:rehearse` |

`pnpm release:rehearse` runs `pnpm publish --dry-run` for each package, packs it, and checks each tarball. The tarball must contain `build/index.js` and `build/index.d.ts`, must not ship anything outside `build/`, the manifest, and the README and license files, and must not keep a `workspace:` range in its dependencies. The dry run passes `--force`, because the version on the branch is usually already on npm and pnpm would otherwise skip it. The dry run never uploads.

## Cutting a release

1. Confirm `main` is green in CI.
2. Move the `[Unreleased]` entries in `CHANGELOG.md` under a new version heading with today's date. Keep the Keep a Changelog categories.
3. Bump the version in `packages/core/package.json`, `packages/ui/package.json` and `packages/genui/package.json` to the same value. Dependencies between the packages use `workspace:` ranges, which pnpm rewrites at pack time, so they need no edit.
4. Run `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm release:rehearse` locally. The rehearse step must pass before you tag.
5. Commit with a `chore(release):` subject, for example `chore(release): bump all packages to 0.3.0`.
6. Tag the commit `v0.3.0` and push the tag. The publish workflow runs `scripts/check-release.mjs` on the tag, builds, runs typecheck and tests, and publishes all three packages with provenance.
7. Check the npm pages for all three packages, then install them in a clean directory and import each entry.

## If a release goes wrong

- A publish workflow that fails before its publish step has uploaded nothing. Fix the cause on the branch, then re-run the workflow for the same tag. Move the tag only if the fix needs a new commit: delete it with `git push origin :refs/tags/v0.3.0`, retag, and push again.
- If one package published and another failed, do not republish the same version. Publish the missing package by hand at the same version only if its content is identical to what was tagged. Otherwise bump all three to a patch version.
- npm does not allow a version to be reused, even after unpublishing. Mark a bad version with `npm deprecate <package>@<version> "<reason>"` and release a fixed patch version.
