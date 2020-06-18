const { Gitlab } = require('gitlab');
const fs = require('fs-extra');
const path = require('path');
const { updateConfig } = require('../utils/config');
const { escapeRegExp } = require('../utils/regexp');
const {
  getExpectationsFilename,
  transformRecordedData: transformData,
  getGitClient,
} = require('./common');
const { merge } = require('lodash');
const { retrieveRecordedExpectations, resetMockServerState } = require('../utils/mock-server');

const GITLAB_REPO_OWNER_SANITIZED_VALUE = 'owner';
const GITLAB_REPO_NAME_SANITIZED_VALUE = 'repo';
const GITLAB_REPO_TOKEN_SANITIZED_VALUE = 'fakeToken';

const FAKE_OWNER_USER = {
  id: 1,
  name: 'owner',
  username: 'owner',
  avatar_url: 'https://avatars1.githubusercontent.com/u/7892489?v=4',
  email: 'owner@email.com',
  login: 'owner',
};

function getGitLabClient(token) {
  const client = new Gitlab({
    token,
  });

  return client;
}

function getEnvs() {
  const {
    GITLAB_REPO_OWNER: owner,
    GITLAB_REPO_NAME: repo,
    GITLAB_REPO_TOKEN: token,
  } = process.env;
  if (!owner || !repo || !token) {
    throw new Error(
      'Please set GITLAB_REPO_OWNER, GITLAB_REPO_NAME, GITLAB_REPO_TOKEN environment variables',
    );
  }
  return { owner, repo, token };
}

async function prepareTestGitLabRepo() {
  const { owner, repo, token } = getEnvs();

  // postfix a random string to avoid collisions
  const postfix = Math.random()
    .toString(32)
    .substring(2);
  const testRepoName = `${repo}-${Date.now()}-${postfix}`;

  const client = getGitLabClient(token);

  console.log('Creating repository', testRepoName);
  await client.Projects.create({
    name: testRepoName,
    lfs_enabled: false,
  });

  const tempDir = path.join('.temp', testRepoName);
  await fs.remove(tempDir);
  let git = getGitClient();

  const repoUrl = `git@gitlab.com:${owner}/${repo}.git`;

  console.log('Cloning repository', repoUrl);
  await git.clone(repoUrl, tempDir);
  git = getGitClient(tempDir);

  console.log('Pushing to new repository', testRepoName);

  await git.removeRemote('origin');
  await git.addRemote('origin', `https://oauth2:${token}@gitlab.com/${owner}/${testRepoName}`);
  await git.push(['-u', 'origin', 'master']);

  await client.ProtectedBranches.unprotect(`${owner}/${testRepoName}`, 'master');

  return { owner, repo: testRepoName, tempDir };
}

async function getAuthenticatedUser(token) {
  const client = getGitLabClient(token);
  const user = await client.Users.current();
  return { ...user, token, backendName: 'gitlab' };
}

async function getUser() {
  const { token } = getEnvs();
  return getAuthenticatedUser(token);
}

async function deleteRepositories({ owner, repo, tempDir }) {
  const { token } = getEnvs();

  const errorHandler = e => {
    if (e.status !== 404) {
      throw e;
    }
  };

  console.log('Deleting repository', `${owner}/${repo}`);
  await fs.remove(tempDir);

  const client = getGitLabClient(token);
  await client.Projects.remove(`${owner}/${repo}`).catch(errorHandler);
}

async function resetOriginRepo({ owner, repo, tempDir }) {
  console.log('Resetting origin repo:', `${owner}/${repo}`);

  const { token } = getEnvs();
  const client = getGitLabClient(token);

  const projectId = `${owner}/${repo}`;
  const mergeRequests = await client.MergeRequests.all({
    projectId,
    state: 'opened',
  });
  const ids = mergeRequests.map(mr => mr.iid);
  console.log('Closing merge requests:', ids);
  await Promise.all(
    ids.map(id => client.MergeRequests.edit(projectId, id, { state_event: 'close' })),
  );
  const branches = await client.Branches.all(projectId);
  const toDelete = branches.filter(b => b.name !== 'master').map(b => b.name);

  console.log('Deleting branches', toDelete);
  await Promise.all(toDelete.map(branch => client.Branches.remove(projectId, branch)));

  console.log('Resetting master');
  const git = getGitClient(tempDir);
  await git.push(['--force', 'origin', 'master']);
  console.log('Done resetting origin repo:', `${owner}/${repo}`);
}

async function resetRepositories({ owner, repo, tempDir }) {
  await resetOriginRepo({ owner, repo, tempDir });
}

async function setupGitLab(options) {
  if (process.env.RECORD_FIXTURES) {
    console.log('Running tests in "record" mode - live data with be used!');
    const [user, repoData] = await Promise.all([getUser(), prepareTestGitLabRepo()]);

    await updateConfig(config => {
      merge(config, options, {
        backend: {
          repo: `${repoData.owner}/${repoData.repo}`,
        },
      });
    });

    return { ...repoData, user, mockResponses: false };
  } else {
    console.log('Running tests in "playback" mode - local data with be used');

    await updateConfig(config => {
      merge(config, options, {
        backend: {
          repo: `${GITLAB_REPO_OWNER_SANITIZED_VALUE}/${GITLAB_REPO_NAME_SANITIZED_VALUE}`,
        },
      });
    });

    return {
      owner: GITLAB_REPO_OWNER_SANITIZED_VALUE,
      repo: GITLAB_REPO_NAME_SANITIZED_VALUE,
      user: { ...FAKE_OWNER_USER, token: GITLAB_REPO_TOKEN_SANITIZED_VALUE, backendName: 'gitlab' },

      mockResponses: true,
    };
  }
}

async function teardownGitLab(taskData) {
  if (process.env.RECORD_FIXTURES) {
    await deleteRepositories(taskData);
  }

  return null;
}

async function setupGitLabTest(taskData) {
  if (process.env.RECORD_FIXTURES) {
    await resetRepositories(taskData);
    await resetMockServerState();
  }

  return null;
}

const sanitizeString = (str, { owner, repo, token, ownerName }) => {
  let replaced = str
    .replace(new RegExp(escapeRegExp(owner), 'g'), GITLAB_REPO_OWNER_SANITIZED_VALUE)
    .replace(new RegExp(escapeRegExp(repo), 'g'), GITLAB_REPO_NAME_SANITIZED_VALUE)
    .replace(new RegExp(escapeRegExp(token), 'g'), GITLAB_REPO_TOKEN_SANITIZED_VALUE)
    .replace(
      new RegExp('https://secure.gravatar.+?/u/.+?v=\\d', 'g'),
      `${FAKE_OWNER_USER.avatar_url}`,
    );

  if (ownerName) {
    replaced = replaced.replace(new RegExp(escapeRegExp(ownerName), 'g'), FAKE_OWNER_USER.name);
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
      body = sanitizeString(httpRequest.body.string, toSanitize);
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
      httpRequest.path === '/api/v4/user' &&
      httpRequest.headers.Host.includes('gitlab.com')
    ) {
      responseBody = JSON.stringify(FAKE_OWNER_USER);
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

async function teardownGitLabTest(taskData, { transformRecordedData } = defaultOptions) {
  if (process.env.RECORD_FIXTURES) {
    await resetRepositories(taskData);

    try {
      const filename = getExpectationsFilename(taskData);

      console.log('Persisting recorded data for test:', path.basename(filename));

      const { owner, token } = getEnvs();

      const expectations = await retrieveRecordedExpectations();

      const toSanitize = {
        owner,
        repo: taskData.repo,
        token,
        ownerName: taskData.user.name,
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
  setupGitLab,
  teardownGitLab,
  setupGitLabTest,
  teardownGitLabTest,
};
