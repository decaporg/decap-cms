const Octokit = require('@octokit/rest');
const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git/promise');

const GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no';

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
  let git = simpleGit().env({ ...process.env, GIT_SSH_COMMAND });

  const repoUrl = `git@github.com:${owner}/${repo}.git`;

  console.log('Cloning repository', repoUrl);
  await git.clone(repoUrl, tempDir);
  git = simpleGit(tempDir).env({ ...process.env, GIT_SSH_COMMAND });

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
  console.log('Resetting origin repo:', `${owner}/repo`);
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
  const git = simpleGit(tempDir).env({ ...process.env, GIT_SSH_COMMAND });
  await git.push(['--force', 'origin', 'master']);
  console.log('Done resetting origin repo:', `${owner}/repo`);
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
    console.log('Done resetting forked repo:', `${forkOwner}/repo`);
  }
}

async function resetRepositories({ owner, repo, tempDir }) {
  await resetOriginRepo({ owner, repo, tempDir });
  await resetForkedRepo({ repo });
}

module.exports = {
  prepareTestGitHubRepo,
  deleteRepositories,
  getUser,
  getForkUser,
  resetRepositories,
};
