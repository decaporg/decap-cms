import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import { Button } from 'react-toolbox/lib/button';
import {
  Wrapper as Dropdown,
  Button as DropdownButton,
  Menu as DropdownList,
  MenuItem as DropdownItem,
} from 'react-aria-menubutton';

const EntryEditorToolbar = (
  {
    isPersisting,
    onPersist,
    enableSave,
    showDelete,
    onDelete,
    onCancelEdit,
    user,
    hasChanged,
  }) => {
  const disabled = !enableSave || isPersisting;
  return (
    <div className="nc-entryEditor-toolbar">
      <div onClick={onCancelEdit} className="nc-entryEditor-toolbar-backSection">
        <div className="nc-entryEditor-toolbar-backArrow">←</div>
        <div>
          <div className="nc-entryEditor-toolbar-backCollection">Writing in Posts collection</div>
          {
            hasChanged
             ? <div className="nc-entryEditor-toolbar-backStatus-hasChanged">Unsaved Changes</div>
             : <div className="nc-entryEditor-toolbar-backStatus">Changes saved &#10003;</div>
          }
        </div>
      </div>
      <div className="nc-entryEditor-toolbar-mainSection">
        {
          showDelete
            ? <button className="nc-entryEditor-toolbar-deleteButton" onClick={onDelete}>Delete</button>
            : null
        }
        <button className="nc-entryEditor-toolbar-saveButton" onClick={onPersist} disabled={disabled}>
        </button>
        <Dropdown className="nc-entryEditor-toolbar-saveDropdown">
          <DropdownButton className="nc-entryEditor-toolbar-saveDropdownButton">
            { isPersisting ? 'Saving...' : 'Save and Publish' }
          </DropdownButton>
          <DropdownList>
            <ul className="nc-entryEditor-toolbar-saveDropdownList">
              <DropdownItem className="nc-entryEditor-toolbar-saveDropdownItem">Save and publish</DropdownItem>
              <DropdownItem className="nc-entryEditor-toolbar-saveDropdownItem">Save, publish, and create new</DropdownItem>
            </ul>
          </DropdownList>
        </Dropdown>
      </div>
      <div className="nc-entryEditor-toolbar-metaSection">
        <a className="nc-appHeader-siteLink" href="http://olddvdscreensaver.com" target="_blank">
          olddvdscreensaver.com
        </a>
        <button className="nc-appHeader-avatar">
          <img src={user.get('avatar_url')}/>
        </button>
      </div>
    </div>
  );
};

EntryEditorToolbar.propTypes = {
  isPersisting: PropTypes.bool,
  onPersist: PropTypes.func.isRequired,
  enableSave: PropTypes.bool.isRequired,
  showDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  user: ImmutablePropTypes.map,
  hasChanged: PropTypes.bool,
};

export default EntryEditorToolbar;
