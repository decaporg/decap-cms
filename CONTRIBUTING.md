# CONTRIBUTING

Contributions are always welcome, no matter how large or small. Before contributing,
please read the [code of conduct](CODE_OF_CONDUCT.md).

For details on contributing to documentation, see [Website Readme](https://github.com/decaporg/decap-website/blob/main/README.md).

## Setup

> Install [Node.js (LTS)](https://nodejs.org/) on your system.

### Install dependencies

```sh
git clone https://github.com/decaporg/decap-cms
cd decap-cms
npm install
```

### Run locally

```sh
npm run start
```

## Available scripts

### clean

Removes all of the CMS package `dist` directories.

```sh
npm run clean
```

### reset

Runs the `clean` script and removes all the `node_modules` from the CMS packages.

```sh
npm run reset
```

### build

Runs the `clean` script and builds the CMS packages.

```sh
npm run build
```

### build-preview

Runs the `build` and `build-preview` scripts in each package and serves the resulting build locally.

```sh
npm run build-preview
```

### test

Runs linting and Jest tests.

```sh
npm run test
```

### test:all

Runs linting, Jest, and Cypress tests.

```sh
npm run test:all
```

### test:e2e

Runs Cypress e2e tests.

```sh
npm run test:e2e
```

### test:e2e:dev

Runs Cypress e2e tests on watch mode with an open instance of Chrome.

```sh
npm run test:e2e:dev
```

### format

Formats code and docs according to our style guidelines.

```sh
npm run format
```

## Pull Requests

We actively welcome your pull requests!

If you need help with Git or our workflow, please ask in our [community chat](https://decapcms.org/chat). We want your contributions even if you're just learning Git. Our maintainers are happy to help!

Decap CMS uses the [Forking Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow) + [Feature Branches](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow). Additionally, PR's should be [rebased](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) on main when opened, and again before merging.

1. Fork the repo.
2. Create a branch from `main`. If you're addressing a specific issue, prefix your branch name with the issue number.
3. If you've added code that should be tested, add tests.
4. If you've changed APIs, update the documentation.
5. Run `npm run test` and ensure the test suite passes.
6. Use `npm run format` to format and lint your code.
7. PR's must be rebased before merge (feel free to ask for help).
8. PR should be reviewed by two maintainers prior to merging.

## Debugging

`npm run start` spawns a development server and uses `dev-test/config.yml` and `dev-test/index.html` to serve the CMS.
In order to debug a specific issue follow the next steps:

1. Replace `dev-test/config.yml` with the relevant `config.yml`. If you want to test the backend, make sure that the `backend` property of the config indicates which backend you use (GitHub, Gitlab, Bitbucket etc) and path to the repo.

```js
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

3. Run `npm run start`
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

## License

By contributing to Decap CMS, you agree that your contributions will be licensed
under its [MIT license](LICENSE).
