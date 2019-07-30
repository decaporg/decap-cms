const Octokit = require('@octokit/rest');
const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git/promise');

const GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no';

function getGitHubClient() {
  const { token } = getEnvs();

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
  } = process.env;
  if (!owner || !repo || !token) {
    throw new Error(
      'Please set GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_REPO_TOKEN environment variables',
    );
  }
  return { owner, repo, token };
}

async function prepareTestGitHubRepo() {
  const { owner, repo, token } = getEnvs();

  const testRepoName = `${repo}-${Date.now()}`;

  const client = getGitHubClient();

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

async function getUser() {
  const { token } = getEnvs();
  const client = getGitHubClient();
  const { data: user } = await client.users.getAuthenticated();
  return { ...user, token, backendName: 'github' };
}

async function deleteRepository({ owner, repo, tempDir }) {
  console.log('Deleting repository', repo);
  const client = getGitHubClient();
  await client.repos.delete({
    owner,
    repo,
  });
  await fs.remove(tempDir);
}

async function resetRepository({ owner, repo, tempDir }) {
  const client = getGitHubClient();

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

  const refs = prs.map(pr => `heads/${pr.head.ref}`);

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
}

module.exports = { prepareTestGitHubRepo, deleteRepository, getUser, resetRepository };
