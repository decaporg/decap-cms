import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean, text, object } from '@storybook/addon-knobs';

import AppBar from '.';

import { isWindowDown } from '../utils/responsive';

import { Button, ButtonGroup } from '../Button';
import { Menu, MenuItem } from '../Menu';
import Dialog from '../Dialog';
import { toast } from '../Toast';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.color.background};
`;

const PublishButton = styled(Button)`
  margin-left: 0.5rem;
`;

export default {
  title: 'Components/AppBar',
  decorators: [withKnobs],
};

export const _AppBar = () => {
  const title = text('title', 'Post Title');
  const breadcrumbs = [{ label: 'My Website' }, { label: 'Posts' }];
  const renderStart = boolean('renderStart', false);
  const renderEnd = boolean('renderEnd', false);

  return (
    <Wrap>
      <AppBar
        title={title}
        breadcrumbs={object('breadcrumbs', breadcrumbs)}
        renderStart={renderStart ? () => <StartContent /> : null}
        renderEnd={renderEnd ? () => <EndContent /> : null}
      />
    </Wrap>
  );
};

_AppBar.story = {
  name: 'AppBar',
};

const StartContent = () => {
  return <div>Start content</div>;
};

const EndContent = () => {
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

  const [languageMenuAnchorEl, setLanguageMenuAnchorEl] = useState(null);
  const [publishMenuAnchorEl, setPublishMenuAnchorEl] = useState(null);
  const [postMenuAnchorEl, setPostMenuAnchorEl] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isMobile = isWindowDown('xs');

  function handleClose() {
    setLanguageMenuAnchorEl(null);
    setPublishMenuAnchorEl(null);
    setPostMenuAnchorEl(null);
  }

  return (
    <div>
      {!isMobile && (
        <>
          <Button
            icon="globe"
            transparent
            hasMenu
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
                key={language.name}
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
        hasMenu
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
    </div>
  );
};
