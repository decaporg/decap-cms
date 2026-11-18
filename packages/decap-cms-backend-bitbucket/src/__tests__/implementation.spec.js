import BitbucketBackend from '../implementation';

const BITBUCKET = 'https://api.bitbucket.org/2.0';

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

describe('bitbucket backend implementation', () => {
  const config = {
    backend: { repo: 'owner/repo', branch: 'main' },
    base_url: 'https://api.netlify.com',
    site_id: 'site-id',
    media_folder: 'static/media',
  };

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
