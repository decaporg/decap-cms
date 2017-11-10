import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import {
  Wrapper as Dropdown,
  Button as DropdownButton,
  Menu as DropdownList,
  MenuItem as DropdownItem,
} from 'react-aria-menubutton';
import Icon from '../../icons/Icon';

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
  const avatarUrl = user.get('avatar_url');
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
        <Dropdown className="nc-entryEditor-toolbar-saveDropdown" onSelection={handler => handler()}>
          <DropdownButton className="nc-entryEditor-toolbar-saveDropdownButton">
            { isPersisting ? 'Saving...' : 'Save and Publish' }
          </DropdownButton>
          <DropdownList>
            <ul className="nc-entryEditor-toolbar-saveDropdownList">
              <DropdownItem className="nc-entryEditor-toolbar-saveDropdownItem" value={onPersist}>
                <span>Save and publish</span>
                <span className="nc-entryEditor-toolbar-saveDropdownItemIcon">
                  <Icon type="folder" direction="right" size="small"/>
                </span>
              </DropdownItem>
              <DropdownItem className="nc-entryEditor-toolbar-saveDropdownItem" value={onPersist}>
                <span>Save, publish, and create new</span>
                <span className="nc-entryEditor-toolbar-saveDropdownItemIcon">
                  <Icon type="add" size="small"/>
                </span>
              </DropdownItem>
            </ul>
          </DropdownList>
        </Dropdown>
      </div>
      <div className="nc-entryEditor-toolbar-metaSection">
        <a className="nc-appHeader-siteLink" href="http://olddvdscreensaver.com" target="_blank">
          olddvdscreensaver.com
        </a>
        <button className="nc-appHeader-avatar">
          {
            avatarUrl
              ? <img className="nc-appHeader-avatar-image" src={user.get('avatar_url')}/>
              : <Icon className="nc-appHeader-avatar-placeholder" type="user"/>
          }
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
