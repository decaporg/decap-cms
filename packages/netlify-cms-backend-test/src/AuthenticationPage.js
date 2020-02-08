import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, buttons, shadows } from 'netlify-cms-ui-default';

// Set one variable for all sizing aka the magicNumber, for more info contact @danoszz

let magicNumber = 48;

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
    right: 0;
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
  align-items: flex-start;
  background-color: white;
  background: #ffffff;
  box-shadow: 0 2px 4px 0 rgba(14, 30, 37, 0.12);
  border-radius: 8px;
  padding: ${magicNumber}px;
`;

const PageModalLogoWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  max-width: calc(${magicNumber}px * 6);
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
  margin-top: calc(${magicNumber}px * 1.5);
`;

const LoginButton = styled.button`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  ${Icon} {
    margin-right: 18px;
  }
`;

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
    config: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
  };

  componentDidMount() {
    /**
     * Allow login screen to be skipped for demo purposes.
     */
    const skipLogin = this.props.config.backend.login === false;
    if (skipLogin) {
      this.props.onLogin(this.state);
    }
  }

  handleLogin = e => {
    e.preventDefault();
    this.props.onLogin(this.state);
  };

  render() {
    const { inProgress, t } = this.props;

    return (
      <StyledAuthenticationPage>
        <AuthenticationPageModal>
          <PageModalLogoWrapper>
            <PageLogoIcon size="300px" type="netlify-cms" />
          </PageModalLogoWrapper>
          <PageModalButtonsWrapper>
            <LoginButton disabled={inProgress} onClick={this.handleLogin}>
              {inProgress ? t('auth.loggingIn') : t('auth.login')}
            </LoginButton>
            {/* {config.site_url && <GoBackButton href={config.site_url}></GoBackButton>} */}
          </PageModalButtonsWrapper>
        </AuthenticationPageModal>
      </StyledAuthenticationPage>
    );
  }
}
