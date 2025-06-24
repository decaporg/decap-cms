import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, buttons, shadows, GoBackButton } from 'decap-cms-ui-default';

const StyledAuthenticationPage = styled.section`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: 50px;
  height: 100vh;
`;

const PageLogoIcon = styled(Icon)`
  height: auto;
`;

const LoginButton = styled.button`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  padding: 0 30px;
  margin-top: 0;
  display: flex;
  align-items: center;
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
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(
      AuthenticationPage.propTypes,
      this.props,
      'prop',
      'AuthenticationPage',
    );

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
    const { config, inProgress, t } = this.props;

    return (
      <StyledAuthenticationPage>
        <PageLogoIcon size="300px" type="decap-cms" />
        <LoginButton disabled={inProgress} onClick={this.handleLogin}>
          {inProgress ? t('auth.loggingIn') : t('auth.login')}
        </LoginButton>
        {config.site_url && <GoBackButton href={config.site_url} t={t}></GoBackButton>}
      </StyledAuthenticationPage>
    );
  }
}
