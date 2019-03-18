import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { NetlifyAuthenticator } from 'netlify-cms-lib-auth';
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
    config: ImmutablePropTypes.map,
  };

  state = {};

  handleLogin = e => {
    e.preventDefault();
    const cfg = {
      base_url: this.props.base_url,
      site_id:
        document.location.host.split(':')[0] === 'localhost'
          ? 'cms.netlify.com'
          : this.props.siteId,
      auth_endpoint: this.props.authEndpoint,
    };
    const auth = new NetlifyAuthenticator(cfg);

    auth.authenticate({ provider: 'bitbucket', scope: 'repo' }, (err, data) => {
      if (err) {
        this.setState({ loginError: err.toString() });
        return;
      }
      this.props.onLogin(data);
    });
  };

  render() {
    const { inProgress, config } = this.props;

    return (
      <AuthenticationPage
        onLogin={this.handleLogin}
        loginDisabled={inProgress}
        loginErrorMessage={this.state.loginError}
        logoUrl={config.get('logo_url')}
        renderButtonContent={() => (
          <React.Fragment>
            <LoginButtonIcon type="bitbucket" />
            {inProgress ? 'Logging in...' : 'Login with Bitbucket'}
          </React.Fragment>
        )}
      />
    );
  }
}
