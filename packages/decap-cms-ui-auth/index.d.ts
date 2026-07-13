declare module 'decap-cms-ui-auth' {
  import React from 'react';

  import type { Implementation } from 'decap-cms-lib-util/src';

  class PKCEAuthenticationPage extends React.Component {
    constructor({ backend }: { backend: Implementation });
    handleLogin(e: ChangeEvent<HTMLInputElement>): void;
  }
  class NetlifyAuthenticationPage extends React.Component {
    handleLogin(e: ChangeEvent<HTMLInputElement>): void;
    static authClient: () => Promise;
  }

  export { PKCEAuthenticationPage, NetlifyAuthenticationPage };
}
