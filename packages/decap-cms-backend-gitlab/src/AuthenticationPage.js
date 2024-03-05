import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import {
  NetlifyAuthenticator,
  ImplicitAuthenticator,
  PkceAuthenticator,
} from 'decap-cms-lib-auth';
import { AuthenticationPage, Icon } from 'decap-cms-ui-default';

const LoginButtonIcon = styled(Icon)`
  margin-right: 18px;
`;

const clientSideAuthenticators = {
  pkce: ({
    base_url,
    auth_endpoint,
    app_id,
    auth_token_endpoint}) =>
    new PkceAuthenticator({
      base_url,
      auth_endpoint,
      app_id,
      auth_token_endpoint,
      auth_token_endpoint_content_type: 'application/json; charset=utf-8',
    }),

  implicit: ({
    base_url,
    auth_endpoint,
    app_id,
    clearHash }) =>
    new ImplicitAuthenticator({
      base_url,
      auth_endpoint,
      app_id,
      clearHash,
    }),
};

export default class GitLabAuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
    base_url: PropTypes.string,
    siteId: PropTypes.string,
    authEndpoint: PropTypes.string,
    config: PropTypes.object.isRequired,
    clearHash: PropTypes.func,
    t: PropTypes.func.isRequired,
  };

  state = {};

  componentDidMount() {
    const {
      auth_type: authType = '',
      base_url = 'https://gitlab.com',
      auth_endpoint = 'oauth/authorize',
      app_id = '',
    } = this.props.config.backend;

    if (clientSideAuthenticators[authType]) {
      this.auth = clientSideAuthenticators[authType]({
        base_url,
        auth_endpoint,
        app_id,
        auth_token_endpoint: 'oauth/token',
        clearHash: this.props.clearHash,
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
        site_id:
          document.location.host.split(':')[0] === 'localhost'
            ? 'demo.decapcms.org'
            : this.props.siteId,
        auth_endpoint: this.props.authEndpoint,
      });
    }
  }

  handleLogin = e => {
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
            <LoginButtonIcon type="gitlab" />{' '}
            {inProgress ? t('auth.loggingIn') : t('auth.loginWithGitLab')}
          </React.Fragment>
        )}
        t={t}
      />
    );
  }
}
