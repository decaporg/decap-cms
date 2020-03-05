import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Color from 'color';
import {
  IconButton,
  Button,
  ButtonGroup,
  Logo,
  ParticleBackground,
  TextWidget,
} from 'netlify-cms-ui-default';

const textGrey = '#798291';
const offset = 4;

const AuthPageWrap = styled.section`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: ${({ theme }) => theme.color.background};
  position: relative;
`;
const ParticleBg = styled(ParticleBackground)`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: ${({ theme }) => theme.color.neutral['1400']};
  z-index: 0;
`;
const AuthPageDialog = styled.div`
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
  padding: 1.5rem;
`;
const LogoWrap = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin-bottom: 1.5rem;
`;
const StyledHeader = styled.h1`
  align-self: flex-start;
  font-size: 19.2px;
  padding-left: ${offset}px;
  color: ${({ theme }) => theme.color.highEmphasis};
  display: flex;
  align-items: center;
`;
const HeaderText = styled.div`
  line-height: 40px;
  font-weight: 800;
  margin-left: 12px;
`;
const StyledSubtitle = styled.div`
  align-self: flex-start;
  padding-left: ${offset}px;
  color: ${textGrey};
  color: ${({ theme }) => theme.color.lowEmphasis};
  margin-bottom: 1rem;
`;
const StyledForm = styled.form`
  width: 100%;
  appearance: none;
`;
const StyledTextWidget = styled(TextWidget)`
  margin: 0 -1.5rem;
  padding: 1rem 1.75rem;
`;
const ForgotPasswordLink = styled.p`
  font-size: 10px;
  font-weight: bold;
  color: ${({ theme }) => theme.color.lowEmphasis};
  align-self: flex-start;
  margin: 0.25rem 0 0.75rem ${offset}px;
`;
const StyledButtonGroup = styled(ButtonGroup)`
  margin: 0;
  width: 100%;
`;
const LoginButton = styled(Button)`
  position: relative;
  width: calc(100% - 0.5rem);
  ${({ color }) =>
    color
      ? `
    background-color: ${color};
    &:hover,
    &:hover:focus,
    &:focus {
      background-color: ${Color(color)
        .lighten(0.1)
        .string()};
    }
    &:active,
    &:active:focus {
      background-color: ${Color(color)
        .darken(0.1)
        .string()};
    }
  `
      : ``}
  & svg {
    position: absolute;
    left: 10px;
    top: 10px;
    margin: 0;
  }
`;

export default class AuthenticationPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      password: '',
      backendSelected: false,
      selectedBackend: null,
      availableBackends: {
        'Netlify Identity': {
          icon: 'netlify',
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
          color: '#0146b3',
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

  render() {
    const { t, inProgress } = this.props;
    const { backendSelected } = this.state;

    return (
      <AuthPageWrap>
        <ParticleBg />
        <AuthPageDialog>
          <LogoWrap>
            <Logo />
          </LogoWrap>
          {backendSelected ? (
            <>
              <StyledHeader>
                <IconButton
                  icon="arrow-left"
                  size="lg"
                  onClick={() => this.setState({ backendSelected: false })}
                />
                <HeaderText>Log in with Netlify Identity</HeaderText>
              </StyledHeader>
              <StyledSubtitle>Enter your e-mail address and password to log in.</StyledSubtitle>
              <StyledForm
                onSubmit={e => {
                  e.preventDefault();
                  this.props.handleSubmit;
                }}
              >
                <StyledTextWidget
                  label="Email"
                  icon="mail"
                  placeholder="Type email"
                  value={this.state.email}
                  onChange={email => this.setState({ email })}
                />
                <StyledTextWidget
                  password
                  label="Password"
                  icon="lock"
                  placeholder="Type password"
                  value={this.state.password}
                  onChange={password => this.setState({ password })}
                />
                <ForgotPasswordLink>Forgot your password?</ForgotPasswordLink>
                <StyledButtonGroup direction="vertical">
                  <LoginButton primary type="success" size="lg" disabled={inProgress}>
                    {inProgress ? t('auth.loggingIn') : t('auth.login')}
                  </LoginButton>
                </StyledButtonGroup>
              </StyledForm>
            </>
          ) : (
            <>
              <StyledButtonGroup direction="vertical">
                {Object.keys(this.state.availableBackends).map(backend => {
                  const { color, icon, handler } = this.state.availableBackends[backend];

                  return (
                    <LoginButton
                      primary
                      size="lg"
                      type={backend === 'Netlify Identity' && 'success'}
                      key={backend}
                      disabled={inProgress}
                      onClick={handler}
                      color={color}
                      icon={icon}
                    >
                      {inProgress ? 'Logging in...' : `Log In with ${backend}`}
                    </LoginButton>
                  );
                })}
              </StyledButtonGroup>
            </>
          )}
        </AuthPageDialog>
      </AuthPageWrap>
    );
  }
}
