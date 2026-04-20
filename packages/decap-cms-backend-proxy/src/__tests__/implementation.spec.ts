import ProxyBackend from '../implementation';

describe('ProxyBackend', () => {
  function createConfig(proxyUrl?: string): ConstructorParameters<typeof ProxyBackend>[0] {
    return {
      backend: {
        name: 'proxy',
        proxy_url: proxyUrl,
      },
      media_folder: 'static/uploads',
    } as ConstructorParameters<typeof ProxyBackend>[0];
  }

  it('should throw if proxy_url is missing', () => {
    expect(() => new ProxyBackend(createConfig(undefined))).toThrow(
      'The Proxy backend needs a "proxy_url" in the backend configuration.',
    );
  });

  it('should allow root-relative proxy URLs', () => {
    expect(() => new ProxyBackend(createConfig('/api/v1'))).not.toThrow();
  });

  it('should allow http and https proxy URLs', () => {
    expect(() => new ProxyBackend(createConfig('http://localhost:8081/api/v1'))).not.toThrow();
    expect(() => new ProxyBackend(createConfig('https://proxy.example.com/api/v1'))).not.toThrow();
  });

  it('should reject unsafe proxy URL schemes', () => {
    expect(() => new ProxyBackend(createConfig('javascript:alert(1)'))).toThrow(
      'The Proxy backend requires an http(s) or root-relative "proxy_url".',
    );
    expect(() => new ProxyBackend(createConfig('file:///etc/passwd'))).toThrow(
      'The Proxy backend requires an http(s) or root-relative "proxy_url".',
    );
  });
});
