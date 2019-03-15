import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Icon, Dropdown, DropdownItem, DropdownButton, colors } from 'netlify-cms-ui-default';
import { stripProtocol } from 'Lib/urlHelper';

const styles = {
  avatarImage: css`
    width: 32px;
    border-radius: 32px;
  `,
};

const AvatarDropdownButton = styled(DropdownButton)`
  display: inline-block;
  padding: 8px;
  cursor: pointer;
  color: #1e2532;
  background-color: transparent;
`;

const AvatarImage = styled.img`
  ${styles.avatarImage};
`;

const AvatarPlaceholderIcon = styled(Icon)`
  ${styles.avatarImage};
  height: 32px;
  color: #1e2532;
  background-color: ${colors.textFieldBorder};
`;

const AppHeaderSiteLink = styled.a`
  font-size: 14px;
  font-weight: 400;
  color: #7b8290;
  padding: 10px 16px;
`;

const Avatar = ({ imageUrl }) =>
  imageUrl ? <AvatarImage src={imageUrl} /> : <AvatarPlaceholderIcon type="user" size="large" />;

Avatar.propTypes = {
  imageUrl: PropTypes.string,
};

const SettingsDropdown = ({ displayUrl, imageUrl, onLogoutClick, t }) => (
  <React.Fragment>
    {displayUrl ? (
      <AppHeaderSiteLink href={displayUrl} target="_blank">
        {stripProtocol(displayUrl)}
      </AppHeaderSiteLink>
    ) : null}
    <Dropdown
      dropdownTopOverlap="50px"
      dropdownWidth="100px"
      dropdownPosition="right"
      renderButton={() => (
        <AvatarDropdownButton>
          <Avatar imageUrl={imageUrl} />
        </AvatarDropdownButton>
      )}
    >
      <DropdownItem label={t('ui.settingsDropdown.logOut')} onClick={onLogoutClick} />
    </Dropdown>
  </React.Fragment>
);

SettingsDropdown.propTypes = {
  displayUrl: PropTypes.string,
  imageUrl: PropTypes.string,
  onLogoutClick: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default translate()(SettingsDropdown);
