import GitHubBackend from '../github/implementation';
import AuthenticationPage from './AuthenticationPage';

export default class NetlifyAuth extends GitHubBackend {
  constructor(config) {
    super(config);
    if (config.getIn(['backend', 'api_url']) == null) {
      throw new Error('The NetlifyAuth backend needs an "api_url" in the backend configuration.');
    }
    this.api_url = config.getIn(['backend', 'api_url']);
  }

  authComponent() {
    return AuthenticationPage;
  }


}
