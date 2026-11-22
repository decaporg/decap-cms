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

const baseConfig = {
  base_url: 'https://api.netlify.com',
  site_id: 'site-id',
  media_folder: 'static/media',
};

describe('bitbucket backend implementation', () => {
  const config = { ...baseConfig, backend: { repo: 'owner/repo', branch: 'main' } };

  describe('default branch', () => {
    // No branch configured, so authenticate reads the repository's main branch
    const noBranchConfig = { ...baseConfig, backend: { repo: 'owner/repo' } };

    it('reads the default branch of a private repository with the user token', async () => {
      mockBitbucket({ validToken: 'TOKEN' });
      const backend = new BitbucketBackend(noBranchConfig);

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
      const backend = new BitbucketBackend(noBranchConfig);
      backend.authenticator = { refresh };

      const user = await backend.authenticate({
        token: 'EXPIRED_TOKEN',
        refresh_token: 'REFRESH_TOKEN',
      });

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledWith({
        provider: 'bitbucket',
        refresh_token: 'REFRESH_TOKEN',
      });
      expect(backend.branch).toBe('main');
      expect(backend.api.branch).toBe('main');
      // The returned user is stored by core, so it must carry the refreshed credentials
      expect(user).toEqual(
        expect.objectContaining({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' }),
      );
    });
  });

  describe('token refresh', () => {
    let backend;
    let refresh;
    let updateUserCredentials;

    beforeEach(() => {
      global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));
      updateUserCredentials = jest.fn();
      refresh = jest.fn();

      backend = new BitbucketBackend(config, { updateUserCredentials });
      backend.token = 'EXPIRED_TOKEN';
      backend.refreshToken = 'REFRESH_TOKEN';
      backend.authenticator = { refresh };
    });

    it('shares an in-flight refresh and permits a later refresh with the rotated token', async () => {
      let resolveRefresh;
      refresh
        .mockImplementationOnce(
          () =>
            new Promise(resolve => {
              resolveRefresh = resolve;
            }),
        )
        .mockResolvedValue({ token: 'NEXT_TOKEN', refresh_token: 'NEXT_REFRESH_TOKEN' });

      const firstRefresh = backend.getRefreshedAccessToken();
      const concurrentRefresh = backend.getRefreshedAccessToken();
      const pendingToken = backend.getToken();

      expect(concurrentRefresh).toBe(firstRefresh);
      expect(pendingToken).toBe(firstRefresh);
      expect(refresh).toHaveBeenCalledTimes(1);

      resolveRefresh({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' });
      await expect(Promise.all([firstRefresh, concurrentRefresh, pendingToken])).resolves.toEqual([
        'NEW_TOKEN',
        'NEW_TOKEN',
        'NEW_TOKEN',
      ]);
      expect(updateUserCredentials).toHaveBeenLastCalledWith({
        token: 'NEW_TOKEN',
        refresh_token: 'NEW_REFRESH_TOKEN',
      });

      await expect(backend.getRefreshedAccessToken()).resolves.toBe('NEXT_TOKEN');
      expect(refresh).toHaveBeenCalledTimes(2);
      expect(refresh).toHaveBeenLastCalledWith({
        provider: 'bitbucket',
        refresh_token: 'NEW_REFRESH_TOKEN',
      });
    });

    it('recovers a later API request after the token refresh temporarily fails', async () => {
      const refreshError = new Error('Temporary token endpoint failure');
      refresh
        .mockRejectedValueOnce(refreshError)
        .mockResolvedValue({ token: 'NEW_TOKEN', refresh_token: 'NEW_REFRESH_TOKEN' });
      global.fetch.mockImplementation((_url, { headers }) =>
        Promise.resolve(
          headers.Authorization === 'Bearer NEW_TOKEN'
            ? jsonResponse({ username: 'user' })
            : jsonResponse(expiredTokenResponse, 401),
        ),
      );
      const req = `${BITBUCKET}/user`;

      await expect(backend.apiRequestFunction(req)).rejects.toBe(refreshError);
      expect(updateUserCredentials).not.toHaveBeenCalled();

      const response = await backend.apiRequestFunction(req);
      expect(response.status).toBe(200);
      expect(refresh).toHaveBeenCalledTimes(2);
      expect(global.fetch.mock.calls.map(([, { headers }]) => headers.Authorization)).toEqual([
        'Bearer EXPIRED_TOKEN',
        'Bearer EXPIRED_TOKEN',
        'Bearer NEW_TOKEN',
      ]);
      expect(await backend.getToken()).toBe('NEW_TOKEN');
      expect(updateUserCredentials).toHaveBeenCalledTimes(1);
      expect(updateUserCredentials).toHaveBeenCalledWith({
        token: 'NEW_TOKEN',
        refresh_token: 'NEW_REFRESH_TOKEN',
      });
    });
  });
});
