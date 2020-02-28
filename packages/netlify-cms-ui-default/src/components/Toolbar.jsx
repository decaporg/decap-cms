import React, { useState } from 'react';
import styled from '@emotion/styled';
import LogoTile from './LogoTile';
import Icon from './Icon';
import Button from './Button';
import IconButton from './IconButton';
import ButtonGroup from './ButtonGroup';
import UserMenu from './UserMenu';
import { Menu, MenuItem } from './Menu';
import Dialog from './Dialog';
import { toast } from './Toast';

const ToolbarWrap = styled.div`
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
  flex: 1;
  padding: 0.5rem 0;
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
  font-size: 0.75rem;
  font-weight: bold;
  color: ${({ theme }) => theme.color.lowEmphasis};
  align-items: center;
  margin-top: 0.125rem;
`;
const Breadcrumb = styled.div`
  margin-right: 0.25rem;
`;
const BreadcrumbSeparator = styled(Icon).attrs(() => ({
  name: 'chevron-right',
  size: '0.75rem',
}))`
  margin-right: 0.25rem;
  color: ${({ theme }) => theme.color.neutral['400']};
`;
const ActionsWrap = styled.div`
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  ${({ noBorder, theme }) => (noBorder ? `` : `box-shadow: 1px 0 0 0 ${theme.color.border}`)};
`;
const PublishButton = styled(Button)`
  margin-left: 0.5rem;
`;

const languages = [
  { label: 'English', name: 'EN' },
  { label: 'Spanish', name: 'ES' },
  { label: 'Potugeuese', name: 'PT' },
  { label: 'Italian', name: 'IT' },
  { label: 'French', name: 'FR' },
  { label: 'German', name: 'DE' },
  { label: 'Russian', name: 'RU' },
  { label: 'Chinese', name: 'ZH' },
  { label: 'Japanese', name: 'JP' },
];

const Toolbar = ({ title, breadcrumbs, darkMode, setDarkMode, isMobile }) => {
  const [languageMenuAnchorEl, setLanguageMenuAnchorEl] = useState(null);
  const [publishMenuAnchorEl, setPublishMenuAnchorEl] = useState(null);
  const [postMenuAnchorEl, setPostMenuAnchorEl] = useState(null);
  const [notifMenuAnchorEl, setNotifMenuAnchorEl] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  function handleClose() {
    setLanguageMenuAnchorEl(null);
    setPublishMenuAnchorEl(null);
    setPostMenuAnchorEl(null);
    setNotifMenuAnchorEl(null);
  }

  return (
    <ToolbarWrap>
      {isMobile ? (
        <ActionsWrap noBorder>
          <IconButton icon="arrow-left" />
        </ActionsWrap>
      ) : (
        <LogoTile />
      )}
      <TitleWrap>
        {title && <Title>{title}</Title>}
        {breadcrumbs && (
          <Breadcrumbs>
            {!isMobile &&
              breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment>
                  <Breadcrumb>{breadcrumb.label}</Breadcrumb>
                  {breadcrumbs.length !== index + 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
          </Breadcrumbs>
        )}
      </TitleWrap>
      <ActionsWrap>
        {!isMobile && (
          <>
            <Button
              icon="globe"
              transparent
              dropdown
              onClick={e => setLanguageMenuAnchorEl(e.currentTarget)}
            >
              {selectedLanguage}
            </Button>
            <Menu
              anchorEl={languageMenuAnchorEl}
              open={!!languageMenuAnchorEl}
              onClose={() => setLanguageMenuAnchorEl(null)}
              anchorOrigin={{ y: 'bottom', x: 'right' }}
            >
              {languages.map(language => (
                <MenuItem
                  selected={selectedLanguage === language.name}
                  onClick={() => {
                    setSelectedLanguage(language.name);
                    handleClose();
                  }}
                >
                  {language.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        <Button icon="more-vertical" onClick={e => setPostMenuAnchorEl(e.currentTarget)} />
        <Menu
          anchorEl={postMenuAnchorEl}
          open={!!postMenuAnchorEl}
          onClose={() => setPostMenuAnchorEl(null)}
          anchorOrigin={{ y: 'bottom', x: 'right' }}
        >
          <MenuItem icon="eye" onClick={handleClose}>
            Preview
          </MenuItem>
          <MenuItem icon="external-link" onClick={handleClose}>
            View Live
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              handleClose();
            }}
            icon="trash-2"
            type="danger"
          >
            Delete Post
          </MenuItem>
        </Menu>
        <PublishButton
          icon="radio"
          primary
          type="success"
          dropdown
          onClick={e => setPublishMenuAnchorEl(e.currentTarget)}
        >
          Publish
        </PublishButton>
        <Menu
          anchorEl={publishMenuAnchorEl}
          open={!!publishMenuAnchorEl}
          onClose={() => setPublishMenuAnchorEl(null)}
          anchorOrigin={{ y: 'bottom', x: 'right' }}
        >
          <MenuItem
            icon="radio"
            onClick={() => {
              handleClose();
              toast({
                content: 'Post published successfully.',
                type: 'success',
              });
            }}
          >
            Publish
          </MenuItem>
          <MenuItem icon="plus-circle" onClick={handleClose}>
            Publish and add new
          </MenuItem>
        </Menu>
      </ActionsWrap>
      {!isMobile && (
        <ActionsWrap>
          <Button icon="bell" onClick={e => setNotifMenuAnchorEl(e.currentTarget)} />
          <Menu
            anchorEl={notifMenuAnchorEl}
            open={!!notifMenuAnchorEl}
            onClose={() => setNotifMenuAnchorEl(null)}
            anchorOrigin={{ y: 'bottom', x: 'right' }}
          >
            <MenuItem onClick={handleClose}>No new notifications</MenuItem>
          </Menu>
          <UserMenu darkMode={darkMode} setDarkMode={setDarkMode} />
        </ActionsWrap>
      )}
      <Dialog
        title="Are you sure?"
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        actions={
          <ButtonGroup>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button primary type="danger" onClick={() => setDeleteDialogOpen(false)}>
              Delete
            </Button>
          </ButtonGroup>
        }
      >
        Are you sure you want to delete this post? This action cannot be undone.
      </Dialog>
    </ToolbarWrap>
  );
};

export default Toolbar;
