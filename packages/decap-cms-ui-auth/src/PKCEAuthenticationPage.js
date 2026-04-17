import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import jwtDecode from 'jwt-decode';
import { PkceAuthenticator } from 'decap-cms-lib-auth';
import { AuthenticationPage, Icon } from 'decap-cms-ui-default';

const LoginButtonIcon = styled(Icon)`
  margin-right: 18px;
`;

function normalizeClaimsToUser(
  email_claim,
  full_name_claim,
  first_name_claim,
  last_name_claim,
  avatar_url_claim,
) {
  return (user, claims) => {
    if (!claims) return;

    if (!user.email && claims[email_claim]) {
      user.email = claims[email_claim];
    }
    if (!user.user_metadata.full_name && full_name_claim && claims[full_name_claim]) {
      user.user_metadata.full_name = claims[full_name_claim];
    }
    if (!user.user_metadata.full_name && (first_name_claim || last_name_claim)) {
      const name = [];
      if (claims[first_name_claim]) name.push(claims[first_name_claim]);
      if (claims[last_name_claim]) name.push(claims[last_name_claim]);
      if (name.length) {
        user.user_metadata.full_name = name.join(' ');
      }
    }
    if (!user.user_metadata.avatar_url && avatar_url_claim && claims[avatar_url_claim]) {
      user.user_metadata.avatar_url = claims[avatar_url_claim];
    }
  };
}

export default class PKCEAuthenticationPage extends React.Component {
  static propTypes = {
    inProgress: PropTypes.bool,
    config: PropTypes.object.isRequired,
    onLogin: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  state = {};

  componentDidMount() {
    // Old configuration options, available from the backend configuration
    const {
      base_url: backend_base_url = '',
      app_id: backend_app_id = '',
      auth_endpoint: backend_auth_endpoint = 'oauth2/authorize',
      auth_token_endpoint: backend_auth_token_endpoint = 'oauth2/token',
    } = this.props.config.backend;
    // New configuration options, separately defined in the "auth" configuration
    const {
      use_oidc = false,
      base_url = backend_base_url,
      auth_endpoint = backend_auth_endpoint,
      auth_token_endpoint = backend_auth_token_endpoint,
      app_id = backend_app_id,
      auth_token_endpoint_content_type = 'application/x-www-form-urlencoded; charset=utf-8',
      email_claim = 'email',
      full_name_claim,
      first_name_claim,
      last_name_claim,
      avatar_url_claim,
    } = this.props.config.auth || {};

    const normalizeClaims = normalizeClaimsToUser(
      email_claim,
      full_name_claim,
      first_name_claim,
      last_name_claim,
      avatar_url_claim,
    );

    this.auth = new PkceAuthenticator({
      base_url,
      app_id,
      use_oidc,
      auth_endpoint,
      auth_token_endpoint,
      auth_token_endpoint_content_type,
    });

    // Complete authentication if we were redirected back from the provider.
    this.auth.completeAuth((err, data) => {
      if (err) {
        this.setState({ loginError: err.toString() });
        return;
      }

      data.user_metadata = {};
      if (data.access_token) {
        data.token = data.access_token;
        try {
          data.claims = jwtDecode(data.access_token);
          normalizeClaims(data, data.claims);
        } catch {
          /* Ignore */
        }
      }
      if (data.id_token) {
        try {
          data.idClaims = jwtDecode(data.id_token);
          normalizeClaims(data, data.idClaims);
        } catch {
          /* Ignore */
        }
      }

      this.props.onLogin(data);
    });
  }

  handleLogin = e => {
    e.preventDefault();
    const scope = this.props.config.auth?.scope || this.props.config.auth_scope || 'openid email';
    this.auth.authenticate({ scope }, (err, data) => {
      if (err) {
        this.setState({ loginError: err.toString() });
        return;
      }
      this.props.onLogin(data);
    });
  };

  render() {
    const { inProgress, config, t } = this.props;
    return (
      <AuthenticationPage
        onLogin={this.handleLogin}
        loginDisabled={inProgress}
        loginErrorMessage={this.state.loginError}
        logoUrl={config.logo_url} // Deprecated, replaced by `logo.src`
        logo={config.logo}
        siteUrl={config.site_url}
        renderButtonContent={() => (
          <React.Fragment>
            <LoginButtonIcon type="link" /> {inProgress ? t('auth.loggingIn') : t('auth.login')}
          </React.Fragment>
        )}
        t={t}
      />
    );
  }
}
