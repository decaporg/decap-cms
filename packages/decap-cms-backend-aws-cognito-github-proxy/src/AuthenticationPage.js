import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { PkceAuthenticator } from 'decap-cms-lib-auth';
import { AuthenticationPage, Icon } from 'decap-cms-ui-default';

const LoginButtonIcon = styled(Icon)`
  margin-right: 18px;
`;

export default class GenericPKCEAuthenticationPage extends React.Component {
  static propTypes = {
    inProgress: PropTypes.bool,
    config: PropTypes.object.isRequired,
    onLogin: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  state = {};

  componentDidMount() {
    const {
      base_url = '',
      app_id = '',
      auth_endpoint = 'oauth2/authorize',
      auth_token_endpoint = 'oauth2/token',
    } = this.props.config.backend;
    this.auth = new PkceAuthenticator({
      base_url,
      auth_endpoint,
      app_id,
      auth_token_endpoint,
      auth_token_endpoint_content_type: 'application/x-www-form-urlencoded; charset=utf-8',
    });
    // Complete authentication if we were redirected back to from the provider.
    this.auth.completeAuth((err, data) => {
      if (err) {
        this.setState({ loginError: err.toString() });
        return;
      }
      this.props.onLogin(data);
    });
  }

  handleLogin = e => {
    e.preventDefault();
    this.auth.authenticate({ scope: 'https://api.github.com/repo openid email' }, (err, data) => {
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
        logoUrl={config.logo_url}
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
