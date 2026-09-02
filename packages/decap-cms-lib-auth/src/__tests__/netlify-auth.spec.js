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
});
