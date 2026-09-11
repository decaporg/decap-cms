import s3 from '../index';

const mockRender = jest.fn();
const mockUnmount = jest.fn();

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: mockRender,
    unmount: mockUnmount,
  })),
}));

jest.mock('../components/S3Widget', () => ({
  __esModule: true,
  default: () => null,
}));

function getRenderedWidgetProps() {
  expect(mockRender).toHaveBeenCalledTimes(1);
  const renderedElement = mockRender.mock.calls[0][0];
  return renderedElement.props;
}

describe('s3 exports', () => {
  it('exports an object with expected properties', () => {
    expect(s3).toMatchInlineSnapshot(`
Object {
  "init": [Function],
  "name": "s3",
}
`);
  });
});

describe('s3 media library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('configuration', () => {
    it('throws when public_url_prefix is missing', async () => {
      await expect(s3.init()).rejects.toThrow(
        'public_url_prefix is required in media_library config',
      );
    });
  });

  describe('show method', () => {
    it('renders widget with default single-select behavior', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show();

      const props = getRenderedWidgetProps();
      expect(props.allowMultiple).toBe(false);
      expect(props.imagesOnly).toBe(false);
      expect(props.config).toEqual({ public_url_prefix: 'https://cdn.example.test' });
    });

    it('disables multi-select by default even when allowMultiple is true', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show({ allowMultiple: true });

      const props = getRenderedWidgetProps();
      expect(props.allowMultiple).toBe(false);
    });

    it('enables multi-select only when multiple:true is configured', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show({ allowMultiple: true, config: { multiple: true } });

      const props = getRenderedWidgetProps();
      expect(props.allowMultiple).toBe(true);
    });

    it('keeps multi-select disabled when field disallows it', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test', multiple: true } },
      });

      integration.show({ allowMultiple: false, config: { multiple: true } });

      const props = getRenderedWidgetProps();
      expect(props.allowMultiple).toBe(false);
    });

    it('does not re-render when already open', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show();
      integration.show();

      expect(mockRender).toHaveBeenCalledTimes(1);
    });
  });

  describe('hide method', () => {
    it('unmounts widget and clears container', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show();
      expect(document.body.children).toHaveLength(1);

      integration.hide();

      expect(mockUnmount).toHaveBeenCalledTimes(1);
      expect(document.body.children).toHaveLength(0);
    });
  });

  describe('enableStandalone method', () => {
    it('returns true', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      expect(integration.enableStandalone()).toBe(true);
    });
  });
});

describe('request context resolution', () => {
  const ACCESS_TOKEN = 'access-token-abc';
  const REFRESH_TOKEN = 'refresh-token-must-never-leave-core';

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    window.localStorage.clear();
    delete window.CMS_CONFIG;
  });

  async function resolveWith({ getMediaLibraryContext } = {}) {
    const integration = await s3.init({
      options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      getMediaLibraryContext,
    });

    integration.show();

    return getRenderedWidgetProps().resolveRequestContext();
  }

  it('takes the access token from context.token alone, with no user present', async () => {
    const context = await resolveWith({
      getMediaLibraryContext: async () => ({
        backendName: 'turbo-github',
        backendConfig: { base_url: 'https://edge.example.test', turbo_site_id: 'site-1' },
        token: ACCESS_TOKEN,
        activeSiteId: 'site-1',
      }),
    });

    expect(context).toEqual({
      accessToken: ACCESS_TOKEN,
      activeSiteId: 'site-1',
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
    });
  });

  it('ignores credentials attached to the context user', async () => {
    const context = await resolveWith({
      getMediaLibraryContext: async () => ({
        backendConfig: { base_url: 'https://edge.example.test', turbo_site_id: 'site-1' },
        // Neither the picked user shape nor the `authUser` an older core still
        // sends may be used as a credential source — `context.token` is the
        // only token this library accepts.
        user: { access_token: 'from-user', refresh_token: REFRESH_TOKEN },
        authUser: { access_token: 'from-auth-user', token: 'from-auth-user' },
      }),
    });

    expect(context.accessToken).toBeNull();
  });

  // Older-core path: `getMediaLibraryContext` did not exist, so the token has
  // to come from where Decap persists the session.
  it('falls back to localStorage when getMediaLibraryContext is undefined', async () => {
    window.CMS_CONFIG = {
      backend: { base_url: 'https://edge.example.test', turbo_site_id: 'site-1' },
    };
    window.localStorage.setItem(
      'decap-cms-user',
      JSON.stringify({ access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN }),
    );

    const context = await resolveWith();

    expect(context).toEqual({
      accessToken: ACCESS_TOKEN,
      activeSiteId: 'site-1',
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
    });
  });
});
