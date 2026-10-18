jest.mock('../redux', () => ({
  store: {
    getState: jest.fn(),
    subscribe: jest.fn(),
    dispatch: jest.fn(),
  },
}));

jest.mock('../backend', () => ({
  currentBackend: jest.fn(),
}));

import { getMediaLibraryContext } from '../mediaLibrary';
import { store } from '../redux';
import { currentBackend } from '../backend';

const REFRESH_TOKEN = 'refresh-token-must-never-leave-core';
const ACCESS_TOKEN = 'access-token-abc';

// Walks the whole returned object — keys, values, nested objects and arrays —
// looking for the literal refresh token. Deliberately value-based rather than
// key-based: a key-name check (`expect(context.authUser).toBeUndefined()`)
// would keep passing if the field were ever renamed or nested.
function collectStrings(value, found = []) {
  if (typeof value === 'string') {
    found.push(value);
  } else if (Array.isArray(value)) {
    value.forEach(item => collectStrings(item, found));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      found.push(key);
      collectStrings(item, found);
    });
  }
  return found;
}

function mockState({ user, backend } = {}) {
  store.getState.mockReturnValue({
    config: { backend },
    auth: { user },
  });
}

describe('getMediaLibraryContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentBackend.mockReturnValue({ getToken: jest.fn(async () => ACCESS_TOKEN) });
  });

  it('never exposes the refresh token to a registered media library', async () => {
    mockState({
      backend: { name: 'turbo-github', base_url: 'https://edge.example.test' },
      user: {
        name: 'Ada',
        login: 'ada',
        email: 'ada@example.test',
        avatar_url: 'https://example.test/ada.png',
        token: ACCESS_TOKEN,
        access_token: ACCESS_TOKEN,
        refresh_token: REFRESH_TOKEN,
        expires_at: 1893456000,
      },
    });

    const context = await getMediaLibraryContext();

    expect(collectStrings(context)).not.toContain(REFRESH_TOKEN);
  });

  it('passes a picked, token-free user shape', async () => {
    mockState({
      backend: { name: 'turbo-github' },
      user: {
        id: 'user-1',
        name: 'Ada',
        login: 'ada',
        email: 'ada@example.test',
        avatar_url: 'https://example.test/ada.png',
        access_token: ACCESS_TOKEN,
        refresh_token: REFRESH_TOKEN,
        expires_at: 1893456000,
        user_metadata: { active_site_id: 'site-1' },
      },
    });

    const context = await getMediaLibraryContext();

    expect(context.user).toEqual({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.test',
      avatarUrl: 'https://example.test/ada.png',
    });
  });

  it('still passes the access token and the backend config', async () => {
    mockState({
      backend: {
        name: 'turbo-github',
        base_url: 'https://edge.example.test',
        turbo_site_id: 'site-1',
        supabase_anon_key: 'public-anon-key',
      },
      user: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN },
    });

    const context = await getMediaLibraryContext();

    expect(context.token).toBe(ACCESS_TOKEN);
    expect(context.backendName).toBe('turbo-github');
    expect(context.activeSiteId).toBe('site-1');
    // Passed whole on purpose: this is the publicly served `config.yml` block.
    expect(context.backendConfig.base_url).toBe('https://edge.example.test');
    expect(context.backendConfig.supabase_anon_key).toBe('public-anon-key');
  });

  it('omits the user entirely when nobody is authenticated', async () => {
    mockState({ backend: { name: 'turbo-github' } });

    const context = await getMediaLibraryContext();

    expect(context.user).toBeUndefined();
  });
});
