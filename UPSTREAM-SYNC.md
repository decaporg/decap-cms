# Upstream sync ledger

Porting decaporg/decap-cms `main` into this branch. Fork point `6ef2f9bdf` (2026-04-22), cut-off `1d5868347` (2026-09-22). One row per upstream commit, oldest first. Each port is its own commit with a `Ported-from: decaporg/decap-cms@<sha> (#PR)` trailer.

Statuses: `todo` · `done` · `ported-by-laika` (already on v4-beta before this sync) · `verify` (probably nothing to port; confirm) · `dep-check` (confirm v4's version is at least this new) · `n/a` (doesn't apply to v4) · `skip` (decided against) · `ask` (needs a decision).

## Decisions (2026-10-06)

- Generic preview fallback: restored.
- Built-in Image editor component: restored.
- README: Decap Turbo, sponsors and expert services sections added.
- Notes pane: yes. Markdown inline editor components (#7958): no.

## Needs a real-backend check

- `1f6f71c23`: Bitbucket token refresh through Netlify auth.
- `cec9441e1`: GitLab PKCE refresh on an expired token: REST verified 2026-10-07 (401 → `oauth/token` → retry, new token stored); GraphQL still open (the tester doesn't set `use_graphql`).
- `a82d93578`: git-gateway PKCE session survives a reload.
- `59843046c`: Forgejo editorial workflow PR matching.
- ~~`03d6446d5`/`f269a8a4f`: notes~~ verified 2026-10-07 on GitLab and GitHub: read, add, edit, resolve, delete, a second quick note reuses the thread, others' notes read-only, polling picks up comments posted and edited on the host within one 15s cycle (so a comment edit does change GitHub's issue ETag), publish closes the thread with `entry-published` (GitHub creates the missing label), unpublish reopens it and drops the label, deleting a draft closes it with `entry-deleted`.

## v4 issues found along the way

- Fixed: choosing media in the library didn't fill file/image fields until something else re-rendered them (`52771896e`).
- Fixed: the shared combobox showed a blank band above every option list (with #7968).
- Fixed: deleting or unpublishing an i18n entry (multiple_files/multiple_folders) named every locale's file, and GitLab rejects a commit deleting a missing one, so an entry with an unfilled locale could not be deleted or unpublished (`72c5ad8f7`). Upstream main has the same bug.
- Fixed: a note just added on GitLab showed a placeholder instead of the editor's avatar (`d281a807a`).
- Fixed: the editor's floating view controls covered the notes pane's timestamps (`34efd1df9`); upstream has the same overlap.
- Fixed: every GitHub OAuth login failed with "Cannot read properties of undefined (reading 'token')": the auth page called `onLogin()` without the Netlify result (`33f23d719`). Regression from the v4 rewrite; PAT login was unaffected.
- Open (needs a decision): unpublish deletes the published files before it creates the draft, as upstream does. When creating the draft fails (on GitLab: a leftover `cms/<collection>/<slug>` branch with no open MR), the published entry is gone and no draft exists. Proposed: create the draft first, delete second.
- Open: while an existing entry loads, the editor briefly shows "Untitled", "Delete unpublished entry" and an empty notes pane before the entry arrives (GitLab tester).
- Open: opening an existing entry can show "UNSAVED CHANGES" straight away. The richtext widget re-serializes its markdown on mount, and a list nested in an object writes an empty richtext value to the wrong path before correcting it (Kitchen Sink entry). Same on untouched v4-beta.

## Ledger

| Upstream | Date | PR | Title | Status | v4 commit | Notes |
|---|---|---|---|---|---|---|
| `9db5e1ed2` | 2026-05-05 | [#7803](https://github.com/decaporg/decap-cms/pull/7803) | fix(richtext): invalid imports, rich text widget types, improve paste handling (#7803) | ported-by-laika | ec72c45ec | came with the Plate richtext port (richtext@3.5.0) |
| `8b29297cd` | 2026-05-08 | [#7804](https://github.com/decaporg/decap-cms/pull/7804) | chore(deps-dev): bump axios from 1.15.0 to 1.16.0 (#7804) | n/a |  | v4 has it at least this new, or no longer uses it |
| `0a35acbe3` | 2026-05-08 | [#7805](https://github.com/decaporg/decap-cms/pull/7805) | chore(deps-dev): bump postcss from 8.5.6 to 8.5.14 (#7805) | done | 3c6db437c | lockfile refreshed past it |
| `517f13a86` | 2026-05-08 | [#7807](https://github.com/decaporg/decap-cms/pull/7807) | chore(deps): bump simple-git from 3.32.3 to 3.36.0 (#7807) | n/a |  | v4 has it at least this new, or no longer uses it |
| `3802f823e` | 2026-05-11 | [#7808](https://github.com/decaporg/decap-cms/pull/7808) | chore(deps): bump fast-uri from 3.1.0 to 3.1.2 (#7808) | done | 3c6db437c | lockfile refreshed past it |
| `d4d4cd4bb` | 2026-05-11 | [#7809](https://github.com/decaporg/decap-cms/pull/7809) | chore(deps-dev): bump @babel/plugin-transform-modules-systemjs (#7809) | n/a |  | v4 has it at least this new, or no longer uses it |
| `f8de615a5` | 2026-05-14 | [#7806](https://github.com/decaporg/decap-cms/pull/7806) | fix(#7794): populate relation widget from url (#7806) | ported-by-laika | bcdcb27f3 |  |
| `ecdcf9853` | 2026-05-14 | [#7791](https://github.com/decaporg/decap-cms/pull/7791) | Sanitize HTML links and images, enhance proxy URL validation (#7791) | ported-by-laika | 6f2f3cea5 |  |
| `17fb6306d` | 2026-05-14 | [#7436](https://github.com/decaporg/decap-cms/pull/7436) | feat: include slug and path in result (#7436) | ported-by-laika | 1e93fdb90 |  |
| `25db74b71` | 2026-05-15 | [#6690](https://github.com/decaporg/decap-cms/pull/6690) | feat(slugs): allow filters in template strings (#6690) | ported-by-laika | 59eaa6491 | cited as DCMS-1047, not the PR number |
| `5be1d7aac` | 2026-05-15 | [#7416](https://github.com/decaporg/decap-cms/pull/7416) | Fix(#7414): Fix React's bad setState() call warnings (#7416) | ported-by-laika | d6cc3e8bd |  |
| `78fb8af5d` | 2026-05-15 | [#7681](https://github.com/decaporg/decap-cms/pull/7681) | Fix bugs in nested collection (#7681) | ported-by-laika | 182c6b9e3 |  |
| `90f3a84e7` | 2026-05-15 |  | Add Decap Turbo to readme | done | 98577bbb8 | decision 2026-10-06; also ports the sponsors and expert services sections |
| `2fdf79841` | 2026-05-27 | [#7828](https://github.com/decaporg/decap-cms/pull/7828) | feat(ui): make dropdown positioning responsive (#7828) | n/a |  | Base UI menus keep themselves in the viewport (checked at 360px) |
| `64118e404` | 2026-05-27 | [#7825](https://github.com/decaporg/decap-cms/pull/7825) | feat(ui): make app header responsive (#7825) | ported-by-laika | 34698c68b |  |
| `ae01ad6f2` | 2026-06-01 |  | chore(release): publish | n/a |  | release commit |
| `b1073db51` | 2026-06-01 | [#7837](https://github.com/decaporg/decap-cms/pull/7837) | chore(deps): bump protocol-buffers-schema from 3.6.0 to 3.6.1 (#7837) | n/a |  | v4 has it at least this new, or no longer uses it |
| `e324a142f` | 2026-06-01 | [#7833](https://github.com/decaporg/decap-cms/pull/7833) | fix: remove unused dependencies and specify missing dependencies (#7833) | n/a |  | per-package dependency hygiene for the old monorepo |
| `e5e75cf70` | 2026-06-01 | [#7839](https://github.com/decaporg/decap-cms/pull/7839) | chore(deps): bump follow-redirects and mockserver-node (#7839) | n/a |  | v4 has it at least this new, or no longer uses it |
| `0a5e6f933` | 2026-06-01 | [#7829](https://github.com/decaporg/decap-cms/pull/7829) | feat: Croatian and serbian locale (#7829) | ported-by-laika | 1b88cfceb |  |
| `4197aaf9c` | 2026-06-01 | [#7819](https://github.com/decaporg/decap-cms/pull/7819) | chore(deps-dev): bump webpack-dev-server from 5.2.2 to 5.2.4 (#7819) | n/a |  | v4 has it at least this new, or no longer uses it |
| `c76586b15` | 2026-06-01 | [#7815](https://github.com/decaporg/decap-cms/pull/7815) | fix(gitlab): load lfs media content (#7815) | ported-by-laika | 29c8824c6 |  |
| `f8c947c90` | 2026-06-01 | [#7817](https://github.com/decaporg/decap-cms/pull/7817) | fix(richtext): create break nodes on shift + enter (#7817) | ported-by-laika | ec72c45ec | came with the Plate richtext port (richtext@3.5.0) |
| `344c65449` | 2026-06-02 | [#6794](https://github.com/decaporg/decap-cms/pull/6794) | pattern can be RegExp (#6794) | ported-by-laika | 36b7942d4 |  |
| `3c3fd819f` | 2026-06-01 | [#7820](https://github.com/decaporg/decap-cms/pull/7820) | feat(ui): make media library responsive (#7820) | ported-by-laika | 32a9e830a |  |
| `11f35405c` | 2026-06-01 | [#7827](https://github.com/decaporg/decap-cms/pull/7827) | feat(ui): make collections and workflow views responsive (#7827) | ported-by-laika | 2000e45f9 |  |
| `543af4f96` | 2026-06-08 | [#7846](https://github.com/decaporg/decap-cms/pull/7846) | refactor: use web standard `crypto.randomUUID()` instead of `uuid` package (#7846) | ported-by-laika | d11825b7a |  |
| `1c2cb42f2` | 2026-06-08 | [#7849](https://github.com/decaporg/decap-cms/pull/7849) | chore(deps): bump lodash from 4.17.23 to 4.18.1 (#7849) | n/a |  | v4 has it at least this new, or no longer uses it |
| `567a80101` | 2026-06-08 |  | chore(release): publish | n/a |  | release commit |
| `eaace6427` | 2026-06-09 | [#7844](https://github.com/decaporg/decap-cms/pull/7844) | feat(locales): add Slovak locale support (#7844) | ported-by-laika | c82687e5b |  |
| `ab397b96f` | 2026-06-11 | [#7853](https://github.com/decaporg/decap-cms/pull/7853) | chore(deps): bump shell-quote from 1.8.3 to 1.8.4 (#7853) | n/a |  | v4 has it at least this new, or no longer uses it |
| `d7bef8984` | 2026-06-12 | [#7855](https://github.com/decaporg/decap-cms/pull/7855) | fix(gitlab): use Bearer auth scheme for GraphQL requests (#7855) | ported-by-laika | 41939a814 |  |
| `0e82bc5fb` | 2026-06-12 | [#7842](https://github.com/decaporg/decap-cms/pull/7842) | feat(locales): unify "New entry" button label to "＋ %{collectionLabel}" across all locales (#7842) | ported-by-laika | e4d25f7ad |  |
| `18be93a85` | 2026-06-12 | [#7854](https://github.com/decaporg/decap-cms/pull/7854) | fix(gitlab): refresh expired PKCE access tokens (#7854) | ported-by-laika | fefd7959e |  |
| `8d83ac219` | 2026-06-12 | [#7856](https://github.com/decaporg/decap-cms/pull/7856) | chore: cleanup some old unused code (#7856) | n/a |  | none of the removed code or dependencies exist on v4 |
| `505b6a428` | 2026-06-15 |  | chore(release): publish | n/a |  | release commit |
| `03d6446d5` | 2026-06-17 | [#7563](https://github.com/decaporg/decap-cms/pull/7563) | Feature: Collaborative Notes Pane for the Editor screen (#7563) | done | 5941e825b, d6d6aa9c8, 98f0c1e36, 02b4980a3, ba7b02c99 | core, UI and test backend; GitLab and GitHub keep notes on a companion issue per entry; proxy backend left out (its server never had notes) |
| `333506d64` | 2026-06-17 | [#7859](https://github.com/decaporg/decap-cms/pull/7859) | chore(deps): bump dompurify from 3.4.0 to 3.4.10 (#7859) | n/a |  | v4 has it at least this new, or no longer uses it |
| `ca3585e68` | 2026-06-17 | [#7860](https://github.com/decaporg/decap-cms/pull/7860) | chore(deps-dev): bump @babel/core from 7.28.5 to 7.29.6 (#7860) | n/a |  | v4 has it at least this new, or no longer uses it |
| `5e38528d0` | 2026-06-17 | [#7862](https://github.com/decaporg/decap-cms/pull/7862) | chore(deps-dev): bump launch-editor from 2.12.0 to 2.14.1 (#7862) | n/a |  | v4 has it at least this new, or no longer uses it |
| `77d4e0abb` | 2026-06-22 | [#7863](https://github.com/decaporg/decap-cms/pull/7863) | chore(deps): bump dompurify from 3.4.10 to 3.4.11 (#7863) | n/a |  | v4 has it at least this new, or no longer uses it |
| `641e2488f` | 2026-06-22 | [#7864](https://github.com/decaporg/decap-cms/pull/7864) | chore(deps-dev): bump webpack-dev-server from 5.2.4 to 5.2.5 (#7864) | n/a |  | v4 has it at least this new, or no longer uses it |
| `9cd663916` | 2026-06-22 | [#7861](https://github.com/decaporg/decap-cms/pull/7861) | chore(deps): bump esbuild and @storybook/react (#7861) | n/a |  | v4 has it at least this new, or no longer uses it |
| `2f5c54d96` | 2026-06-23 | [#7624](https://github.com/decaporg/decap-cms/pull/7624) | fix: add separator and sorting for unpublished entries (#7624) | ported-by-laika | 4c4a9e3c8 |  |
| `128207a46` | 2026-07-13 | [#7879](https://github.com/decaporg/decap-cms/pull/7879) | chore(deps): bump morgan from 1.10.1 to 1.11.0 (#7879) | n/a |  | v4 has it at least this new, or no longer uses it |
| `78c079313` | 2026-07-13 | [#6675](https://github.com/decaporg/decap-cms/pull/6675) | feat: add uuid widget (#6675) | ported-by-laika | 6ffdf364b |  |
| `f57084c43` | 2026-07-13 | [#7880](https://github.com/decaporg/decap-cms/pull/7880) | chore(deps-dev): bump http-proxy-middleware from 2.0.9 to 2.0.10 (#7880) | n/a |  | v4 has it at least this new, or no longer uses it |
| `f4f2a6ced` | 2026-07-14 | [#7881](https://github.com/decaporg/decap-cms/pull/7881) | chore(deps): bump sigstore and lerna (#7881) | n/a |  | v4 has it at least this new, or no longer uses it |
| `1b52b90d3` | 2026-07-14 | [#7726](https://github.com/decaporg/decap-cms/pull/7726) | Forgejo/Codeberg backend with editorial workflow (#7726) | ported-by-laika | 7de5b0e96 |  |
| `825f3d8e4` | 2026-07-15 | [#7866](https://github.com/decaporg/decap-cms/pull/7866) | fix: remove weird padding from group by headings (#7866) | ported-by-laika | 447936673 |  |
| `b1a412d0a` | 2026-07-16 | [#7886](https://github.com/decaporg/decap-cms/pull/7886) | chore(deps-dev): bump websocket-driver from 0.7.4 to 0.7.5 (#7886) | n/a |  | v4 has it at least this new, or no longer uses it |
| `2e6062381` | 2026-07-16 | [#7865](https://github.com/decaporg/decap-cms/pull/7865) | feat: remove frontmatter `draft` from dev-test (#7865) | done | fea0465d0 | main and test-backend demos only; recorded backend demos keep `draft` |
| `14c5d5183` | 2026-07-17 | [#7876](https://github.com/decaporg/decap-cms/pull/7876) | refactor: migrate to React's new JSX runtime (#7876) | n/a |  | v4 already uses the automatic JSX runtime |
| `6c81f3c51` | 2026-07-21 | [#7890](https://github.com/decaporg/decap-cms/pull/7890) | chore(deps): bump axios from 1.16.0 to 1.18.1 (#7890) | n/a |  | v4 has it at least this new, or no longer uses it |
| `16fd12fe7` | 2026-07-23 | [#7894](https://github.com/decaporg/decap-cms/pull/7894) | Update dependencies (#7894) | n/a |  | lockfile/dependency refresh; v4 has its own catalog |
| `8f23db0f9` | 2026-07-23 | [#7896](https://github.com/decaporg/decap-cms/pull/7896) | fix(richtext): preserve block images in list items (#7896) | done | 3f3b1abd9 | fix came with the Plate richtext port (ec72c45ec); test ported here |
| `40c4ac0d5` | 2026-07-23 | [#7451](https://github.com/decaporg/decap-cms/pull/7451) | feat: add collection size limit feature (#7451) | done | 14747a571 | selector in core/lib/canCreateNewEntry; e2e with a config override |
| `ffe5ab7e6` | 2026-07-23 |  | chore(release): publish | n/a |  | release commit |
| `d8436e6a2` | 2026-07-24 | [#7914](https://github.com/decaporg/decap-cms/pull/7914) | fix: bump incompatible react-tostify version (#7914) | n/a |  | v4 replaced react-toastify with Base UI toasts |
| `bc76c05a8` | 2026-07-24 |  | chore(release): publish | n/a |  | release commit |
| `e50c1b16f` | 2026-07-24 | [#7927](https://github.com/decaporg/decap-cms/pull/7927) | chore(deps-dev): bump webpack-dev-server from 5.2.6 to 6.0.0 (#7927) | n/a |  | v4 has it at least this new, or no longer uses it |
| `c427e2a35` | 2026-08-10 | [#7953](https://github.com/decaporg/decap-cms/pull/7953) | chore(deps): bump dompurify from 3.4.12 to 3.4.13 (#7953) | n/a |  | v4 has it at least this new, or no longer uses it |
| `1ac1dc26d` | 2026-08-11 | [#7943](https://github.com/decaporg/decap-cms/pull/7943) | chore(deps): bump ip-address from 10.2.0 to 10.5.0 (#7943) | n/a |  | v4 has it at least this new, or no longer uses it |
| `22ddfe8cc` | 2026-08-11 | [#7954](https://github.com/decaporg/decap-cms/pull/7954) | chore(deps-dev): bump postcss from 8.5.21 to 8.5.26 (#7954) | done | 3c6db437c | lockfile refreshed past it |
| `44da55696` | 2026-08-11 | [#7948](https://github.com/decaporg/decap-cms/pull/7948) | chore(deps): bump fast-uri from 3.1.4 to 3.1.5 (#7948) | done | 3c6db437c | lockfile refreshed past it |
| `ac7dd7ab9` | 2026-08-11 | [#7947](https://github.com/decaporg/decap-cms/pull/7947) | chore(deps): bump undici from 6.27.0 to 6.28.0 (#7947) | n/a |  | v4 has it at least this new, or no longer uses it |
| `a82d93578` | 2026-08-13 | [#7934](https://github.com/decaporg/decap-cms/pull/7934) | fix(backend-git-gateway): restore PKCE session on page reload (#7934) | done | b6601ac7f | real git-gateway PKCE check still open |
| `bfe0dfd65` | 2026-08-19 | [#7951](https://github.com/decaporg/decap-cms/pull/7951) | fix: solve flaky/failing tests (#7951) | done | a21a9fb81 | failure half only; in-flight dedupe already covered by queryCore |
| `c7af08ac5` | 2026-08-19 | [#7936](https://github.com/decaporg/decap-cms/pull/7936) | chore(deps-dev): bump nx from 21.6.11 to 23.1.1 (#7936) | n/a |  | v4 has it at least this new, or no longer uses it |
| `2b772c789` | 2026-08-21 | [#7845](https://github.com/decaporg/decap-cms/pull/7845) | Support browser image transformations (#7845) | done | 2d1d3f4a7 | media_processing canonical, image_optimization deprecated; WASM shipped beside script-tag bundles |
| `1f6f71c23` | 2026-08-31 |  | Merge commit from fork | done | a872fe4d1 | GHSA-jm5q-pq3r-26g9; real-backend check (Bitbucket via Netlify auth) still open |
| `532fbb6ea` | 2026-08-31 |  | Merge commit from fork | done | 5f8748117 | keeps "missing folder lists nothing" (upstream later did the same in #7965); also guards v4-only listRepoFolders |
| `63c8abdbd` | 2026-08-31 |  | chore(release): publish | n/a |  | release commit |
| `74879f5a5` | 2026-08-31 |  | fix(media-library): guard against undefined selectedFile when files empty | n/a |  | reverted upstream by 21a22e025 |
| `21a22e025` | 2026-08-31 |  | Revert "fix(media-library): guard against undefined selectedFile when files empty" | n/a |  | revert |
| `d532e6623` | 2026-09-01 | [#7965](https://github.com/decaporg/decap-cms/pull/7965) | fix: Windows path-mock regression and media library upload/delete edge case (#7965) | done | 545a284da | path unmock only; listRepoFiles and media library guards already on v4 |
| `cec9441e1` | 2026-09-02 | [#7932](https://github.com/decaporg/decap-cms/pull/7932) | fix(gitlab): refresh expired tokens for GraphQL and REST 401s (#7932) | done | 51b992a20 | wrapper drops Apollo 4's lowercased auth header; real GitLab check still open |
| `4d3d3ba3c` | 2026-09-02 | [#7899](https://github.com/decaporg/decap-cms/pull/7899) | fix(richtext): render nested shortcodes in preview (#7899) | done | a095fe30d |  |
| `5cad3e130` | 2026-09-02 | [#7645](https://github.com/decaporg/decap-cms/pull/7645) | refactor: migrate from npm to pnpm (#7645) | n/a |  | v4 is already pnpm |
| `060c15b6a` | 2026-09-03 | [#7972](https://github.com/decaporg/decap-cms/pull/7972) | fix(widget-list): route list item changes by item id, not position (#7972) | done | bd937bac9 | v4 variant was worse: stale handler resurrected removed items |
| `a35d0fdae` | 2026-09-03 | [#7968](https://github.com/decaporg/decap-cms/pull/7968) | Fix: improve relation widget (#7968) | done | e24733b40 | also fixes the shared combobox blank band and lets items truncate |
| `c1ea921ad` | 2026-09-08 | [#7974](https://github.com/decaporg/decap-cms/pull/7974) | chore(deps): bump immutable from 3.8.2 to 4.3.9 (#7974) | n/a |  | v4 removed Immutable |
| `8b563553a` | 2026-09-08 | [#7612](https://github.com/decaporg/decap-cms/pull/7612) | fix: applying collection filter on i18n: single file (#7612) | done | 0b0b362c1 | adds the i18n demo collection too |
| `dd9219ce8` | 2026-09-08 | [#7970](https://github.com/decaporg/decap-cms/pull/7970) | fix(preview): preserve blob: image URLs when sanitizing preview HTML (#7970) | done | 527ecc6e3 | richtext only; v4 has no markdown widget |
| `6141cb822` | 2026-09-08 |  | chore: update update-browserslist-db | n/a |  | lockfile |
| `09b6222b0` | 2026-09-08 |  | chore: update nx.json | n/a |  | nx; v4 has no nx |
| `570c3e7fb` | 2026-09-08 |  | chore(release): publish | n/a |  | release commit |
| `59843046c` | 2026-09-09 | [#7976](https://github.com/decaporg/decap-cms/pull/7976) | fix: support Forgejo editorial workflow PR heads (#7976) | done | b0e67531f | real Forgejo check still open |
| `3def52921` | 2026-09-10 | [#7980](https://github.com/decaporg/decap-cms/pull/7980) | fix(release): verify published manifests, widen catalog: guard (#7980) | n/a |  | lerna release tooling; v4 uses changesets |
| `e857f7dac` | 2026-09-10 | [#7958](https://github.com/decaporg/decap-cms/pull/7958) | feat(widget-markdown): support inline custom editor components (#7958) | skip |  | decision 2026-10-06: no markdown inline components in v4 |
| `119ddb117` | 2026-09-10 | [#7981](https://github.com/decaporg/decap-cms/pull/7981) | chore(deps): bump morgan from 1.10.1 to 1.12.0 (#7981) | n/a |  | v4 has it at least this new, or no longer uses it |
| `31b352940` | 2026-09-10 |  | chore(release): publish | n/a |  | release commit |
| `138f6a411` | 2026-09-10 | [#7982](https://github.com/decaporg/decap-cms/pull/7982) | fix(release): add manual publish trigger, tolerate registry lag (#7982) | n/a |  | lerna release tooling |
| `23a108cc0` | 2026-09-10 |  | ci: make package publishing resumable with explicit dist-tags | n/a |  | lerna release tooling |
| `62b7b2400` | 2026-09-11 |  | fix(relation): retry menu options after a failed query and cache only success | n/a |  | reverted upstream by 97f788a18 |
| `66c133dfc` | 2026-09-11 |  | fix(relation): guard shouldComponentUpdate when nextState is missing | n/a |  | reverted upstream by 97f788a18 |
| `97f788a18` | 2026-09-11 |  | Revert "fix(relation): retry menu options after a failed query" and its follow-up | n/a |  | revert |
| `b994417f8` | 2026-09-22 | [#7793](https://github.com/decaporg/decap-cms/pull/7793) | Feature/optimize editor performance (#7793) | ported-by-laika | 9c36573e3 | came from Laika's optimize-editor-performance branch |
| `f269a8a4f` | 2026-09-22 | [#7994](https://github.com/decaporg/decap-cms/pull/7994) | Notes pane improvements, GitLab support (#7994) | done | 5941e825b, d6d6aa9c8 | ported together with #7563 |
| `1d5868347` | 2026-09-22 |  | chore(release): publish | n/a |  | release commit |
