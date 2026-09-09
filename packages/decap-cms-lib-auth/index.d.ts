declare module 'decap-cms-lib-auth' {
  class NetlifyAuthenticator {
    constructor(config = {});

    // src/netlify-auth.js: refresh(options, cb)
    refresh: (
      args: { provider: string; refresh_token: string },
      cb?: (error: Error | null, data?: unknown) => void,
    ) => Promise<{ token: string; refresh_token: string }>;
  }

  class PkceAuthenticator {
    constructor(config = {});

    refresh: (args: { refresh_token: string }) => Promise<{ token: string; refresh_token: string }>;
  }

  export { NetlifyAuthenticator, PkceAuthenticator };
}
