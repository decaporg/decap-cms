import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Icon, Dropdown, DropdownItem } from 'UI';
import { stripProtocol } from 'Lib/urlHelper';

const EditorToolbar = (
  {
    isPersisting,
    onPersist,
    enableSave,
    showDelete,
    onDelete,
    onCancelEdit,
    user,
    hasChanged,
    displayUrl,
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
        <Dropdown label={isPersisting ? 'Saving...' : 'Save and Publish'}>
          <DropdownItem label="Save and publish" icon="folder" onClick={onPersist}/>
          <DropdownItem label="Save, publish, and create new" icon="add" onClick={onPersist}/>
        </Dropdown>
      </div>
      <div className="nc-entryEditor-toolbar-metaSection">
        {
          displayUrl
            ? <a className="nc-appHeader-siteLink" href={displayUrl} target="_blank">
                {stripProtocol(displayUrl)}
              </a>
            : null
        }
        <button className="nc-appHeader-avatar">
          {
            avatarUrl
              ? <img className="nc-appHeader-avatar-image" src={user.get('avatar_url')}/>
              : <Icon className="nc-appHeader-avatar-placeholder" type="user" size="large"/>
          }
        </button>
      </div>
    </div>
  );
};

EditorToolbar.propTypes = {
  isPersisting: PropTypes.bool,
  onPersist: PropTypes.func.isRequired,
  enableSave: PropTypes.bool.isRequired,
  showDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  user: ImmutablePropTypes.map,
  hasChanged: PropTypes.bool,
  displayUrl: PropTypes.string,
};

export default EditorToolbar;
