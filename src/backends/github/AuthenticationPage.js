import PropTypes from 'prop-types';
import React from 'react';
import Authenticator from 'Lib/netlify-auth';
import { Icon } from 'UI';

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
    base_url: PropTypes.string,
    siteId: PropTypes.string,
    authEndpoint: PropTypes.string,
  };

  state = {};

  handleLogin = (e) => {
    e.preventDefault();
    const cfg = {
      base_url: this.props.base_url,
      site_id: (document.location.host.split(':')[0] === 'localhost') ? 'cms.netlify.com' : this.props.siteId,
      auth_endpoint: this.props.authEndpoint,
    };
    const auth = new Authenticator(cfg);

    auth.authenticate({ provider: 'github', scope: 'repo' }, (err, data) => {
      if (err) {
        this.setState({ loginError: err.toString() });
        return;
      }
      this.props.onLogin(data);
    });
  };

  render() {
    const { loginError } = this.state;
    const { inProgress } = this.props;

    return (
      <section className="nc-githubAuthenticationPage-root">
        <Icon className="nc-githubAuthenticationPage-logo" size="500px" type="netlify-cms"/>
        {loginError && <p>{loginError}</p>}
        <button
          className="nc-githubAuthenticationPage-button"
          disabled={inProgress}
          onClick={this.handleLogin}
        >
          <Icon type="github" /> {inProgress ? "Logging in..." : "Login with GitHub"}
        </button>
      </section>
    );
  }
}
