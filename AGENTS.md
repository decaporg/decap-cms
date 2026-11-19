# AGENTS.md

Guidance for AI coding agents working in this repository. [CONTRIBUTING.md](CONTRIBUTING.md) is the full contributor guide; this file is the short version and links there for details.

## What lives here

This is the monorepo for the Decap CMS npm packages. User documentation does not live here: it is in the separate [decaporg/decap-website](https://github.com/decaporg/decap-website) repository, served at https://decapcms.org/docs/, with machine-readable versions at https://decapcms.org/llms.txt and https://decapcms.org/llms-full.txt. Changes to user docs go to that repository.

## Layout

- `packages/*` — the pnpm workspace. Every package is published to npm with its own version.
  - `decap-cms-core` — the CMS application: config, Redux store, editor UI and the extension registry.
  - `decap-cms-app` — core plus the bundled backends and widgets, with React 19 as a peer dependency. For projects that install from npm and use a bundler.
  - `decap-cms` — `decap-cms-app` plus React and the media libraries, built as one self-initializing browser bundle that sets `window.CMS`. This is what the script-tag install loads from a CDN.
  - `decap-cms-backend-*`, `decap-cms-widget-*`, `decap-cms-media-library-*`, `decap-cms-lib-*`, `decap-cms-ui-*`, `decap-cms-locales`, `decap-cms-editor-component-image` — the parts `decap-cms-app` is assembled from.
  - `decap` (`@decap/cli`), `decap-server` and `decap-turbo-api` — the CLI, the local proxy server and the Decap Turbo API contract.
- `dev-test/` — the demo site the dev server and e2e tests run against: `config.yml` (test-repo backend), `index.html`, and per-backend configs in `dev-test/backends/`.
- `cypress/` — the Cypress e2e suite (`cypress/e2e`), fixtures and the mock server.
- `scripts/` — shared webpack config and externals, and the publish, package-integrity and verification scripts.
- Unit tests sit next to the code in `__tests__/` directories and run with Jest.

## Commands

Use pnpm (the version is pinned in the root `package.json` `packageManager` field), never npm or yarn. Node is the current LTS (`.nvmrc`).

| Task                    | Command                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Install                 | `pnpm install` (CI uses `pnpm install --frozen-lockfile`)                                                              |
| Dev server              | `pnpm start`, then open http://localhost:8080 (serves `dev-test/`; set `DECAP_CMS_DEV_SERVER_PORT` to change the port) |
| Build all packages      | `pnpm run build` (Babel ESM, then webpack bundles, through nx)                                                         |
| Type-check              | `pnpm run type-check`                                                                                                  |
| Unit tests              | `pnpm run test:unit`, or one file or pattern with `pnpm exec jest <path-or-pattern>`                                   |
| Lint                    | `pnpm run lint` (ESLint, Stylelint, and Prettier in check mode)                                                        |
| Format                  | `pnpm run format`                                                                                                      |
| What CI runs on each PR | `pnpm run test:ci` (quiet lint, type-check, Cypress runner self-test, unit tests), plus the e2e jobs                   |
| E2E                     | `pnpm run test:e2e` (builds the demo site, then runs Cypress; slow)                                                    |

Lint and format cover JS, TS and CSS under `packages/` and `scripts/` only; Markdown and JSON are not checked. Prettier settings are in `.prettierrc` (single quotes, trailing commas, 100 columns).

## Commits and pull requests

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint (`@commitlint/config-conventional`) in a husky `commit-msg` hook. Examples from the history: `fix(core): ...`, `fix(widget-list): ...`, `feat(core): ...`, `chore(deps): ...`, `docs: ...`. The scope is usually the package name without the `decap-cms-` prefix.
- The type is not cosmetic: Lerna reads it to choose each package's version bump and to write the changelogs.
- Branch from `main` and open pull requests against `main`. See [CONTRIBUTING.md](CONTRIBUTING.md#pull-requests).

## Dependencies: the pnpm catalog

Third-party dependency versions are defined once, in the `catalog:` section of `pnpm-workspace.yaml`. Package manifests reference them as `"catalog:"`, and packages in this repo reference each other as `"workspace:*"`.

- To add or upgrade a dependency, set its range in `pnpm-workspace.yaml`, reference it as `"catalog:"` in the package's `package.json`, run `pnpm install`, and commit the updated `pnpm-lock.yaml`.
- Never hand-pin a version in a `package.json` for a dependency the catalog owns, and never replace `catalog:` or `workspace:*` with a literal version.
- Security pins for transitive dependencies go in the `overrides:` section of `pnpm-workspace.yaml`.

## Releases

Releases are done by maintainers. Do not bump versions, edit `CHANGELOG.md` files, create release tags or publish unless you are explicitly asked to.

- Never run `lerna publish` in any form, and never `npm publish`. Neither replaces `catalog:` and `workspace:` specifiers, so they upload manifests that npm, yarn and bun users cannot install ([#7979](https://github.com/decaporg/decap-cms/issues/7979)).
- The process: `pnpm exec lerna version` bumps the changed packages from the conventional commits, writes changelogs, and creates the `chore(release): publish` commit and tags. A maintainer then runs the **Publish Packages** workflow (`.github/workflows/publish.yml`) on that commit. It builds and tests, publishes with pnpm through `scripts/publish-packages.mjs` using npm trusted publishing (OIDC) with provenance, and verifies the published manifests.

The full procedure, including prereleases and emergency manual publishing, is in [CONTRIBUTING.md](CONTRIBUTING.md#releasing).
