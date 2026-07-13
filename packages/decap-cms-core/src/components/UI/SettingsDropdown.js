import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import {
  Icon,
  Dropdown,
  DropdownItem,
  DropdownButton,
  colors,
  shadows,
} from 'decap-cms-ui-default';

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

const AppHeaderLink = css`
  font-size: 14px;
  font-weight: 400;
  color: ${colors.text};
  padding: 10px 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AppHeaderSiteLink = styled.a(AppHeaderLink);

const AppHeaderTestRepoIndicator = styled.a`
  ${AppHeaderLink};

  @media (max-width: 399px) {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    background-color: ${colors.background};
    padding: 4px 12px;
    border-radius: 0 0 4px 4px;
    ${shadows.drop}
  }
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

const SettingsWrapper = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

function SettingsDropdown({ displayUrl, isTestRepo, imageUrl, onLogoutClick, t }) {
  return (
    <SettingsWrapper>
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
          <AvatarDropdownButton aria-label={t('ui.settingsDropdown.account')}>
            <Avatar imageUrl={imageUrl} />
          </AvatarDropdownButton>
        )}
      >
        <DropdownItem label={t('ui.settingsDropdown.logOut')} onClick={onLogoutClick} />
      </Dropdown>
    </SettingsWrapper>
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
