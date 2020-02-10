import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, LoginButton } from 'netlify-cms-ui-default';

// Set one variable for all sizing aka the magicNumber, for more info contact @danoszz
const magicNumber = 48;
const textGrey = '#798291';
const offset = 4;

const StyledAuthenticationPage = styled.section`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #0c1e24;
  position: relative;
  &:after {
    content: '';
    width: 100%;
    height: 50%;
    position: absolute;
    bottom: 0;
    left: 0;
    background-color: #f2f5f7;
    z-index: 0;
  }
`;

const AuthenticationPageModal = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  width: ${27 * 16}px;
  box-shadow: 0 2px 4px 0 rgba(14, 30, 37, 0.12);
  border-radius: 8px;
  padding: ${magicNumber / 2}px;
`;

const PageModalLogoWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  max-width: ${magicNumber * 6}px;
`;

const PageLogoIcon = styled(Icon)`
  display: flex;
  align-items: center;
  height: 100%;
  width: calc(100% - ${magicNumber}px);
  margin: 0 auto;
`;

const PageModalButtonsWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  margin-top: ${magicNumber * 1.5}px;
`;

const InputWrapper = styled.div`
  position: relative;
  margin-left: -${magicNumber / 2}px;
  margin-right: -${magicNumber / 2}px;
  border-bottom: 1px #dbdedf solid;
`;

const StyledHeader = styled.h1`
  align-self: flex-start;
  font-size: 19.2px;
  padding-left: ${offset}px;
`;

const StyledSubtitle = styled.h2`
  align-self: flex-start;
  padding-left: ${offset}px;
  color: ${textGrey};
`;

const StyledForm = styled.form`
  width: 100%;
  appearance: none;
`;

const StyledInput = styled.input`
  width: 100%;
  font-size: 16px;
  appearance: none;
  padding: ${magicNumber / 4}px ${magicNumber / 2 + offset}px;
`;

const ForgotPasswordLink = styled.p`
  font-size: 10px;
  font-weight: bold;
  color: ${textGrey};
  align-self: flex-start;
  margin: ${magicNumber / 4}px 0 ${magicNumber / 2}px ${offset}px;
`;

const StyledLabel = styled.label`
  display: block;
  position: relative;
  font-size: 12px;
  font-weight: bold;
  padding-left: ${magicNumber / 2 + offset}px;
  margin-top: ${magicNumber / 4}px;
`;

class LoginInputs extends React.Component {
  render = () => {
    return (
      <>
        <InputWrapper>
          <StyledLabel htmlFor="email">E-mail</StyledLabel>
          <StyledInput type="email" name="email" id="email" required />
        </InputWrapper>
        <InputWrapper>
          <StyledLabel htmlFor="password">Password</StyledLabel>
          <StyledInput type="password" name="password" id="password" required />
        </InputWrapper>
      </>
    );
  };
}

class LoginForm extends React.Component {
  render = () => {
    const { inProgress, t } = this.props;
    return (
      <>
        <StyledHeader>Log in with Netlify Identity</StyledHeader>
        <StyledSubtitle>Enter your e-mailaddress and password to log in.</StyledSubtitle>
        <StyledForm onSubmit={this.props.handleSubmit}>
          <LoginInputs />
          <ForgotPasswordLink>Forgot your password?</ForgotPasswordLink>
          <LoginButton type="submit" color="#1ead9e" disabled={this.props.inProgress}>
            {inProgress ? t('auth.loggingIn') : t('auth.login')}
          </LoginButton>
        </StyledForm>
      </>
    );
  };
}

class BackendSelector extends React.Component {
  renderThirdPartyLogins = () =>
    Object.keys(this.props.availableBackends).map(backend => {
      const { color, icon, handler } = this.props.availableBackends[backend];

      return (
        <LoginButton key={backend} disabled={this.props.inProgress} onClick={handler} color={color}>
          {icon && <Icon type={icon} />}
          {this.props.inProgress ? 'Logging in...' : `Log In with ${backend}`}
        </LoginButton>
      );
    });

  render = () => {
    return (
      <>
        <PageModalLogoWrapper>
          <PageLogoIcon size="300px" type="netlify-cms" />
        </PageModalLogoWrapper>
        <PageModalButtonsWrapper>{this.renderThirdPartyLogins()}</PageModalButtonsWrapper>
      </>
    );
  };
}

export default class AuthenticationPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      backendSelected: false,
      selectedBackend: null,
      availableBackends: {
        'Netlify Identity': {
          icon: 'netlify',
          color: '#1ead9e',
          handler: this.handleBackendSelection,
        },
        Github: {
          icon: 'github',
          color: '#333333',
          handler: this.handleLogin,
        },
        Gitlab: {
          icon: 'gitlab',
          color: '#e24328',
          handler: this.handleLogin,
        },
        Bitbucket: {
          icon: 'bitbucket',
          color: '#205081',
          handler: this.handleLogin,
        },
      },
    };
  }

  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
    config: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
  };

  componentDidMount = () => {
    /**
     * Allow login screen to be skipped for demo purposes.
     */
    const skipLogin = this.props.config.backend.login === false;
    if (skipLogin) {
      this.props.onLogin(this.state);
    }
  };

  handleLogin = e => {
    e.preventDefault();
    this.props.onLogin(this.state);
  };

  handleBackendSelection = e => {
    e.preventDefault();
    this.setState({
      backendSelected: true,
      selectedBackend: 'Netlify Identity',
    });
  };

  renderContent = () => {
    if (this.state.backendSelected) {
      return <LoginForm />;
    } else {
      return (
        <BackendSelector
          inProgress={this.props.inProgress}
          availableBackends={this.state.availableBackends}
          handleSubmit={this.handleLogin}
        />
      );
    }
  };

  render() {
    return (
      <StyledAuthenticationPage>
        <AuthenticationPageModal>{this.renderContent()}</AuthenticationPageModal>
      </StyledAuthenticationPage>
    );
  }
}
