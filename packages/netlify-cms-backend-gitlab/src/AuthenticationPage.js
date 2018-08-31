import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from 'react-emotion';
import { NetlifyAuthenticator, ImplicitAuthenticator } from 'netlify-cms-lib-auth';
import { AuthenticationPage, Icon } from 'netlify-cms-ui-default';

const LoginButtonIcon = styled(Icon)`
  margin-right: 18px;
`;

export default class GitLabAuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
    base_url: PropTypes.string,
    siteId: PropTypes.string,
    authEndpoint: PropTypes.string,
    config: ImmutablePropTypes.map,
    clearHash: PropTypes.function,
  };

  state = {};

  componentDidMount() {
    const authType = this.props.config.getIn(['backend', 'auth_type']);
    if (authType === 'implicit') {
      this.auth = new ImplicitAuthenticator({
        base_url: this.props.config.getIn(['backend', 'base_url'], 'https://gitlab.com'),
        auth_endpoint: this.props.config.getIn(['backend', 'auth_endpoint'], 'oauth/authorize'),
        app_id: this.props.config.getIn(['backend', 'app_id']),
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
            ? 'cms.netlify.com'
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
    const { inProgress } = this.props;
    return (
      <AuthenticationPage
        onLogin={this.handleLogin}
        loginDisabled={inProgress}
        loginErrorMessage={this.state.loginError}
        renderButtonContent={() => (
          <React.Fragment>
            <LoginButtonIcon type="gitlab" /> {inProgress ? 'Logging in...' : 'Login with GitLab'}
          </React.Fragment>
        )}
      />
    );
  }
}
