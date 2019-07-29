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

  await fs.remove(tempDir);

  return { owner, repo: testRepoName };
}

async function deleteRepository({ owner, repo }) {
  console.log('Deleting repository', repo);
  const client = getGitHubClient();
  await client.repos.delete({
    owner,
    repo,
  });
}

module.exports = { prepareTestGitHubRepo, deleteRepository };
