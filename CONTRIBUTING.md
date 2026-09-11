# CONTRIBUTING

Contributions are always welcome, no matter how large or small. Before contributing,
please read the [code of conduct](CODE_OF_CONDUCT.md).

For details on contributing to documentation, see [Website Readme](https://github.com/decaporg/decap-website/blob/main/README.md).

## Setup

> Install [Node.js (LTS)](https://nodejs.org/) and [pnpm](https://pnpm.io/) on your system.

### Install dependencies

```sh
git clone https://github.com/decaporg/decap-cms
cd decap-cms
pnpm install
```

### Run locally

```sh
pnpm run start
```

## Available scripts

### clean

Removes all of the CMS package `dist` directories.

```sh
pnpm run clean
```

### reset

Runs the `clean` script and removes all the `node_modules` from the CMS packages.

```sh
pnpm run reset
```

### build

Runs the `clean` script and builds the CMS packages.

```sh
pnpm run build
```

### build-preview

Runs the `build` and `build-preview` scripts in each package and serves the resulting build locally.

```sh
pnpm run build-preview
```

### test

Runs linting and Jest tests.

```sh
pnpm run test
```

### test:all

Runs linting, Jest, and Cypress tests.

```sh
pnpm run test:all
```

### test:e2e

Runs Cypress e2e tests.

```sh
pnpm run test:e2e
```

### test:e2e:dev

Runs Cypress e2e tests on watch mode with an open instance of Chrome.

```sh
pnpm run test:e2e:dev
```

### format

Formats code and docs according to our style guidelines.

```sh
pnpm run format
```

## Pull Requests

We actively welcome your pull requests!

If you need help with Git or our workflow, please ask in our [community chat](https://decapcms.org/chat). We want your contributions even if you're just learning Git. Our maintainers are happy to help!

Decap CMS uses the [Forking Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow) + [Feature Branches](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow). Additionally, PR's should be [rebased](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) on main when opened, and again before merging.

1. Fork the repo.
2. Create a branch from `main`. If you're addressing a specific issue, prefix your branch name with the issue number.
3. If you've added code that should be tested, add tests.
4. If you've changed APIs, update the documentation.
5. Run `pnpm run test` and ensure the test suite passes.
6. Use `pnpm run format` to format and lint your code.
7. PR's must be rebased before merge (feel free to ask for help).
8. PR should be reviewed by two maintainers prior to merging.

## Debugging

`pnpm run start` spawns a development server and uses `dev-test/config.yml` and `dev-test/index.html` to serve the CMS.
In order to debug a specific issue follow the next steps:

1. Replace `dev-test/config.yml` with the relevant `config.yml`. If you want to test the backend, make sure that the `backend` property of the config indicates which backend you use (GitHub, Gitlab, Bitbucket etc) and path to the repo.

```yaml
backend:
  name: github
  repo: owner-name/repo-name
```

2. Change the content of `dev-test/index.html` to:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Decap CMS</title>
  </head>
  <body>
    <script src="dist/decap-cms.js"></script>
    <!-- <script>
      // this is the place to add CMS customizations if you need to, e.g.
      CMS.registerPreviewTemplate('posts', PostPreview);
    </script> -->
  </body>
</html>
```

The most important thing is to make sure that Decap CMS is loaded from the `dist` folder. This way, every time you make changes to the source code, they will be compiled and reflected immediately on `localhost`.

3. Run `pnpm run start`
4. Open `http://localhost:8080/` in the browser and you should have access to the CMS

### Debugging Git Gateway

When debugging the CMS with Git Gateway you must:

1. Have a Netlify site with [Git Gateway](https://docs.netlify.com/visitor-access/git-gateway/) and [Netlify Identity](https://docs.netlify.com/visitor-access/identity/) enabled. An easy way to create such a site is to use a [template](https://www.decapcms.org/docs/start-with-a-template/), for example the [Gatsby template](https://app.netlify.com/start/deploy?repository=https://github.com/decaporg/gatsby-starter-decap-cms&stack=cms)
2. Tell the CMS the URL of your Netlify site using a local storage item. To do so:

   1. Open `http://localhost:8080/` in the browser
   2. Open the Developer Console. Write the below command and press enter: `localStorage.setItem('netlifySiteURL', 'https://yourwebsiteurl.netlify.app/')`
   3. To be sure, you can run this command as well: `localStorage.getItem('netlifySiteURL')`
   4. Refresh the page
   5. You should be able to log in via your Netlify Identity email/password

### Fine tune the way you run unit tests

There are situations where you would want to run a specific test file, or tests that match a certain pattern.

To run all the tests for a specific file, use this command:

```
npx jest <filename or file path>
```

The first part of the command, `npx jest` means running the locally installed version of `jest`. It is equivalent to running `node_modules/.bin/jest`.

Example for running all the tests for the file `gitlab.spec.js`: `npx jest gitlab.spec.js`

Some test files like `API.spec.js` is available in several packages. You can pass a regexp pattern instead of file path to narrow down files.

Example for running all the tests for the file `API.spec.js` in the `decap-cms-backend-gitlab` package:

`npx jest ".+backend-gitlab/.+/API.spec.js`

To run a specific test in a file, add the flag `--testNamePattern`, or `-t` for short followed by a regexp to match your test name.

Example for running the test "should return true on project access_level >= 30" in the API.spec.js in `decap-cms-backend-gitlab` package:

```
npx jest -t "true on p" ".+backend-gitlab/.+/API.spec.js"
```

For more information about running tests exactly the way you want, check out the official documentation for [Jest CLI](https://jestjs.io/docs/cli).

## Releasing

Decap CMS uses NPM trusted publishers with OIDC for secure, automated package publishing.

### How It Works

- Publishing is automated via GitHub Actions when version tags are pushed
- Uses OpenID Connect (OIDC) for authentication. No NPM tokens required
- Each package has a trusted publisher configured on npmjs.com
- Workflow generates short-lived, cryptographically-signed tokens automatically
- Lerna bumps versions and tags; **`pnpm publish -r` does the publishing**

> [!IMPORTANT]
> **Never run `lerna publish` (in any form, including `from-git` and `from-package`).**
>
> Package manifests declare their dependencies as `catalog:`, a pnpm-workspace-internal protocol that has to be substituted with the real semver ranges at publish time. `pnpm publish` does that substitution; Lerna's publish client does not, and uploads the literal string `catalog:` to the registry. The result installs fine with pnpm inside this workspace and is broken for every consumer using npm, yarn or bun.
>
> This is what happened in the 2026-09-08 release: eight packages, including `decap-server@3.11.1`, shipped uninstallable. See [#7979](https://github.com/decaporg/decap-cms/issues/7979).
>
> Use `lerna version` to bump and tag. Publishing is CI's job, and `pnpm run publish:packages` is the only manual fallback.

### Release Process

1. **Prepare the release:**
  ```sh
  # Ensure your local `main` branch is up to date
  pnpm install --frozen-lockfile
  pnpm run test

  # Bump versions for changed packages
  pnpm exec lerna version

  # This will:
  # - Detect changed packages since last release
  # - Bump versions according to conventional commits
  # - Update CHANGELOG.md
  # - Create git commit and tags
  # - Push to upstream
  ```

2. **Publish:**
   - Run the **Publish Packages** workflow manually from the Actions tab, against the `chore(release): publish` commit
   - Leave **dist-tag** on `latest` for a normal release; set it to `beta` for a prerelease
   - GitHub Actions runs tests and builds packages
   - `scripts/publish-packages.mjs` publishes to npm using OIDC, skipping versions already on the registry
   - Provenance attestations are generated automatically
   - Every published manifest is verified afterwards, whether or not the publish succeeded

   > [!NOTE]
   > The workflow also has a tag trigger, but **do not rely on it for a release**. GitHub creates no workflow run at all when a single push carries many tags, and a release pushes one tag per package. Use the manual trigger.

   > [!NOTE]
   > Re-running the workflow against a partially published release is safe and is the intended way to resume one. The publish script asks the registry what already exists and never re-uploads it, so a second run picks up exactly what is left.

   > [!WARNING]
   > Never pass publish flags through `pnpm run`. `pnpm run <script> -- --flag` injects a literal `--`, so the flags arrive as positional arguments and are dropped without a word: `pnpm run publish:packages -- --tag beta --dry-run` ignores both and publishes for real, to `latest`. Invoke the script or `pnpm publish` directly.


3. **Verify the release:**
   ```sh
   git pull
   pnpm run verify:published
   ```

   The publish workflow runs this too, but run it locally as well after any release that needed manual intervention. It fetches every publishable package from the registry at the version in your working tree and fails if a published manifest still contains `catalog:` or `workspace:` specifiers.

   npm accepts a publish before the version becomes readable, so the check allows up to 10 minutes for absent versions to appear before failing. Unresolved specifiers fail immediately -- that is a property of the published manifest and will not change on its own.

4. **Create GitHub release:**
   - Go to [Releases](https://github.com/decaporg/decap-cms/releases)
   - Draft a new release from the tag
   - Add release notes highlighting changes

### Prerelease (beta) Releases

A prerelease must never land on the `latest` dist-tag. npm does not infer a tag from the version, so `3.20.0-beta.0` published without `--tag` becomes what `npm install decap-cms` resolves to.

```sh
# From a release/* branch -- lerna.json's allowBranch permits main and release/*
pnpm exec lerna version --conventional-prerelease --preid beta
```

Then run **Publish Packages** against the resulting `chore(release): publish` commit with **dist-tag** set to `beta`, and confirm both tags afterwards:

```sh
npm view decap-cms dist-tags   # latest unchanged; beta on the new version
```

Repeating `lerna version --conventional-prerelease --preid beta` bumps `-beta.0` to `-beta.1`. Note that a prerelease is all-or-nothing: every package is versioned together and the beta manifests pin each other at exact beta versions, so consumers have to take the whole set from `beta`.

### Publishing a Brand-New Package

npm configures trusted publishing per existing package, so there is nothing for CI to exchange an OIDC token against until a package's first version exists. CI cannot create a package. Publish the first version from a maintainer machine, then configure trusted publishing for it on npmjs.com:

```sh
npm login
pnpm publish --filter <package-name> --no-git-checks --tag beta --access public
```

Use `pnpm`, never `npm publish`, which does not understand `catalog:` and would ship the specifier literally. The publish script detects this case and prints the exact command for the packages that need it.

### Manual Publishing (Emergency Only)

If automated publishing fails and you need to publish manually:

```sh
# Authenticate with npm (uses session-based auth with 2FA)
npm login

# Publish changed packages -- pnpm, never lerna, see the warning above
pnpm run publish:packages

# Always confirm what actually reached the registry
pnpm run verify:published
```

Note: Manual publishing still requires 2FA. Use recovery codes if you don't have access to your 2FA device.

`pnpm publish -r` skips versions that are already on the registry, so it is safe to re-run against a partially published release.

## License

By contributing to Decap CMS, you agree that your contributions will be licensed
under its [MIT license](LICENSE).
