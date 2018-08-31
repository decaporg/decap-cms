import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'react-emotion';
import { Icon, Dropdown, DropdownItem, DropdownButton, colors } from 'netlify-cms-ui-default';
import { stripProtocol } from 'Lib/urlHelper';

const styles = {
  avatarImage: css`
    width: 32px;
    border-radius: 32px;
  `,
};

const AppHeaderAvatar = styled.button`
  border: 0;
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

const Avatar = ({ imageUrl }) => (
  <AppHeaderAvatar>
    {imageUrl ? <AvatarImage src={imageUrl} /> : <AvatarPlaceholderIcon type="user" size="large" />}
  </AppHeaderAvatar>
);

Avatar.propTypes = {
  imageUrl: PropTypes.string,
};

const SettingsDropdown = ({ displayUrl, imageUrl, onLogoutClick }) => (
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
        <DropdownButton>
          <Avatar imageUrl={imageUrl} />
        </DropdownButton>
      )}
    >
      <DropdownItem label="Log Out" onClick={onLogoutClick} />
    </Dropdown>
  </React.Fragment>
);

SettingsDropdown.propTypes = {
  displayUrl: PropTypes.string,
  imageUrl: PropTypes.string,
  onLogoutClick: PropTypes.func.isRequired,
};

export default SettingsDropdown;
