import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, buttons, shadows, GoBackButton, renderPageLogo } from 'decap-cms-ui-default';

const StyledAuthenticationPage = styled.section`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  height: 100vh;
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

  handleLogin = e => {
    e.preventDefault();
    this.props.onLogin(this.state);
  };

  render() {
    const { config, inProgress, t } = this.props;

    return (
      <StyledAuthenticationPage>
        {renderPageLogo(config.logo_url)}
        <LoginButton disabled={inProgress} onClick={this.handleLogin}>
          {inProgress ? t('auth.loggingIn') : t('auth.login')}
        </LoginButton>
        {config.site_url && <GoBackButton href={config.site_url} t={t}></GoBackButton>}
      </StyledAuthenticationPage>
    );
  }
}
