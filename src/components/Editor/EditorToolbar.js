import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Link } from 'react-router-dom';
import { Icon, Dropdown, DropdownItem } from 'UI';
import { stripProtocol } from 'Lib/urlHelper';

const EditorToolbar = (
  {
    isPersisting,
    onPersist,
    onPersistAndNew,
    enableSave,
    showDelete,
    onDelete,
    user,
    hasChanged,
    displayUrl,
    collection,
    hasWorkflow,
  }) => {
  const disabled = !enableSave || isPersisting;
  const avatarUrl = user.get('avatar_url');
  return (
    <div className="nc-entryEditor-toolbar">
      <Link to={`/collections/${collection.get('name')}`} className="nc-entryEditor-toolbar-backSection">
        <div className="nc-entryEditor-toolbar-backArrow">←</div>
        <div>
          <div className="nc-entryEditor-toolbar-backCollection">
            Writing in <strong>{collection.get('label')}</strong> collection
          </div>
          {
            hasChanged
             ? <div className="nc-entryEditor-toolbar-backStatus-hasChanged">Unsaved Changes</div>
             : <div className="nc-entryEditor-toolbar-backStatus">Changes saved &#10004;</div>
          }
        </div>
      </Link>
      <div className="nc-entryEditor-toolbar-mainSection">
        <div className="nc-entryEditor-toolbar-mainSection-left">
          {
            showDelete
              ? <button className="nc-entryEditor-toolbar-deleteButton" onClick={onDelete}>Delete</button>
              : null
          }
        </div>
        <div className="nc-entryEditor-toolbar-mainSection-right">
          <Dropdown
            dropdownTopOverlap="40px"
            dropdownWidth="150px"
            label={isPersisting ? 'Publishing...' : 'Publish'}
          >
            <DropdownItem label="Publish now" icon="arrow" iconDirection="right" onClick={onPersist}/>
            <DropdownItem label="Publish and create new" icon="add" onClick={onPersistAndNew}/>
          </Dropdown>
        </div>
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
  onPersistAndNew: PropTypes.func.isRequired,
  enableSave: PropTypes.bool.isRequired,
  showDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  user: ImmutablePropTypes.map,
  hasChanged: PropTypes.bool,
  displayUrl: PropTypes.string,
  collection: ImmutablePropTypes.map.isRequired,
  hasWorkflow: PropTypes.bool,
};

export default EditorToolbar;
