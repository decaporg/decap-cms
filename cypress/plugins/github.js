const Octokit = require('@octokit/rest');
const fs = require('fs-extra');
const path = require('path');
const {
  getExpectationsFilename,
  transformRecordedData: transformData,
  getGitClient,
} = require('./common');
const { updateConfig } = require('../utils/config');
const { escapeRegExp } = require('../utils/regexp');
const { merge } = require('lodash');
const { retrieveRecordedExpectations, resetMockServerState } = require('../utils/mock-server');

const GITHUB_REPO_OWNER_SANITIZED_VALUE = 'owner';
const GITHUB_REPO_NAME_SANITIZED_VALUE = 'repo';
const GITHUB_REPO_TOKEN_SANITIZED_VALUE = 'fakeToken';
const GITHUB_OPEN_AUTHORING_OWNER_SANITIZED_VALUE = 'forkOwner';
const GITHUB_OPEN_AUTHORING_TOKEN_SANITIZED_VALUE = 'fakeForkToken';

const FAKE_OWNER_USER = {
  login: 'owner',
  id: 1,
  avatar_url: 'https://avatars1.githubusercontent.com/u/7892489?v=4',
  name: 'owner',
};

const FAKE_FORK_OWNER_USER = {
  login: 'forkOwner',
  id: 2,
  avatar_url: 'https://avatars1.githubusercontent.com/u/9919?s=200&v=4',
  name: 'forkOwner',
};

function getGitHubClient(token) {
  const client = new Octokit({
    auth: `token ${token}`,
    baseUrl: 'https://api.github.com',
  });
  return client;
}

function getEnvs() {
  const {
    GITHUB_REPO_OWNER: owner,
    GITHUB_REPO_NAME: repo,
    GITHUB_REPO_TOKEN: token,
    GITHUB_OPEN_AUTHORING_OWNER: forkOwner,
    GITHUB_OPEN_AUTHORING_TOKEN: forkToken,
  } = process.env;
  if (!owner || !repo || !token || !forkOwner || !forkToken) {
    throw new Error(
      'Please set GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_REPO_TOKEN, GITHUB_OPEN_AUTHORING_OWNER, GITHUB_OPEN_AUTHORING_TOKEN  environment variables',
    );
  }
  return { owner, repo, token, forkOwner, forkToken };
}

async function prepareTestGitHubRepo() {
  const { owner, repo, token } = getEnvs();

  // postfix a random string to avoid collisions
  const postfix = Math.random()
    .toString(32)
    .substring(2);
  const testRepoName = `${repo}-${Date.now()}-${postfix}`;

  const client = getGitHubClient(token);

  console.log('Creating repository', testRepoName);
  await client.repos.createForAuthenticatedUser({
    name: testRepoName,
  });

  const tempDir = path.join('.temp', testRepoName);
  await fs.remove(tempDir);
  let git = getGitClient();

  const repoUrl = `git@github.com:${owner}/${repo}.git`;

  console.log('Cloning repository', repoUrl);
  await git.clone(repoUrl, tempDir);
  git = getGitClient(tempDir);

  console.log('Pushing to new repository', testRepoName);

  await git.removeRemote('origin');
  await git.addRemote(
    'origin',
    `https://${token}:x-oauth-basic@github.com/${owner}/${testRepoName}`,
  );
  await git.push(['-u', 'origin', 'master']);

  return { owner, repo: testRepoName, tempDir };
}

async function getAuthenticatedUser(token) {
  const client = getGitHubClient(token);
  const { data: user } = await client.users.getAuthenticated();
  return { ...user, token, backendName: 'github' };
}

async function getUser() {
  const { token } = getEnvs();
  return getAuthenticatedUser(token);
}

async function getForkUser() {
  const { forkToken } = getEnvs();
  return getAuthenticatedUser(forkToken);
}

async function deleteRepositories({ owner, repo, tempDir }) {
  const { forkOwner, token, forkToken } = getEnvs();

  const errorHandler = e => {
    if (e.status !== 404) {
      throw e;
    }
  };

  console.log('Deleting repository', `${owner}/${repo}`);
  await fs.remove(tempDir);

  let client = getGitHubClient(token);
  await client.repos
    .delete({
      owner,
      repo,
    })
    .catch(errorHandler);

  console.log('Deleting forked repository', `${forkOwner}/${repo}`);
  client = getGitHubClient(forkToken);
  await client.repos
    .delete({
      owner: forkOwner,
      repo,
    })
    .catch(errorHandler);
}

async function resetOriginRepo({ owner, repo, tempDir }) {
  console.log('Resetting origin repo:', `${owner}/${repo}`);
  const { token } = getEnvs();
  const client = getGitHubClient(token);

  const { data: prs } = await client.pulls.list({
    repo,
    owner,
    state: 'open',
  });
  const numbers = prs.map(pr => pr.number);
  console.log('Closing prs:', numbers);
  await Promise.all(
    numbers.map(pull_number =>
      client.pulls.update({
        owner,
        repo,
        pull_number,
        state: 'closed',
      }),
    ),
  );

  const { data: branches } = await client.repos.listBranches({ owner, repo });
  const refs = branches.filter(b => b.name !== 'master').map(b => `heads/${b.name}`);

  console.log('Deleting refs', refs);
  await Promise.all(
    refs.map(ref =>
      client.git.deleteRef({
        owner,
        repo,
        ref,
      }),
    ),
  );

  console.log('Resetting master');
  const git = getGitClient(tempDir);
  await git.push(['--force', 'origin', 'master']);
  console.log('Done resetting origin repo:', `${owner}/${repo}`);
}

async function resetForkedRepo({ repo }) {
  const { forkToken, forkOwner } = getEnvs();
  const client = getGitHubClient(forkToken);

  const { data: repos } = await client.repos.list();
  if (repos.some(r => r.name === repo)) {
    console.log('Resetting forked repo:', `${forkOwner}/${repo}`);
    const { data: branches } = await client.repos.listBranches({ owner: forkOwner, repo });
    const refs = branches.filter(b => b.name !== 'master').map(b => `heads/${b.name}`);

    console.log('Deleting refs', refs);
    await Promise.all(
      refs.map(ref =>
        client.git.deleteRef({
          owner: forkOwner,
          repo,
          ref,
        }),
      ),
    );
    console.log('Done resetting forked repo:', `${forkOwner}/${repo}`);
  }
}

async function resetRepositories({ owner, repo, tempDir }) {
  await resetOriginRepo({ owner, repo, tempDir });
  await resetForkedRepo({ repo });
}

async function setupGitHub(options) {
  if (process.env.RECORD_FIXTURES) {
    console.log('Running tests in "record" mode - live data with be used!');
    const [user, forkUser, repoData] = await Promise.all([
      getUser(),
      getForkUser(),
      prepareTestGitHubRepo(),
    ]);

    await updateConfig(config => {
      merge(config, options, {
        backend: {
          repo: `${repoData.owner}/${repoData.repo}`,
        },
      });
    });

    return { ...repoData, user, forkUser, mockResponses: false };
  } else {
    console.log('Running tests in "playback" mode - local data with be used');

    await updateConfig(config => {
      merge(config, options, {
        backend: {
          repo: `${GITHUB_REPO_OWNER_SANITIZED_VALUE}/${GITHUB_REPO_NAME_SANITIZED_VALUE}`,
        },
      });
    });

    return {
      owner: GITHUB_REPO_OWNER_SANITIZED_VALUE,
      repo: GITHUB_REPO_NAME_SANITIZED_VALUE,
      user: { ...FAKE_OWNER_USER, token: GITHUB_REPO_TOKEN_SANITIZED_VALUE, backendName: 'github' },
      forkUser: {
        ...FAKE_FORK_OWNER_USER,
        token: GITHUB_OPEN_AUTHORING_TOKEN_SANITIZED_VALUE,
        backendName: 'github',
      },
      mockResponses: true,
    };
  }
}

async function teardownGitHub(taskData) {
  if (process.env.RECORD_FIXTURES) {
    await deleteRepositories(taskData);
  }

  return null;
}

async function setupGitHubTest(taskData) {
  if (process.env.RECORD_FIXTURES) {
    await resetRepositories(taskData);
    await resetMockServerState();
  }

  return null;
}

const sanitizeString = (
  str,
  { owner, repo, token, forkOwner, forkToken, ownerName, forkOwnerName },
) => {
  let replaced = str
    .replace(new RegExp(escapeRegExp(forkOwner), 'g'), GITHUB_OPEN_AUTHORING_OWNER_SANITIZED_VALUE)
    .replace(new RegExp(escapeRegExp(forkToken), 'g'), GITHUB_OPEN_AUTHORING_TOKEN_SANITIZED_VALUE)
    .replace(new RegExp(escapeRegExp(owner), 'g'), GITHUB_REPO_OWNER_SANITIZED_VALUE)
    .replace(new RegExp(escapeRegExp(repo), 'g'), GITHUB_REPO_NAME_SANITIZED_VALUE)
    .replace(new RegExp(escapeRegExp(token), 'g'), GITHUB_REPO_TOKEN_SANITIZED_VALUE)
    .replace(new RegExp('https://avatars.+?/u/.+?v=\\d', 'g'), `${FAKE_OWNER_USER.avatar_url}`);

  if (ownerName) {
    replaced = replaced.replace(new RegExp(escapeRegExp(ownerName), 'g'), FAKE_OWNER_USER.name);
  }

  if (forkOwnerName) {
    replaced = replaced.replace(
      new RegExp(escapeRegExp(forkOwnerName), 'g'),
      FAKE_FORK_OWNER_USER.name,
    );
  }

  return replaced;
};

const transformRecordedData = (expectation, toSanitize) => {
  const requestBodySanitizer = httpRequest => {
    let body;
    if (httpRequest.body && httpRequest.body.type === 'JSON' && httpRequest.body.json) {
      const bodyObject = JSON.parse(httpRequest.body.json);
      if (bodyObject.encoding === 'base64') {
        // sanitize encoded data
        const decodedBody = Buffer.from(bodyObject.content, 'base64').toString('binary');
        const sanitizedContent = sanitizeString(decodedBody, toSanitize);
        const sanitizedEncodedContent = Buffer.from(sanitizedContent, 'binary').toString('base64');
        bodyObject.content = sanitizedEncodedContent;
        body = JSON.stringify(bodyObject);
      } else {
        body = httpRequest.body.json;
      }
    } else if (httpRequest.body && httpRequest.body.type === 'STRING' && httpRequest.body.string) {
      body = httpRequest.body.string;
    }
    return body;
  };

  const responseBodySanitizer = (httpRequest, httpResponse) => {
    let responseBody = null;
    if (httpResponse.body && httpResponse.body.string) {
      responseBody = httpResponse.body.string;
    } else if (
      httpResponse.body &&
      httpResponse.body.type === 'BINARY' &&
      httpResponse.body.base64Bytes
    ) {
      responseBody = {
        encoding: 'base64',
        content: httpResponse.body.base64Bytes,
      };
    } else if (httpResponse.body) {
      responseBody = httpResponse.body;
    }

    // replace recorded user with fake one
    if (
      responseBody &&
      httpRequest.path === '/user' &&
      httpRequest.headers.Host.includes('api.github.com')
    ) {
      const parsed = JSON.parse(responseBody);
      if (parsed.login === toSanitize.forkOwner) {
        responseBody = JSON.stringify(FAKE_FORK_OWNER_USER);
      } else {
        responseBody = JSON.stringify(FAKE_OWNER_USER);
      }
    }
    return responseBody;
  };

  const cypressRouteOptions = transformData(
    expectation,
    requestBodySanitizer,
    responseBodySanitizer,
  );

  return cypressRouteOptions;
};

const defaultOptions = {
  transformRecordedData,
};

async function teardownGitHubTest(taskData, { transformRecordedData } = defaultOptions) {
  if (process.env.RECORD_FIXTURES) {
    await resetRepositories(taskData);

    try {
      const filename = getExpectationsFilename(taskData);

      console.log('Persisting recorded data for test:', path.basename(filename));

      const { owner, token, forkOwner, forkToken } = getEnvs();

      const expectations = await retrieveRecordedExpectations();

      const toSanitize = {
        owner,
        repo: taskData.repo,
        token,
        forkOwner,
        forkToken,
        ownerName: taskData.user.name,
        forkOwnerName: taskData.forkUser.name,
      };
      // transform the mock proxy recorded requests into Cypress route format
      const toPersist = expectations.map(expectation =>
        transformRecordedData(expectation, toSanitize),
      );

      const toPersistString = sanitizeString(JSON.stringify(toPersist, null, 2), toSanitize);

      await fs.writeFile(filename, toPersistString);
    } catch (e) {
      console.log(e);
    }

    await resetMockServerState();
  }

  return null;
}

module.exports = {
  transformRecordedData,
  setupGitHub,
  teardownGitHub,
  setupGitHubTest,
  teardownGitHubTest,
};
