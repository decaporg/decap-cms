import { sessionIdOf, withRefreshLock } from '../sessionSync';

describe('withRefreshLock', () => {
  const originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks');

  function stubLocks(request: jest.Mock) {
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true });
  }

  afterEach(() => {
    if (originalLocks) {
      Object.defineProperty(navigator, 'locks', originalLocks);
    } else {
      delete (navigator as unknown as Record<string, unknown>).locks;
    }
  });

  it('runs the refresh under the lock every tab on the origin shares', async () => {
    const request = jest.fn((_name, _options, callback) => callback());
    stubLocks(request);

    await expect(withRefreshLock(async () => 'token')).resolves.toBe('token');

    expect(request).toHaveBeenCalledWith(
      'decap-turbo-session-refresh',
      expect.any(Object),
      expect.any(Function),
    );
  });

  it('refreshes anyway when the lock is never granted, so a hung tab cannot block the rest', async () => {
    const abort = Object.assign(new Error('timed out'), { name: 'AbortError' });
    stubLocks(jest.fn().mockRejectedValue(abort));
    const refresh = jest.fn().mockResolvedValue('token');

    await expect(withRefreshLock(refresh)).resolves.toBe('token');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not run a refresh twice when it ran under the lock and failed', async () => {
    stubLocks(jest.fn((_name, _options, callback) => callback()));
    const refresh = jest.fn().mockRejectedValue(new Error('refresh_token_not_found'));

    await expect(withRefreshLock(refresh)).rejects.toThrow('refresh_token_not_found');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('runs unguarded where the Web Locks API does not exist', async () => {
    Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true });

    await expect(withRefreshLock(async () => 'token')).resolves.toBe('token');
  });
});

describe('sessionIdOf', () => {
  it('reads the session_id claim of an access token', () => {
    const payload = btoa(JSON.stringify({ session_id: 'session-1' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(sessionIdOf(`header.${payload}.signature`)).toBe('session-1');
  });

  it('returns null for a missing or unreadable token', () => {
    expect(sessionIdOf(null)).toBeNull();
    expect(sessionIdOf('not-a-jwt')).toBeNull();
    expect(sessionIdOf('header.!!!.signature')).toBeNull();
  });
});
