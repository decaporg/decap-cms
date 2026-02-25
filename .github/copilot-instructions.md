# Copilot Instructions for Decap CMS Monorepo

Use this guide to be productive quickly. Keep changes minimal and scoped to the relevant package.

## Overview
- Monorepo under `packages/*` (core, app, backends, widgets, UI), orchestrated by Nx + Lerna; bundles via webpack in each package.
- Core domain lives in `packages/decap-cms-core` (collections, entries, formats, i18n, search, backend abstraction).
- The `Backend` class (`packages/decap-cms-core/src/backend.ts`) orchestrates entry CRUD, i18n grouping, media, search, and editorial workflow across provider backends.
- App bundle is `packages/decap-cms` (UMD browser build) used by the demo under `dev-test/`.

## Build, Run, Test
- Dev watch all packages: `npm run develop` (Nx run-many; excludes `decap-server`).
- Build all: `npm run build` (ESM then package builds); preview: `npm run build-preview`.
- Unit tests: `npm run test:unit` (Jest, jsdom). Full CI set: `npm run test:ci`.
- E2E (Cypress): headless `npm run test:e2e`; interactive `npm run test:e2e:dev`.
- Demo site for manual testing: `npm run test:e2e:serve` then open `http://localhost:8080` (serves `dev-test/`).
- Lint/format: `npm run lint`, `npm run format`. Type-check: `npm run type-check`.

## Core Hotspots (start here)
- Entry lifecycle: `decap-cms-core/src/backend.ts` – `processEntries`, `listEntries`, `listAllEntries`, `entryWithFormat`, `entryToRaw`, i18n helpers usage.
- Collection rules: `decap-cms-core/src/reducers/collections.*` – selectors like `selectEntryPath`, `selectFolderEntryExtension`, nested/index behavior.
- Formats: `decap-cms-core/src/formats/` – frontmatter/Markdown/YAML parsing/serialization.
- i18n: `decap-cms-core/src/lib/i18n.*` – `hasI18n`, `groupEntries`, `getI18nFilesDepth`, `I18N_STRUCTURE`.
- Registry: `decap-cms-core/src/lib/registry.*` – registers backends, widgets, media libraries.
- Build config: `scripts/webpack.js` – outputs (UMD/CJS), externals from `peerDependencies`, source maps.

## Patterns & Conventions
- Immutable data: reducers/selectors use Immutable.js `Map/List`. Use selectors from `core/src/reducers/**` instead of direct shape access.
- Format I/O: always use `resolveFormat`, `entryWithFormat`, and `entryToRaw` for parsing/serialization. Don’t hand-roll frontmatter.
- i18n awareness: when listing/persisting, account for i18n files/folders via helpers (see `lib/i18n`).
- Backends contract: implementations in `packages/decap-cms-backend-*` must support methods used by `Backend` (e.g., `entriesByFolder|Files`, `getEntry`, `persistEntry`, `getMedia`, optional `allEntriesByFolder`, `getDeployPreview`, editorial workflow methods). Confirm call sites in `core/src/backend.ts`.
- Bundling: keep runtime deps vs `peerDependencies` correct; peers are externalized in UMD builds by `scripts/webpack.js`.

## Integration Points
- Local git proxy for dev: `packages/decap-server` (`npx decap-server` in a site repo, then set `backend: name: proxy`).
- Cypress fixtures recording: see `cypress/Readme.md` and `mock:server:*` scripts; requires `.env` with provider tokens.

## Practical Tips for Agents
- Scope changes to a single package unless a cross-package change is intentional.
- Preserve function signatures and Immutable types; convert to plain objects only where expected.
- If changing serialization or path/slug logic, update both read and write paths and run E2E.
- Feature-gate new backend capabilities and extend the interface used by `Backend` before implementing providers.
