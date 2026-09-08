declare module 'decap-cms-ui-auth' {
  import { Component } from 'react';

  import type { ChangeEvent } from 'react';
  import type { Implementation } from 'decap-cms-lib-util/src';

  class PKCEAuthenticationPage extends Component {
    constructor({ backend }: { backend: Implementation });
    handleLogin(e: ChangeEvent<HTMLInputElement>): void;
  }
  class NetlifyAuthenticationPage extends Component {
    handleLogin(e: ChangeEvent<HTMLInputElement>): void;
    static authClient: () => Promise;
  }

  export { PKCEAuthenticationPage, NetlifyAuthenticationPage };
}
