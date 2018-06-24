import PropTypes from 'prop-types';
import React from 'react';
import NetlifyAuthenticator from 'Lib/netlify-auth';
import ImplicitAuthenticator from 'Lib/implicit-oauth';
import { Icon } from 'UI';

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
  };

  state = {};

  componentDidMount() {
    const authType = this.props.config.getIn(['backend', 'auth_type']);
    if (authType === "implicit") {
      this.auth = new ImplicitAuthenticator({
        base_url: this.props.config.getIn(['backend', 'base_url'], "https://gitlab.com"),
        auth_endpoint: this.props.config.getIn(['backend', 'auth_endpoint'], 'oauth/authorize'),
        app_id: this.props.config.getIn(['backend', 'app_id']),
      });
      // Complete implicit authentication if we were redirected back to from the provider.
      this.auth.completeAuth((err, data) => {
        if (err) {
          this.setState({ loginError: err.toString() });
          return;
        }
        this.props.onLogin(data);
      });
    } else {
      this.auth = new NetlifyAuthenticator({
        base_url: this.props.base_url,
        site_id: (document.location.host.split(':')[0] === 'localhost') ? 'cms.netlify.com' : this.props.siteId,
        auth_endpoint: this.props.authEndpoint,
      });
    }
  }

  handleLogin = (e) => {
    e.preventDefault();
    this.auth.authenticate({ provider: 'gitlab', scope: 'api' }, (err, data) => {
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
          <Icon type="gitlab" /> {inProgress ? "Logging in..." : "Login with GitLab"}
        </button>
      </section>
    );
  }
}
