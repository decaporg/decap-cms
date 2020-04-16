declare module 'netlify-cms-lib-auth' {
  class NetlifyAuthenticator {
    constructor(config = {});

    refresh: (args: {
      provider: string;
      refresh_token: string;
    }) => Promise<{ token: string; refresh_token: string }>;
  }
  export { NetlifyAuthenticator };
}
