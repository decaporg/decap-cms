import NetlifyAuthenticator from '../netlify-auth';

describe('NetlifyAuthenticator', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('should send the refresh token in the request body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ token: 'new-access-token', refresh_token: 'new-refresh-token' }),
    });
    const authenticator = new NetlifyAuthenticator({
      base_url: 'https://api.example.com',
      site_id: 'cms.example.com',
    });
    const refreshToken = 'old refresh&token=secret';

    await authenticator.refresh({ provider: 'bitbucket', refresh_token: refreshToken });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/auth/refresh?provider=bitbucket&site_id=cms.example.com',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ refresh_token: refreshToken }).toString(),
      },
    );
  });

  describe('popup messages', () => {
    const success = 'authorization:github:success:{"token":"abc"}';

    it('answers the handshake from the origin of a base_url that has a path', () => {
      const authenticator = new NetlifyAuthenticator({
        base_url: 'https://auth.example.com/oauth/',
      });
      authenticator.authWindow = { postMessage: jest.fn() };
      const handler = authenticator.handshakeCallback({ provider: 'github' }, jest.fn());

      handler({ origin: 'https://auth.example.com', data: 'authorizing:github' });

      expect(authenticator.authWindow.postMessage).toHaveBeenCalledWith(
        'authorizing:github',
        'https://auth.example.com',
      );
    });

    it('accepts the token from the origin of a base_url that has a path', () => {
      const authenticator = new NetlifyAuthenticator({
        base_url: 'https://auth.example.com/oauth',
      });
      authenticator.authWindow = { close: jest.fn() };
      const cb = jest.fn();
      const handler = authenticator.authorizeCallback({ provider: 'github' }, cb);

      handler({ origin: 'https://auth.example.com', data: success });

      expect(cb).toHaveBeenCalledWith(null, { token: 'abc' });
    });

    it('ignores messages from other origins', () => {
      const authenticator = new NetlifyAuthenticator({
        base_url: 'https://auth.example.com/oauth',
      });
      authenticator.authWindow = { close: jest.fn() };
      const cb = jest.fn();
      const handler = authenticator.authorizeCallback({ provider: 'github' }, cb);

      handler({ origin: 'https://other.example.com', data: success });

      expect(cb).not.toHaveBeenCalled();
    });
  });
});
