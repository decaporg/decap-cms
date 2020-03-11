import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import LogoTile from '../LogoTile';
import Icon from '../Icon';
import { Button, IconButton } from '../Button';
import UserMenu from '../UserMenu';
import { Menu, MenuItem } from '../Menu';
import { isWindowDown } from '../utils/responsive';
import { useUIContext } from '../hooks';

const AppBarWrap = styled.div`
  background-color: ${({ theme }) => theme.color.surface};
  box-shadow: 0 2px 4px 0
    ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(121, 130, 145, 0.2)')};
  height: 3.5rem;
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 100;
`;
const TitleWrap = styled.div`
  padding: 0.5rem 0;
  margin-right: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;
const Title = styled.div`
  color: ${({ theme }) => theme.color.highEmphasis};
  font-weight: bold;
`;
const Breadcrumbs = styled.div`
  display: flex;
  font-size: ${({ hasTitle }) => (hasTitle ? `0.75rem` : `1rem`)};
  font-weight: bold;
  color: ${({ theme, hasTitle }) =>
    hasTitle ? theme.color.lowEmphasis : theme.color.highEmphasis};
  align-items: center;
  margin-top: 0.125rem;
`;
const Breadcrumb = styled.div`
  margin-right: 0.25rem;
`;
const BreadcrumbSeparator = styled(Icon)`
  margin-right: 0.25rem;
  color: ${({ theme }) => theme.color.neutral['400']};
`;
BreadcrumbSeparator.defaultProps = {
  name: 'chevron-right',
};
const ActionsWrap = styled.div`
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  ${({ noBorder, theme }) => (noBorder ? `` : `box-shadow: -1px 0 0 0 ${theme.color.border}`)};
`;
const StyledUserMenu = styled(UserMenu)`
  margin-left: 0.5rem;
`;
const StartWrap = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;
const EndWrap = styled.div`
  display: flex;
  align-items: center;
`;

const AppBar = ({ breadcrumbs, renderStartContent, renderEndContent }) => {
  const [notifMenuAnchorEl, setNotifMenuAnchorEl] = useState(null);
  const [isMobile, setIsMobile] = useState(isWindowDown('xs'));
  const { pageTitle } = useUIContext();
  const handleResize = () => setIsMobile(isWindowDown('xs'));

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AppBarWrap>
      {isMobile ? (
        <ActionsWrap noBorder>
          <IconButton icon="arrow-left" />
        </ActionsWrap>
      ) : (
        <LogoTile />
      )}
      <StartWrap>
        <TitleWrap>
          {pageTitle && <Title>{pageTitle}</Title>}
          {breadcrumbs && (
            <Breadcrumbs hasTitle={!!pageTitle}>
              {!isMobile &&
                breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.label}>
                    <Breadcrumb>{breadcrumb.label}</Breadcrumb>
                    {breadcrumbs.length !== index + 1 && (
                      <BreadcrumbSeparator size={pageTitle ? '0.75rem' : '1rem'} />
                    )}
                  </React.Fragment>
                ))}
            </Breadcrumbs>
          )}
        </TitleWrap>
        {renderStartContent && renderStartContent()}
      </StartWrap>
      <EndWrap>
        {renderEndContent && renderEndContent()}
        {!isMobile && (
          <ActionsWrap>
            <Button icon="bell" onClick={e => setNotifMenuAnchorEl(e.currentTarget)} />
            <Menu
              anchorEl={notifMenuAnchorEl}
              open={!!notifMenuAnchorEl}
              onClose={() => setNotifMenuAnchorEl(null)}
              anchorOrigin={{ y: 'bottom', x: 'right' }}
            >
              <MenuItem onClick={() => setNotifMenuAnchorEl(null)}>No new notifications</MenuItem>
            </Menu>
            <StyledUserMenu />
          </ActionsWrap>
        )}
      </EndWrap>
    </AppBarWrap>
  );
};

export default AppBar;
