const fetch = require('node-fetch');
const {
  getGitClient,
  transformRecordedData,
  setupGitHub,
  teardownGitHub,
  setupGitHubTest,
  teardownGitHubTest,
} = require('./github');

function getEnvs() {
  const {
    NETLIFY_API_TOKEN: netlifyApiToken,
    GITHUB_REPO_TOKEN: githubToken,
    NETLIFY_INSTALLATION_ID: installationId,
  } = process.env;
  if (!netlifyApiToken) {
    throw new Error(
      'Please set NETLIFY_API_TOKEN, GITHUB_REPO_TOKEN, NETLIFY_INSTALLATION_ID  environment variables',
    );
  }
  return { netlifyApiToken, githubToken, installationId };
}

const apiRoot = 'https://api.netlify.com/api/v1/';

async function get(netlifyApiToken, path) {
  const response = await fetch(`${apiRoot}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${netlifyApiToken}`,
    },
  }).then(res => res.json());

  return response;
}

async function post(netlifyApiToken, path, payload) {
  const response = await fetch(`${apiRoot}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${netlifyApiToken}`,
    },
    body: JSON.stringify(payload),
  }).then(res => res.json());

  return response;
}

async function del(netlifyApiToken, path) {
  const response = await fetch(`${apiRoot}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${netlifyApiToken}`,
    },
  }).then(res => res.text());

  return response;
}

async function createSite(netlifyApiToken, payload) {
  return post(netlifyApiToken, 'sites', payload);
}

async function enableIdentity(netlifyApiToken, siteId) {
  return post(netlifyApiToken, `sites/${siteId}/identity`, {});
}

async function enableGitGateway(netlifyApiToken, siteId, githubToken, repo) {
  return post(netlifyApiToken, `sites/${siteId}/services/git/instances`, {
    github: {
      repo,
      access_token: githubToken,
    },
  });
}

async function enableLargeMedia(netlifyApiToken, siteId) {
  return post(netlifyApiToken, `sites/${siteId}/services/large-media/instances`, {});
}

async function waitForDeploys(netlifyApiToken, siteId) {
  for (let i = 0; i < 10; i++) {
    const deploys = await get(netlifyApiToken, `sites/${siteId}/deploys`);
    if (deploys.some(deploy => deploy.state === 'ready')) {
      console.log('Deploy finished for site:', siteId);
      return;
    }
    console.log('Waiting on deploy of site:', siteId);
    await new Promise(resolve => setTimeout(resolve, 30 * 1000));
  }
  console.log('Timed out waiting on deploy of site:', siteId);
}

async function createUser(netlifyApiToken, siteUrl, email, password) {
  const response = await fetch(`${siteUrl}/.netlify/functions/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${netlifyApiToken}`,
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    console.log('User created successfully');
  } else {
    throw new Error('Failed to create user');
  }
}

const netlifySiteURL = 'https://fake-site-url.netlify.com/';
const email = 'netlifyCMS@netlify.com';
const password = '12345678';
const backendName = 'git-gateway';

async function setupGitGateway(options) {
  const result = await setupGitHub(options);

  if (process.env.RECORD_FIXTURES) {
    const { netlifyApiToken, githubToken, installationId } = getEnvs();

    console.log('Creating Netlify Site');
    const { site_id, ssl_url } = await createSite(netlifyApiToken, {
      repo: {
        provider: 'github',
        installation_id: installationId,
        repo: `${result.owner}/${result.repo}`,
      },
    });

    console.log('Enabling identity for site:', site_id);
    await enableIdentity(netlifyApiToken, site_id);

    console.log('Enabling git gateway for site:', site_id);
    await enableGitGateway(netlifyApiToken, site_id, githubToken, `${result.owner}/${result.repo}`);

    console.log('Enabling large media for site:', site_id);
    await enableLargeMedia(netlifyApiToken, site_id);

    const git = getGitClient(result.tempDir);
    await git.raw([
      'config',
      '-f',
      '.lfsconfig',
      'lfs.url',
      `https://${site_id}.netlify.com/.netlify/large-media`,
    ]);
    await git.addConfig('commit.gpgsign', 'false');
    await git.add('.lfsconfig');
    await git.commit('add .lfsconfig');
    await git.push('origin', 'master');

    await waitForDeploys(netlifyApiToken, site_id);
    console.log('Creating user for site:', site_id, 'with email:', email);

    try {
      await createUser(netlifyApiToken, ssl_url, email, password);
    } catch (e) {
      console.log(e);
    }

    return {
      ...result,
      user: {
        ...result.user,
        backendName,
        netlifySiteURL: ssl_url,
        email,
        password,
      },
      site_id,
      ssl_url,
    };
  } else {
    return {
      ...result,
      user: {
        ...result.user,
        backendName,
        netlifySiteURL,
        email,
        password,
      },
    };
  }
}

async function teardownGitGateway(taskData) {
  if (process.env.RECORD_FIXTURES) {
    const { netlifyApiToken } = getEnvs();
    const { site_id } = taskData;
    console.log('Deleting Netlify site:', site_id);
    await del(netlifyApiToken, `sites/${site_id}`);

    const result = await teardownGitHub(taskData);
    return result;
  }

  return null;
}

async function setupGitGatewayTest(taskData) {
  if (process.env.RECORD_FIXTURES) {
    const result = await setupGitHubTest(taskData);
    return result;
  }

  return null;
}

async function teardownGitGatewayTest(taskData) {
  if (process.env.RECORD_FIXTURES) {
    const options = {
      transformRecordedData: (expectation, toSanitize) => {
        const result = transformRecordedData(expectation, toSanitize);

        const { httpRequest, httpResponse } = expectation;

        if (
          httpResponse.body &&
          httpResponse.body.string &&
          httpRequest.path === '/.netlify/identity/token'
        ) {
          let responseBody = httpResponse.body.string;
          const parsed = JSON.parse(responseBody);
          parsed.access_token = 'access_token';
          parsed.refresh_token = 'refresh_token';
          responseBody = JSON.stringify(parsed);
          return { ...result, response: responseBody };
        } else {
          return result;
        }
      },
    };
    const result = await teardownGitHubTest(taskData, options);
    return result;
  }

  return null;
}

module.exports = {
  setupGitGateway,
  teardownGitGateway,
  setupGitGatewayTest,
  teardownGitGatewayTest,
};
