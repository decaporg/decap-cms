import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Color from 'color';
import {
  IconButton,
  Button,
  ButtonGroup,
  Logo,
  ParticleBackground,
  TextInput,
  Slide,
  Grow,
  isWindowDown,
} from 'netlify-cms-ui-default';

const AuthPageWrap = styled.section`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  height: 100vh;
  height: calc(100 * var(--vh));
  background-color: ${({ theme }) => theme.color.background};
  position: relative;
  padding: 1rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    justify-content: flex-end;
  }
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
  width: 25rem;
  box-shadow: 0 2px 4px 0 rgba(14, 30, 37, 0.12);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 100%;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    padding: 1rem;
  }
`;
const LogoWrap = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin-bottom: 1.5rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    margin-bottom: 1rem;
  }
`;
const StyledHeader = styled.h1`
  align-self: flex-start;
  font-size: 19.2px;
  padding-left: 0.25rem;
  color: ${({ theme }) => theme.color.highEmphasis};
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    margin-bottom: 0;
  }
`;
const HeaderText = styled.div`
  line-height: 40px;
  font-weight: 800;
`;
const StyledSubtitle = styled.div`
  align-self: flex-start;
  padding-left: 0.25rem;
  color: ${({ theme }) => theme.color.lowEmphasis};
  margin-bottom: 1rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    display: none;
  }
`;
const StyledForm = styled.form`
  width: 100%;
  appearance: none;
`;
const StyledTextInput = styled(TextInput)`
  margin: 0 -1.5rem;
  padding: 0 1.75rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    margin: 0 -1rem;
    padding: 1rem 1.25rem;
  }
`;
const ForgotPasswordLink = styled.p`
  font-size: 10px;
  font-weight: bold;
  color: ${({ theme }) => theme.color.lowEmphasis};
  align-self: flex-start;
  margin: 0.25rem 0 0.75rem 0.25rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    display: none;
  }
`;
const StyledButtonGroup = styled(ButtonGroup)`
  margin: 0;
  width: 100%;
`;
const LoginButtonGroup = styled(StyledButtonGroup)`
  margin-top: 1rem;
`;
const LoginButton = styled(Button)`
  position: relative;
  width: calc(100% - 0.5rem);
  & svg {
    position: absolute;
    left: 10px;
    top: 10px;
    margin: 0;
  }
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
`;
LoginButton.defaultProps = { size: 'lg' };
const BackButton = styled(IconButton)`
  margin-right: 0.5rem;
  margin-left: -0.5rem;

  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    display: none;
  }
`;
BackButton.defaultProps = { icon: 'arrow-left', size: 'lg' };

const MobileBackButton = styled(BackButton)`
  display: none;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    margin-left: 0;
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    display: block;
    transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    opacity: ${({ show }) => (show ? 1 : 0)};
  }
`;

const DialogContentWrap = styled.div`
  width: calc(100% + 3rem);
  overflow: hidden;
  transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  ${({ height }) => (height ? `height: ${height}px;` : ``)}
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    width: calc(100% + 2rem);
  }
`;
const DialogContent = styled.div`
  width: 100%;
  padding: 0 1.5rem;
  transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  ${({ active }) => (active ? `` : `position: absolute; top: 0; left: 0;`)}
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    padding: 0 1rem;
  }
`;
const DialogFooter = styled.footer`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 0.75rem 1.5rem;
  text-align: center;
  color: white;
  font-size: 0.75rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    position: static;
    width: calc(100% + 2rem);
    border-top: 1px solid ${({ theme }) => theme.color.border};
    padding: 1rem 1rem 0;
    margin-top: 1rem;
    & span {
      display: none;
    }
  }
  & a {
    color: white;
    font-size: 0.75rem;
    border-bottom: 1px dotted;
    cursor: pointer;
  }
`;

const FooterButtonGroup = styled(StyledButtonGroup)`
  display: none;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    display: flex;
  }
`;

const NETLIFY_IDENTITY = 'Netlify Identity';
const backends = {
  [NETLIFY_IDENTITY]: {
    icon: 'netlify',
  },
  Github: {
    icon: 'github',
    color: '#333333',
  },
  Gitlab: {
    icon: 'gitlab',
    color: '#e24328',
  },
  Bitbucket: {
    icon: 'bitbucket',
    color: '#0146b3',
  },
};

const AuthenticationPage = ({ onLogin, inProgress, config, t, handleSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBackend, setSelectedBackend] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const backendSelectRef = useRef();
  const signinFormRef = useRef();
  const [backendSelectHeight, setBackendSelectHeight] = useState();
  const [signinFormHeight, setSigninFormHeight] = useState();
  const isMobile = isWindowDown('xs');
  const EnterTransitionComponent = isMobile ? Slide : Grow;

  useEffect(() => {
    if (backendSelectRef.current)
      setTimeout(() => {
        setBackendSelectHeight(backendSelectRef.current.offsetHeight);
      });
    // Allow login screen to be skipped for demo purposes.
    if (config.backend.login === false) onLogin();

    setTimeout(() => setShowAuth(true), 200);
  }, []);

  const handleSignin = (backend, e) => {
    e.preventDefault();
    setSelectedBackend(backend);

    if (backend !== NETLIFY_IDENTITY) {
      onLogin({ email, password, selectedBackend });
    }
  };

  useEffect(() => {
    setTimeout(() => {
      if (backendSelectRef.current) setBackendSelectHeight(backendSelectRef.current.offsetHeight);
    });
  }, [backendSelectRef, selectedBackend]);

  useEffect(() => {
    setTimeout(() => {
      if (signinFormRef.current) setSigninFormHeight(signinFormRef.current.offsetHeight);
    });
  }, [signinFormRef, selectedBackend]);

  return (
    <AuthPageWrap>
      <ParticleBg />
      <EnterTransitionComponent in={showAuth} direction="up">
        <AuthPageDialog>
          <LogoWrap>
            <Logo />
          </LogoWrap>
          <MobileBackButton
            onClick={() => setSelectedBackend(null)}
            show={selectedBackend === NETLIFY_IDENTITY}
          />
          <DialogContentWrap
            style={{
              height:
                selectedBackend === NETLIFY_IDENTITY && signinFormHeight
                  ? signinFormHeight
                  : backendSelectHeight,
            }}
          >
            <Slide direction="left" in={selectedBackend === NETLIFY_IDENTITY} appear={false}>
              <DialogContent ref={signinFormRef} active={selectedBackend === NETLIFY_IDENTITY}>
                <StyledHeader>
                  <BackButton onClick={() => setSelectedBackend(null)} />
                  <HeaderText>Sign in with Netlify Identity</HeaderText>
                </StyledHeader>
                <StyledSubtitle>Enter your email address and password to sign in.</StyledSubtitle>
                <StyledForm
                  onSubmit={e => {
                    e.preventDefault();
                    handleSubmit;
                  }}
                >
                  <StyledTextInput
                    label="Email"
                    icon="mail"
                    placeholder="Type email"
                    value={email}
                    inline
                    onChange={email => setEmail(email)}
                  />
                  <StyledTextInput
                    password
                    label="Password"
                    icon="lock"
                    placeholder="Type password"
                    value={password}
                    inline
                    onChange={password => setPassword(password)}
                  />
                  <ForgotPasswordLink>Forgot your password?</ForgotPasswordLink>
                  <LoginButtonGroup direction="vertical">
                    <LoginButton primary type="success" size="lg" disabled={inProgress}>
                      {inProgress ? t('auth.loggingIn') : t('auth.login')}
                    </LoginButton>
                  </LoginButtonGroup>
                </StyledForm>
              </DialogContent>
            </Slide>
            <Slide direction="right" in={selectedBackend !== NETLIFY_IDENTITY} appear={false}>
              <DialogContent ref={backendSelectRef} active={selectedBackend !== NETLIFY_IDENTITY}>
                <StyledButtonGroup direction="vertical">
                  {Object.keys(backends).map(backend => (
                    <LoginButton
                      primary
                      size="lg"
                      type={backend === NETLIFY_IDENTITY && 'success'}
                      key={backend}
                      disabled={inProgress}
                      onClick={e => handleSignin(backend, e)}
                      color={backends[backend].color}
                      icon={backends[backend].icon}
                    >
                      {inProgress && selectedBackend === backend
                        ? 'Signing in...'
                        : `Sign in with ${backend}`}
                    </LoginButton>
                  ))}
                </StyledButtonGroup>
              </DialogContent>
            </Slide>
          </DialogContentWrap>
          <DialogFooter>
            <span>
              Need an account? <a href="#">Create one</a>.
            </span>
            <FooterButtonGroup>
              <LoginButton>Forgot my Password</LoginButton>
              <LoginButton>Sign up</LoginButton>
            </FooterButtonGroup>
          </DialogFooter>
        </AuthPageDialog>
      </EnterTransitionComponent>
    </AuthPageWrap>
  );
};

AuthenticationPage.propTypes = {
  onLogin: PropTypes.func.isRequired,
  inProgress: PropTypes.bool,
  config: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

export default AuthenticationPage;
