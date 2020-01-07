# Cypress Tests Guide

## Introduction

[Cypress](https://www.cypress.io/) is a JavaScript End to End Testing Framework that runs in the browser.

Cypress tests run with a [local version](../dev-test) of the CMS.

During the setup of a spec file, the relevant `index.html` and `config.yml` are copied from `dev-test/backends/<backend>` to `dev-test`.

Tests for the `test` backend use mock data generated in `dev-test/backends/test/index.html`.

Tests for the other backends use previously [recorded data](fixtures) and stub `fetch` [calls](support/commands.js#L52). See more about recording tests data [here](#recording-tests-data).

## Run Tests Locally

```bash
yarn test:e2e # builds the demo site and runs Cypress in headless mode with mock data
```

## Debug Tests

```bash
yarn develop # starts a local dev server with the demo site
yarn test:e2e:exec # runs Cypress in non-headless mode with mock data
```

## Recording Tests Data

When recording tests, access to the relevant backend API is required, thus one must set up a `.env` file in the root project directory in the following format:

```bash
GITHUB_REPO_OWNER=owner
GITHUB_REPO_NAME=repo
GITHUB_REPO_TOKEN=tokenWithWritePermissions
GITHUB_OPEN_AUTHORING_OWNER=forkOwner
GITHUB_OPEN_AUTHORING_TOKEN=tokenWithWritePermissions

GITLAB_REPO_OWNER=owner
GITLAB_REPO_NAME=repo
GITLAB_REPO_TOKEN=tokenWithWritePermissions

BITBUCKET_REPO_OWNER=owner
BITBUCKET_REPO_NAME=repo
BITBUCKET_OUATH_CONSUMER_KEY=ouathConsumerKey
BITBUCKET_OUATH_CONSUMER_SECRET=ouathConsumerSecret

NETLIFY_API_TOKEN=netlifyApiToken
NETLIFY_INSTALLATION_ID=netlifyGitHubInstallationId
```

> The structure of the relevant repo should match the settings in [`config.yml`](../dev-test/backends/<backend>/config.yml#L1)

To start a recording run the following commands:

```bash
yarn develop # starts a local dev server with the demo site
yarn mock:server:start # starts the recording proxy
yarn test:e2e:record-fixtures:dev # runs Cypress in non-headless and pass data through the recording proxy
yarn mock:server:stop # stops the recording proxy
```

> During the recorded process a clone of the relevant repo will be created under `.temp` and reset between tests.

Recordings are sanitized from any possible sensitive data and [transformed](plugins/common.js#L34) into an easier to process format.

To avoid recording all the tests over and over again, a recommended process is to:

1. Mark the specific test as `only` by changing `it("some test...` to `it.only("some test...` for the relevant test.
2. Run the test in recording mode.
3. Exit Cypress and stop the proxy.
4. Run the test normally (with mock data) to verify the recording works.

## Debugging Playback Failures

Most common failures are:

1. The [recorded data](utils/mock-server.js#L17) is not [transformed](plugins/common.js#L34) properly (e.g. sanitization broke something).
2. The [stubbed requests and responses](support/commands.js#L82) are not [matched](support/commands.js#L32) properly (e.g. timestamp changes in request body between recording and playback).

Dumping all recorded data as is to a file [here](utils/mock-server.js#L24) and adding a `debugger;` statement [here](support/commands.js#L52) is useful to gain insights.

Also comparing console log messages between recording and playback is very useful (ordering of requests, etc.)
