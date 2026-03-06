const fetch = require('node-fetch');

const {
  transformRecordedData: transformGitHub,
  setupGitHub,
  teardownGitHub,
  setupGitHubTest,
  teardownGitHubTest,
} = require('./github');
const {
  transformRecordedData: transformGitLab,
  setupGitLab,
  teardownGitLab,
  setupGitLabTest,
  teardownGitLabTest,
} = require('./gitlab');
const { getGitClient } = require('./common');

function getEnvs() {
  const {
    NETLIFY_API_TOKEN: netlifyApiToken,
    GITHUB_REPO_TOKEN: githubToken,
    GITLAB_REPO_TOKEN: gitlabToken,
    NETLIFY_INSTALLATION_ID: installationId,
  } = process.env;
  if (!netlifyApiToken) {
    throw new Error(
      'Please set NETLIFY_API_TOKEN, GITHUB_REPO_TOKEN, GITLAB_REPO_TOKEN, NETLIFY_INSTALLATION_ID  environment variables',
    );
  }
  return { netlifyApiToken, githubToken, gitlabToken, installationId };
}

const apiRoot = 'https://api.netlify.com/api/v1/';

async function fetchWithTimeout(netlifyApiToken, path, method = 'GET', payload = null, parseAs = 'json') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const options = {
      signal: controller.signal,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${netlifyApiToken}`,
      },
    };
    
    if (payload) {
      options.body = JSON.stringify(payload);
    }
    
    const response = await fetch(`${apiRoot}${path}`, options);
    clearTimeout(timeout);
    
    return parseAs === 'json' ? response.json() : response.text();
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.error(`Netlify API ${method} timeout after 10s: ${path}`);
      throw new Error(`Netlify API ${method} request timeout: ${path}`);
    }
    throw error;
  }
}

async function createSite(netlifyApiToken, payload) {
  return fetchWithTimeout(netlifyApiToken, 'sites', 'POST', payload);
}

async function enableIdentity(netlifyApiToken, siteId) {
  return fetchWithTimeout(netlifyApiToken, `sites/${siteId}/identity`, 'POST', {});
}

async function enableGitGateway(netlifyApiToken, siteId, provider, token, repo) {
  return fetchWithTimeout(netlifyApiToken, `sites/${siteId}/services/git/instances`, 'POST', {
    [provider]: {
      repo,
      access_token: token,
    },
  });
}

async function enableLargeMedia(netlifyApiToken, siteId) {
  return fetchWithTimeout(netlifyApiToken, `sites/${siteId}/services/large-media/instances`, 'POST', {});
}

async function waitForDeploys(netlifyApiToken, siteId) {
  const maxRetries = 5;
  const retryDelayMs = 15 * 1000; // 15 seconds between retries
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const deploys = await fetchWithTimeout(netlifyApiToken, `sites/${siteId}/deploys`);
      
      if (deploys && deploys.some(deploy => deploy.state === 'ready')) {
        return;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    } catch (error) {
      console.error(`Error checking deploy status: ${error.message}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
  }
  
  throw new Error(`Timed out waiting for deploy of site ${siteId} after ${maxRetries * retryDelayMs / 1000}s`);
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
const email = 'decap@p-m.si';
const password = '12345678';
const backendName = 'git-gateway';

const methods = {
  github: {
    setup: setupGitHub,
    teardown: teardownGitHub,
    setupTest: setupGitHubTest,
    teardownTest: teardownGitHubTest,
    transformData: transformGitHub,
    createSite: (netlifyApiToken, result) => {
      const { installationId } = getEnvs();
      return createSite(netlifyApiToken, {
        repo: {
          provider: 'github',
          installation_id: installationId,
          repo: `${result.owner}/${result.repo}`,
        },
      });
    },
    token: () => getEnvs().githubToken,
  },
  gitlab: {
    setup: setupGitLab,
    teardown: teardownGitLab,
    setupTest: setupGitLabTest,
    teardownTest: teardownGitLabTest,
    transformData: transformGitLab,
    createSite: async (netlifyApiToken, result) => {
      const { id, public_key } = await fetchWithTimeout(netlifyApiToken, 'deploy_keys', 'POST');
      const { gitlabToken } = getEnvs();
      const project = `${result.owner}/${result.repo}`;
      await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(project)}/deploy_keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${gitlabToken}`,
        },
        body: JSON.stringify({ title: 'Netlify Deploy Key', key: public_key, can_push: false }),
      }).then(res => res.json());

      const site = await createSite(netlifyApiToken, {
        account_slug: result.owner,
        repo: {
          provider: 'gitlab',
          repo: `${result.owner}/${result.repo}`,
          deploy_key_id: id,
        },
      });

      await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(project)}/hooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${gitlabToken}`,
        },
        body: JSON.stringify({
          url: 'https://api.netlify.com/hooks/gitlab',
          push_events: true,
          merge_requests_events: true,
          enable_ssl_verification: true,
        }),
      }).then(res => res.json());

      return site;
    },
    token: () => getEnvs().gitlabToken,
  },
};

async function setupGitGateway(options) {
  const { provider, ...rest } = options;
  const result = await methods[provider].setup(rest);

  if (process.env.RECORD_FIXTURES) {
    const { netlifyApiToken } = getEnvs();

    console.log(`Creating Netlify Site for provider: ${provider}`);
    let site_id, ssl_url;
    try {
      ({ site_id, ssl_url } = await methods[provider].createSite(netlifyApiToken, result));
    } catch (e) {
      console.log(e);
      throw e;
    }

    console.log('Enabling identity for site:', site_id);
    await enableIdentity(netlifyApiToken, site_id);

    console.log('Enabling git gateway for site:', site_id);
    const token = methods[provider].token();
    await enableGitGateway(
      netlifyApiToken,
      site_id,
      provider,
      token,
      `${result.owner}/${result.repo}`,
    );

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
      provider,
    };
  } else {
    console.log('Running tests in "playback" mode - local data will be used');
    return {
      ...result,
      user: {
        ...result.user,
        backendName,
        netlifySiteURL,
        email,
        password,
      },
      provider,
      mockResponses: true,
    };
  }
}

async function teardownGitGateway(taskData) {
  if (process.env.RECORD_FIXTURES) {
    const { netlifyApiToken } = getEnvs();
    const { site_id } = taskData;
    console.log('Deleting Netlify site:', site_id);
    await fetchWithTimeout(netlifyApiToken, `sites/${site_id}`, 'DELETE', null, 'text');

    const result = await methods[taskData.provider].teardown(taskData);
    return result;
  }

  return null;
}

async function setupGitGatewayTest(taskData) {
  if (process.env.RECORD_FIXTURES) {
    const result = await methods[taskData.provider].setupTest(taskData);
    return result;
  }

  return null;
}

async function teardownGitGatewayTest(taskData) {
  if (process.env.RECORD_FIXTURES) {
    const options = {
      transformRecordedData: (expectation, toSanitize) => {
        const result = methods[taskData.provider].transformData(expectation, toSanitize);

        if (result.response && result.url === '/.netlify/identity/token') {
          const parsed = JSON.parse(result.response);
          parsed.access_token = 'access_token';
          parsed.refresh_token = 'refresh_token';
          return { ...result, response: JSON.stringify(parsed) };
        } else {
          return result;
        }
      },
    };
    const result = await methods[taskData.provider].teardownTest(taskData, options);
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
