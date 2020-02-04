import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { NetlifyAuthenticator, ImplicitAuthenticator } from 'netlify-cms-lib-auth';
import { AuthenticationPage, Icon } from 'netlify-cms-ui-default';

const LoginButtonIcon = styled(Icon)`
  margin-right: 18px;
`;

export default class BitbucketAuthenticationPage extends React.Component {
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
      base_url = 'https://bitbucket.org',
      auth_endpoint = 'site/oauth2/authorize',
      app_id = '',
    } = this.props.config.backend;

    if (authType === 'implicit') {
      this.auth = new ImplicitAuthenticator({
        base_url,
        auth_endpoint,
        app_id,
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
      this.authSettings = { scope: 'repository:write' };
    } else {
      this.auth = new NetlifyAuthenticator({
        base_url: this.props.base_url,
        site_id:
          document.location.host.split(':')[0] === 'localhost'
            ? 'cms.netlify.com'
            : this.props.siteId,
        auth_endpoint: this.props.authEndpoint,
      });
      this.authSettings = { provider: 'bitbucket', scope: 'repo' };
    }
  }

  handleLogin = e => {
    e.preventDefault();
    this.auth.authenticate(this.authSettings, (err, data) => {
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
            <LoginButtonIcon type="bitbucket" />
            {inProgress ? t('auth.loggingIn') : t('auth.loginWithBitbucket')}
          </React.Fragment>
        )}
      />
    );
  }
}
