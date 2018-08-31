import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import Icon from './Icon';
import { buttons, shadows } from './styles';

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
  &[disabled] {
    ${buttons.disabled};
  }

  padding: 0 12px;
  margin-top: -40px;
  display: flex;
  align-items: center;
  position: relative;
`;

const AuthenticationPage = ({
  onLogin,
  loginDisabled,
  loginErrorMessage,
  renderButtonContent,
  renderPageContent,
}) => {
  return (
    <StyledAuthenticationPage>
      <PageLogoIcon size="300px" type="netlify-cms" />
      {loginErrorMessage ? <p>{loginErrorMessage}</p> : null}
      {!renderPageContent ? null : renderPageContent()}
      {!renderButtonContent ? null : (
        <LoginButton disabled={loginDisabled} onClick={onLogin}>
          {renderButtonContent()}
        </LoginButton>
      )}
    </StyledAuthenticationPage>
  );
};

AuthenticationPage.propTypes = {
  onLogin: PropTypes.func,
  loginDisabled: PropTypes.bool,
  loginErrorMessage: PropTypes.node,
  renderButtonContent: PropTypes.func,
  renderPageContent: PropTypes.func,
};

export default AuthenticationPage;
