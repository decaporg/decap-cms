import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { NetlifyAuthenticator } from 'netlify-cms-lib-auth';
import { AuthenticationPage, Icon } from 'netlify-cms-ui-default';

const LoginButtonIcon = styled(Icon)`
  margin-right: 18px;
`;

const ForkApprovalContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  flex-grow: 0.2;
`;
const ForkButtonsContainer = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
`;

export default class GitHubAuthenticationPage extends React.Component {
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

  getPermissionToFork = () => {
    return new Promise((resolve, reject) => {
      this.setState({
        requestingFork: true,
        approveFork: () => {
          this.setState({ requestingFork: false });
          resolve();
        },
        refuseFork: () => {
          this.setState({ requestingFork: false });
          reject();
        },
      });
    });
  };

  loginWithOpenAuthoring(data) {
    const { backend } = this.props;

    this.setState({ findingFork: true });
    return backend
      .authenticateWithFork({ userData: data, getPermissionToFork: this.getPermissionToFork })
      .catch(err => {
        this.setState({ findingFork: false });
        console.error(err);
        throw err;
      });
  }

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

    const {
      open_authoring: openAuthoring = false,
      auth_scope: authScope = '',
    } = this.props.config.backend;

    const scope = authScope || (openAuthoring ? 'public_repo' : 'repo');
    auth.authenticate({ provider: 'github', scope }, (err, data) => {
      if (err) {
        this.setState({ loginError: err.toString() });
        return;
      }
      if (openAuthoring) {
        return this.loginWithOpenAuthoring(data).then(() => this.props.onLogin(data));
      }
      this.props.onLogin(data);
    });
  };

  renderLoginButton = () => {
    const { inProgress, t } = this.props;
    return inProgress || this.state.findingFork ? (
      t('auth.loggingIn')
    ) : (
      <React.Fragment>
        <LoginButtonIcon type="github" />
        {t('auth.loginWithGitHub')}
      </React.Fragment>
    );
  };

  getAuthenticationPageRenderArgs() {
    const { requestingFork } = this.state;

    if (requestingFork) {
      const { approveFork, refuseFork } = this.state;
      return {
        renderPageContent: ({ LoginButton }) => (
          <ForkApprovalContainer>
            <p>
              Open Authoring is enabled: we need to use a fork on your github account. (If a fork
              already exists, we&#39;ll use that.)
            </p>
            <ForkButtonsContainer>
              <LoginButton onClick={approveFork}>Fork the repo</LoginButton>
              <LoginButton onClick={refuseFork}>Don&#39;t fork the repo</LoginButton>
            </ForkButtonsContainer>
          </ForkApprovalContainer>
        ),
      };
    }

    return {
      renderButtonContent: this.renderLoginButton,
    };
  }

  render() {
    const { inProgress, config } = this.props;
    const { loginError, requestingFork, findingFork } = this.state;

    return (
      <AuthenticationPage
        onLogin={this.handleLogin}
        loginDisabled={inProgress || findingFork || requestingFork}
        loginErrorMessage={loginError}
        logoUrl={config.logo_url}
        siteUrl={config.site_url}
        {...this.getAuthenticationPageRenderArgs()}
      />
    );
  }
}
