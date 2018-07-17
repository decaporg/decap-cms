import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import Authenticator from 'netlify-cms-lib-auth/netlify-auth';
import Icon from 'netlify-cms-ui-default/Icon';
import { buttons, shadows } from 'netlify-cms-ui-default/styles';

const StyledAuthenticationPage = styled.section`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  height: 100vh;
`

const AuthenticationPageLogo = styled(Icon)`
  color: #c4c6d2;
  margin-top: -300px;
`

const LoginButton = styled.button`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  padding: 0 30px;
  margin-top: -80px;
  display: flex;
  align-items: center;
  position: relative;

  ${Icon} {
    margin-right: 18px;
  }
`

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
    base_url: PropTypes.string,
    siteId: PropTypes.string,
    authEndpoint: PropTypes.string,
  };

  state = {};

  handleLogin = (e) => {
    e.preventDefault();
    const cfg = {
      base_url: this.props.base_url,
      site_id: (document.location.host.split(':')[0] === 'localhost') ? 'cms.netlify.com' : this.props.siteId,
      auth_endpoint: this.props.authEndpoint,
    };
    const auth = new Authenticator(cfg);

    auth.authenticate({ provider: 'github', scope: 'repo' }, (err, data) => {
      if (err) {
        this.setState({ loginError: err.toString() });
        return;
      }
      this.props.onLogin(data);
    });
  };

  render() {
    const { loginError } = this.state;
    const { inProgress } = this.props;

    return (
      <StyledAuthenticationPage>
        <AuthenticationPageLogo size="500px" type="netlify-cms"/>
        {loginError ? <p>{loginError}</p> : null}
        <LoginButton disabled={inProgress} onClick={this.handleLogin}>
          <Icon type="github" /> {inProgress ? "Logging in..." : "Login with GitHub"}
        </LoginButton>
      </StyledAuthenticationPage>
    );
  }
}
