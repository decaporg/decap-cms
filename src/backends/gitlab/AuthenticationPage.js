import PropTypes from 'prop-types';
import React from 'react';
import { Map } from 'immutable';
import { randomStr } from 'Lib/randomGenerator';
import Authenticator from 'Lib/netlify-auth';
import history from 'Routing/history';
import { Icon } from 'UI';

function createNonce() {
  const nonce = randomStr();
  window.sessionStorage.setItem("netlify-cms-auth", JSON.stringify({ nonce }));
  return nonce;
}

function validateNonce(check) {
  const auth = window.sessionStorage.getItem("netlify-cms-auth");
  const valid = auth && JSON.parse(auth).nonce;
  window.localStorage.removeItem("netlify-cms-auth");
  return (check === valid);
}

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
    oauth_url: PropTypes.string,
  };

  state = {};
  

  beginLogin = (e) => {
    e.preventDefault();

    if (
          document.location.protocol !== "https:"
          // TODO: Is insecure localhost a bad idea as well? I don't think it is, since you are not actually
          //       sending the token over the internet in this case, assuming the auth URL is secure.
          && (document.location.hostname !== "localhost" && document.location.hostname !== "127.0.0.1")
       ) {
      this.setState({ loginError: "Cannot authenticate over insecure protocol!" });
      return;
    }

    const authURL = new URL(this.props.oauth_url || "https://gitlab.com/oauth/authorize");
    authURL.searchParams.set('client_id', this.props.oauth_appid);
    authURL.searchParams.set('redirect_uri', document.location.origin + document.location.pathname);
    authURL.searchParams.set('response_type', 'token');
    authURL.searchParams.set('scope', 'api read_user');
    authURL.searchParams.set('state', createNonce());

    window.location.assign(authURL.href);
  };

  finishLogin = params => {
    const validNonce = validateNonce(params.state);
    if (!validNonce) {
      this.setState({ loginError: "Invalid nonce" });
      return;      
    }

    if (params.error) {
      this.setState({ loginError: `${ params.error }: ${ params['error_description'] }` });
      return;
    }

    if (params['access_token']) {
      const { access_token: token, ...data } = params;
      this.props.onLogin({ token, ...data });
    }
  };

  componentDidMount() {
    const hashParams = new URLSearchParams(document.location.hash.replace(/^#?\/?/, ''));
    if (hashParams.has("access_token") || hashParams.has("error")) {

      // Remove tokens from hash so that token does not remain in browser history.
      history.replace('/')

      const response = Map(hashParams.entries()).toJS();
      this.finishLogin(response);

    }
  }

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
          onClick={this.beginLogin}
        >
          <Icon type="gitlab" /> {inProgress ? "Logging in..." : "Login with GitLab"}
        </button>
      </section>
    );
  }
}
