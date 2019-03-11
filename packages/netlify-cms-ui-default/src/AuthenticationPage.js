import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Icon from './Icon';
import { buttons, shadows } from './styles';

const StyledAuthenticationPage = styled.section`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const CustomIconWrapper = styled.span`
  width: 300px;
  height: 200px;
  margin-top: -150px;
`;

const NetlifyLogoIcon = styled(Icon)`
  color: #c4c6d2;
  margin-top: -300px;
`;

const NetlifyCreditIcon = styled(Icon)`
  color: #c4c6d2;
  position: absolute;
  bottom: 10px;
`;

const CustomLogoIcon = ({ url }) => {
  return (
    <CustomIconWrapper>
      <img src={url} alt="Logo" />
    </CustomIconWrapper>
  );
};

const renderPageLogo = logoUrl => {
  if (logoUrl) {
    return <CustomLogoIcon url={logoUrl} />;
  }
  return <NetlifyLogoIcon size="300px" type="netlify-cms" />;
};

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
  logoUrl,
}) => {
  return (
    <StyledAuthenticationPage>
      {renderPageLogo(logoUrl)}
      {loginErrorMessage ? <p>{loginErrorMessage}</p> : null}
      {!renderPageContent ? null : renderPageContent()}
      {!renderButtonContent ? null : (
        <LoginButton disabled={loginDisabled} onClick={onLogin}>
          {renderButtonContent()}
        </LoginButton>
      )}
      {logoUrl ? <NetlifyCreditIcon size="100px" type="netlify-cms" /> : null}
    </StyledAuthenticationPage>
  );
};

AuthenticationPage.propTypes = {
  onLogin: PropTypes.func,
  logoUrl: PropTypes.string,
  loginDisabled: PropTypes.bool,
  loginErrorMessage: PropTypes.node,
  renderButtonContent: PropTypes.func,
  renderPageContent: PropTypes.func,
};

export default AuthenticationPage;
