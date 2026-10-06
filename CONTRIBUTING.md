# CONTRIBUTING

Contributions are always welcome, no matter how large or small. Before contributing, please read the
[code of conduct](CODE_OF_CONDUCT.md).

This repository is a pnpm workspace. The published `decap-cms` fork of Decap CMS lives in
`packages/decap-cms/`, where the former monorepo packages live under `src/`; see the root
[README.md](README.md#repository-layout) for the current list of workspace packages under
`packages/`. The root only carries repo-wide tooling and delegates every script into the packages,
so all commands below run from the repo root. Background on the restructure and the workspace layout
is in [restructure.md](docs/contributing/decisions/restructure.md).

## Setup

> Install [Node.js](https://nodejs.org/) 24 or later. The repo uses pnpm 9 (see `packageManager` in
> `package.json`; `corepack enable` sets it up).

```sh
git clone https://github.com/decaporg/decap-cms
cd decap-cms
pnpm install
```

## Available scripts

| Command                                      | What it does                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                             | TypeScript check across decap-cms's src, playwright, storybook, and node configs (4 `tsc` invocations)            |
| `pnpm lint` / `pnpm format`                  | ESLint / dprint                                                                                                   |
| `pnpm test`                                  | Vitest, single run (`pnpm test:watch` for watch mode)                                                             |
| `pnpm test:ci`                               | build + lint + typecheck + unit tests per package, plus root doc-consistency checks; run this before opening a PR |
| `pnpm test:e2e`                              | Playwright end-to-end tests (builds and serves the demo itself)                                                   |
| `pnpm build`                                 | Compiles the publishable package to `packages/decap-cms/dist/`                                                    |
| `pnpm build:dev-test && pnpm serve:dev-test` | Demo app on http://localhost:5174                                                                                 |

The demo app uses the in-memory `test-repo` backend with fixtures from
`packages/decap-cms/dev-test/repo-fixtures.js` and the config in
`packages/decap-cms/dev-test/config.yml`, so you can exercise most of the CMS without any Git
provider.

`build:dev-test` builds every `dev-test/dist/*.js` bundle the served pages load (`decap-cms.js`,
`pnpm build:demo` builds the classic bundle used by the demo pages.

To run a single test file, pass a path filter to Vitest (from `packages/decap-cms/`):

```sh
cd packages/decap-cms
pnpm test src/core/lib/__tests__/registry.spec.ts
pnpm test -- -t "name pattern"
```

## Pull requests

1. Fork the repo and create a branch from `main`, the active development trunk.
2. If you have added code that should be tested, add tests. Tests are colocated in `__tests__/`
   directories as `*.spec.tsx` / `*.test.ts`.
3. Follow [Conventional Commits](https://www.conventionalcommits.org/); commitlint enforces this
   shape on the `commit-msg` hook (see `.husky/commit-msg` and `commitlint.config.cjs`) — a
   `type: subject` or `type(scope): subject` header, an allowed `type` (`feat`, `fix`, `docs`,
   `chore`, `refactor`, `test`, `perf`, ...), and a handful of casing/length rules from
   [`@commitlint/config-conventional`](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional),
   which is the only thing `commitlint.config.cjs` extends. Maintainers additionally expect an
   area-slug scope (`core`, `app`, `widget-richtext`, ...) and a `(DCMS-nnn)` ticket suffix in code
   review, but **neither is mechanically enforced by commitlint** (no `scope-enum` rule, no
   ticket-suffix rule) — treat them as house style flagged by reviewers, not a hard commit-msg gate.
4. If your change should ship in the next release, run `pnpm changeset` (a.k.a.
   `pnpm changeset add`) from the repo root and follow the prompts to add a changeset entry
   describing the change. This is what the release tooling reads to bump versions and generate the
   package changelog — see [Releasing](#releasing).
5. Run `pnpm test:ci` and make sure it passes.
6. A maintainer reviews and merges; PRs should be rebased on `main` before merge.

## Debugging against a real backend

`packages/decap-cms/dev-test/config.yml` drives the demo. To test a real Git backend, point the
`backend` section at your provider and repository:

```yaml
backend:
  name: github
  repo: owner-name/repo-name
```

Then rebuild the demo (`pnpm build:demo`) and reload http://localhost:5174.

## Releasing

Releases are managed by [changesets](https://github.com/changesets/changesets) via the root
`package.json` scripts, not a manual version bump:

1. Every PR that should ship in the next release adds a changeset entry with `pnpm changeset` (see
   [Pull requests](#pull-requests) above); this is stored as a markdown file under `.changeset/` and
   describes the bump type (patch/minor/major) and a changelog blurb.
2. When it's time to release, a maintainer runs `pnpm version-packages` from the repo root (root
   `package.json`'s `version-packages` script, currently `changeset version`) to consume the pending
   `.changeset/*.md` files, bump `packages/decap-cms/package.json`'s `version`, and write the
   package changelog (changesets creates it on the first release) — then commits the result.
3. Run `pnpm test:ci` and make sure it passes.
4. A maintainer runs `pnpm release` from the repo root (root `package.json`'s `release` script,
   currently `node scripts/assert-release-branch.mjs && changeset publish`) to publish to npm.
   `scripts/assert-release-branch.mjs` guards this so it only runs from `main`;
   `changeset
   publish` also tags the published version and reads the changelog straight from the
   changeset entries consumed in step 2, so there's no hand-written GitHub release notes step.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT license](LICENSE).
