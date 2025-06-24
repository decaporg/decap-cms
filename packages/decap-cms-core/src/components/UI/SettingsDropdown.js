import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Icon, Dropdown, DropdownItem, DropdownButton, colors } from 'decap-cms-ui-default';

import { stripProtocol } from '../../lib/urlHelper';

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

const AppHeaderTestRepoIndicator = styled.a`
  font-size: 14px;
  font-weight: 400;
  color: #7b8290;
  padding: 10px 16px;
`;

function Avatar({ imageUrl }) {
  return imageUrl ? (
    <AvatarImage src={imageUrl} />
  ) : (
    <AvatarPlaceholderIcon type="user" size="large" />
  );
}

Avatar.propTypes = {
  imageUrl: PropTypes.string,
};

function SettingsDropdown({ displayUrl, isTestRepo, imageUrl, onLogoutClick, t }) {
  return (
    <React.Fragment>
      {isTestRepo && (
        <AppHeaderTestRepoIndicator
          href="https://www.decapcms.org/docs/test-backend"
          target="_blank"
          rel="noopener noreferrer"
        >
          Test Backend ↗
        </AppHeaderTestRepoIndicator>
      )}
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
}

SettingsDropdown.propTypes = {
  displayUrl: PropTypes.string,
  isTestRepo: PropTypes.bool,
  imageUrl: PropTypes.string,
  onLogoutClick: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default translate()(SettingsDropdown);
