import BitbucketBackend from '../implementation';

const BITBUCKET = 'https://api.bitbucket.org/2.0';
const REPO_URL = `${BITBUCKET}/repositories/owner/repo`;

const repoResponse = { type: 'repository', mainbranch: { name: 'main', type: 'branch' } };

const userResponse = {
  username: 'user',
  display_name: 'User',
  links: { avatar: { href: 'https://example.com/avatar.png' } },
};

// Bitbucket's answer for a repository the caller cannot see, which is what an
// anonymous request for a private repository gets.
const inaccessibleRepoResponse = {
  type: 'error',
  error: {
    message:
      'You may not have access to this repository or it no longer exists in this workspace. If you think this repository exists and you have access, make sure you are authenticated.',
  },
};

const expiredTokenResponse = {
  type: 'error',
  error: {
    message: 'Access token expired. Use your refresh token to obtain a new access token.',
  },
};

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
  };
}

// Answers like Bitbucket does: only a valid Bearer token can read the private
// repository, and any other Authorization header is treated as anonymous.
function mockBitbucket({ validToken, expiredToken }) {
  global.fetch = jest.fn((url, { headers = {} } = {}) => {
    const path = url.split('?')[0];
    const { Authorization } = headers;

    if (expiredToken && Authorization === `Bearer ${expiredToken}`) {
      return Promise.resolve(jsonResponse(expiredTokenResponse, 401));
    }
    if (path === REPO_URL) {
      return Promise.resolve(
        Authorization === `Bearer ${validToken}`
          ? jsonResponse(repoResponse)
          : jsonResponse(inaccessibleRepoResponse, 404),
      );
    }
    if (path === `${BITBUCKET}/user`) {
      return Promise.resolve(jsonResponse(userResponse));
    }
    return Promise.reject(new Error(`unexpected request to ${url}`));
  });
}

describe('bitbucket backend default branch', () => {
  const config = {
    backend: { repo: 'owner/repo' },
    base_url: 'https://api.netlify.com',
    site_id: 'site-id',
    media_folder: 'static/media',
  };

  it('reads the default branch of a private repository with the user token', async () => {
    mockBitbucket({ validToken: 'TOKEN' });
    const backend = new BitbucketBackend(config);

    await expect(
      backend.authenticate({ token: 'TOKEN', refresh_token: 'REFRESH_TOKEN' }),
    ).resolves.toEqual(expect.objectContaining({ login: 'user' }));

    expect(backend.branch).toBe('main');
    expect(backend.api.branch).toBe('main');
  });

  it('refreshes an expired token before reading the default branch', async () => {
    mockBitbucket({ validToken: 'NEW_TOKEN', expiredToken: 'EXPIRED_TOKEN' });
    const refresh = jest
      .fn()
      .mockResolvedValue({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' });
    const backend = new BitbucketBackend(config);
    backend.authenticator = { refresh };

    await backend.authenticate({ token: 'EXPIRED_TOKEN', refresh_token: 'REFRESH_TOKEN' });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith({ provider: 'bitbucket', refresh_token: 'REFRESH_TOKEN' });
    expect(backend.branch).toBe('main');
    expect(backend.api.branch).toBe('main');
  });

  it('reports a missing repository instead of failing on the response', async () => {
    mockBitbucket({ validToken: 'ANOTHER_TOKEN' });
    const backend = new BitbucketBackend(config);

    await expect(
      backend.authenticate({ token: 'TOKEN', refresh_token: 'REFRESH_TOKEN' }),
    ).rejects.toThrow('Repo "owner/repo" not found.');

    expect(backend.branch).toBe('master');
  });

  it('does not look up the default branch when a branch is configured', async () => {
    mockBitbucket({ validToken: 'TOKEN' });
    const backend = new BitbucketBackend({
      ...config,
      backend: { ...config.backend, branch: 'develop' },
    });

    await backend.authenticate({ token: 'TOKEN', refresh_token: 'REFRESH_TOKEN' });

    expect(backend.branch).toBe('develop');
    expect(backend.api.branch).toBe('develop');
  });
});
