import GitGateway from '../implementation';
import GitHubAPI from '../GitHubAPI';

describe('git gateway implementation authentication', () => {
  const config = {
    backend: {
      name: 'git-gateway',
      auth_type: 'pkce',
      gateway_url: '/.netlify/git/github',
    },
    media_folder: 'static/images',
  };

  const pkceCredentials = {
    token: 'pkce-token',
    email: 'user@example.com',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.png',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(GitHubAPI.prototype, 'hasWriteAccess').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('restores a PKCE login from the serialized authenticated user', async () => {
    const gateway = new GitGateway(config);
    const authenticatedUser = await gateway.authenticate(pkceCredentials);

    expect(authenticatedUser).toEqual({
      name: 'Test User',
      login: 'user@example.com',
      email: 'user@example.com',
      avatar_url: 'https://example.com/avatar.png',
      token: 'pkce-token',
      user_metadata: pkceCredentials.user_metadata,
    });

    const storedUser = JSON.parse(
      JSON.stringify({ ...authenticatedUser, backendName: 'git-gateway' }),
    );
    const restoredGateway = new GitGateway(config);
    const getAuthClient = jest.spyOn(restoredGateway, 'getAuthClient');

    await expect(restoredGateway.restoreUser(storedUser)).resolves.toEqual(authenticatedUser);
    await expect(restoredGateway.getToken()).resolves.toBe('pkce-token');
    expect(getAuthClient).not.toHaveBeenCalled();
    expect(GitHubAPI.prototype.hasWriteAccess).toHaveBeenCalledTimes(2);
  });

  it('falls back to the GoTrue session when the stored user has no token', async () => {
    const gateway = new GitGateway({
      ...config,
      backend: { ...config.backend, auth_type: 'netlify' },
    });
    const gotrueUser = {
      jwt: jest.fn().mockResolvedValue('gotrue-token'),
      email: 'user@example.com',
      user_metadata: pkceCredentials.user_metadata,
    };
    const currentUser = jest.fn().mockReturnValue(gotrueUser);
    jest.spyOn(gateway, 'getAuthClient').mockResolvedValue({ currentUser });

    await expect(gateway.restoreUser({ name: 'Test User' })).resolves.toEqual({
      name: 'Test User',
      login: 'user@example.com',
      email: 'user@example.com',
      avatar_url: 'https://example.com/avatar.png',
    });

    expect(currentUser).toHaveBeenCalledTimes(1);
    expect(gotrueUser.jwt).toHaveBeenCalledTimes(1);
  });
});
