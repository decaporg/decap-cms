import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { PkceAuthenticator } from 'decap-cms-lib-auth';
import { AuthenticationPage, Icon } from 'decap-cms-ui-default';

const LoginButtonIcon = styled(Icon)`
  margin-right: 18px;
`;

export default class GiteaAuthenticationPage extends React.Component {
  static propTypes = {
    inProgress: PropTypes.bool,
    config: PropTypes.object.isRequired,
    onLogin: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  state = {};

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(
      GiteaAuthenticationPage.propTypes,
      this.props,
      'prop',
      'GiteaAuthenticationPage',
    );

    const { base_url = 'https://try.gitea.io', app_id = '' } = this.props.config.backend;
    this.auth = new PkceAuthenticator({
      base_url,
      auth_endpoint: 'login/oauth/authorize',
      app_id,
      auth_token_endpoint: 'login/oauth/access_token',
      auth_token_endpoint_content_type: 'application/json; charset=utf-8',
    });
    // Complete authentication if we were redirected back to from the provider.
    this.auth.completeAuth((err, data) => {
      if (err) {
        this.setState({ loginError: err.toString() });
        return;
      } else if (data) {
        this.props.onLogin(data);
      }
    });
  }

  handleLogin = e => {
    e.preventDefault();
    this.auth.authenticate({ scope: 'repository' }, (err, data) => {
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
            <LoginButtonIcon type="gitea" />{' '}
            {inProgress ? t('auth.loggingIn') : t('auth.loginWithGitea')}
          </React.Fragment>
        )}
        t={t}
      />
    );
  }
}
