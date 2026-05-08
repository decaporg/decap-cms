import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { ImplicitAuthenticator } from 'decap-cms-lib-auth';
import { AuthenticationPage, Icon } from 'decap-cms-ui-default';

const LoginButtonIcon = styled(Icon)`
  margin-right: 18px;
`;

export default class AzureAuthenticationPage extends React.Component {
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
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(
      AzureAuthenticationPage.propTypes,
      this.props,
      'prop',
      'AzureAuthenticationPage',
    );

    this.auth = new ImplicitAuthenticator({
      base_url: `https://login.microsoftonline.com/${this.props.config.backend.tenant_id}`,
      auth_endpoint: 'oauth2/authorize',
      app_id: this.props.config.backend.app_id,
      clearHash: this.props.clearHash,
    });
    // Complete implicit authentication if we were redirected back to from the provider.
    this.auth.completeAuth((err, data) => {
      if (err) {
        alert(err);
        return;
      }
      this.props.onLogin(data);
    });
  }

  handleLogin = e => {
    e.preventDefault();
    this.auth.authenticate(
      {
        scope: 'vso.code_full,user.read',
        resource: '499b84ac-1321-427f-aa17-267ca6975798',
        prompt: 'select_account',
      },
      (err, data) => {
        if (err) {
          this.setState({ loginError: err.toString() });
          return;
        }
        this.props.onLogin(data);
      },
    );
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
        renderButtonContent={() => (
          <React.Fragment>
            <LoginButtonIcon type="azure" />
            {inProgress ? t('auth.loggingIn') : t('auth.loginWithAzure')}
          </React.Fragment>
        )}
        t={t}
      />
    );
  }
}
