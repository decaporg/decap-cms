import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { Icon, buttons, shadows, GoBackButton } from 'netlify-cms-ui-default';

const StyledAuthenticationPage = styled.section`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const PageLogoIcon = styled(Icon)`
  color: #c4c6d2;
  margin-top: -300px;
`;

const LoginButton = styled.button`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  padding: 0 30px;
  margin-top: -40px;
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
    config: ImmutablePropTypes.map.isRequired,
  };

  componentDidMount() {
    /**
     * Allow login screen to be skipped for demo purposes.
     */
    const skipLogin = this.props.config.getIn(['backend', 'login']) === false;
    if (skipLogin) {
      this.props.onLogin(this.state);
    }
  }

  handleLogin = e => {
    e.preventDefault();
    this.props.onLogin(this.state);
  };

  render() {
    const { config, inProgress } = this.props;

    return (
      <StyledAuthenticationPage>
        <PageLogoIcon size="300px" type="netlify-cms" />
        <LoginButton disabled={inProgress} onClick={this.handleLogin}>
          {inProgress ? 'Logging in...' : 'Login'}
        </LoginButton>
        {config.get('site_url') && <GoBackButton href={config.get('site_url')}></GoBackButton>}
      </StyledAuthenticationPage>
    );
  }
}
