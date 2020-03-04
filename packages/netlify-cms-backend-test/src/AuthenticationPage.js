import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, Button, ButtonGroup, Logo, ParticleBackground } from 'netlify-cms-ui-default';

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
  background-color: ${({ theme }) => theme.color.background};
  position: relative;
`;

const StyledParticleBackground = styled(ParticleBackground)`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: ${({ theme }) => theme.color.neutral['1400']};
  z-index: 0;
`;

const AuthenticationPageModal = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.color.surface};
  width: ${27 * 16}px;
  box-shadow: 0 2px 4px 0 rgba(14, 30, 37, 0.12);
  border-radius: 8px;
  padding: ${magicNumber / 2}px;
`;

const PageModalLogoWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  max-width: ${magicNumber * 6}px;
  margin-bottom: 2rem;
`;

const PageModalButtonsWrapper = styled(ButtonGroup)`
  width: 100%;
  margin: 0;
  margin-top: ${magicNumber * 1.5}px;
`;
PageModalButtonsWrapper.defaultProps = {
  direction: 'vertical',
};

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

const StyledButtonGroup = styled(ButtonGroup)`
  margin: 0;
  width: 100%;
`;

const LoginButton = styled(Button)`
  position: relative;

  & svg {
    position: absolute;
    left: 10px;
    top: 10px;
    margin: 0;
  }
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
        <StyledSubtitle>Enter your e-mail address and password to log in.</StyledSubtitle>
        <StyledForm onSubmit={this.props.handleSubmit}>
          <LoginInputs />
          <ForgotPasswordLink>Forgot your password?</ForgotPasswordLink>
          <LoginButton primary type="submit" color="#1ead9e" disabled={this.props.inProgress}>
            {inProgress ? t('auth.loggingIn') : t('auth.login')}
          </LoginButton>
        </StyledForm>
      </>
    );
  };
}

class BackendSelector extends React.Component {
  render = () => {
    return (
      <>
        <PageModalLogoWrapper>
          <Logo />
        </PageModalLogoWrapper>
        <StyledButtonGroup direction="vertical">
          {Object.keys(this.props.availableBackends).map(backend => {
            const { color, icon, handler } = this.props.availableBackends[backend];

            return (
              <LoginButton
                primary
                size="lg"
                type={backend === 'Netlify Identity' && 'success'}
                key={backend}
                disabled={this.props.inProgress}
                onClick={handler}
                color={color}
                icon={icon}
              >
                {this.props.inProgress ? 'Logging in...' : `Log In with ${backend}`}
              </LoginButton>
            );
          })}
        </StyledButtonGroup>
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
        <StyledParticleBackground />
        <AuthenticationPageModal>{this.renderContent()}</AuthenticationPageModal>
      </StyledAuthenticationPage>
    );
  }
}
