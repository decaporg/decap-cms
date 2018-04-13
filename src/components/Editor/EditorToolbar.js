import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import c from 'classnames';
import { Link } from 'react-router-dom';
import { status } from 'Constants/publishModes';
import { Icon, Dropdown, DropdownItem } from 'UI';
import { stripProtocol } from 'Lib/urlHelper';

export default class EditorToolbar extends React.Component {
  static propTypes = {
    isPersisting: PropTypes.bool,
    isPublishing: PropTypes.bool,
    isUpdatingStatus: PropTypes.bool,
    isDeleting: PropTypes.bool,
    onPersist: PropTypes.func.isRequired,
    onPersistAndNew: PropTypes.func.isRequired,
    enableSave: PropTypes.bool.isRequired,
    showDelete: PropTypes.bool.isRequired,
    onDelete: PropTypes.func.isRequired,
    onDeleteUnpublishedChanges: PropTypes.func.isRequired,
    onChangeStatus: PropTypes.func.isRequired,
    onPublish: PropTypes.func.isRequired,
    onPublishAndNew: PropTypes.func.isRequired,
    user: ImmutablePropTypes.map,
    hasChanged: PropTypes.bool,
    displayUrl: PropTypes.string,
    collection: ImmutablePropTypes.map.isRequired,
    hasWorkflow: PropTypes.bool,
    hasUnpublishedChanges: PropTypes.bool,
    isNewEntry: PropTypes.bool,
    isModification: PropTypes.bool,
    currentStatus: PropTypes.string,
    onLogoutClick: PropTypes.func.isRequired,
  };

  renderSimpleSaveControls = () => {
    const { showDelete, onDelete } = this.props;
    return (
      <div>
        {
          showDelete
            ? <button className="nc-entryEditor-toolbar-deleteButton" onClick={onDelete}>
                Delete entry
              </button>
            : null
        }
      </div>
    );
  };

  renderSimplePublishControls = () => {
    const { collection, onPersist, onPersistAndNew, isPersisting, hasChanged, isNewEntry } = this.props;
    if (!isNewEntry && !hasChanged) {
      return <div className="nc-entryEditor-toolbar-statusPublished">Published</div>;
    }
    return (
      <div>
        <Dropdown
          className="nc-entryEditor-toolbar-dropdown"
          classNameButton="nc-entryEditor-toolbar-publishButton"
          dropdownTopOverlap="40px"
          dropdownWidth="150px"
          label={isPersisting ? 'Publishing...' : 'Publish'}
        >
          <DropdownItem label="Publish now" icon="arrow" iconDirection="right" onClick={onPersist}/>
          {
            collection.get('create')
              ? <DropdownItem label="Publish and create new" icon="add" onClick={onPersistAndNew}/>
              : null
          }
        </Dropdown>
      </div>
    );
  };

  renderWorkflowSaveControls = () => {
    const {
      onPersist,
      onDelete,
      onDeleteUnpublishedChanges,
      hasChanged,
      hasUnpublishedChanges,
      isPersisting,
      isDeleting,
      isNewEntry,
      isModification,
    } = this.props;

    const deleteLabel = (hasUnpublishedChanges && isModification && 'Delete unpublished changes')
      || (hasUnpublishedChanges && (isNewEntry || !isModification) && 'Delete unpublished entry')
      || (!hasUnpublishedChanges && !isModification && 'Delete published entry');

    return [
        <button
          key="save-button"
          className="nc-entryEditor-toolbar-saveButton"
          onClick={() => hasChanged && onPersist()}
        >
          {isPersisting ? 'Saving...' : 'Save'}
        </button>,
        isNewEntry || !deleteLabel ? null
            : <button
                key="delete-button"
                className="nc-entryEditor-toolbar-deleteButton"
                onClick={hasUnpublishedChanges ? onDeleteUnpublishedChanges : onDelete}
              >
                {isDeleting ? 'Deleting...' : deleteLabel}
              </button>,
    ];
  };

  renderWorkflowPublishControls = () => {
    const {
      collection,
      onPersist,
      onPersistAndNew,
      isUpdatingStatus,
      isPublishing,
      onChangeStatus,
      onPublish,
      onPublishAndNew,
      currentStatus,
      isNewEntry,
    } = this.props;
    if (currentStatus) {
      return [
        <Dropdown
          className="nc-entryEditor-toolbar-dropdown"
          classNameButton="nc-entryEditor-toolbar-statusButton"
          dropdownTopOverlap="40px"
          dropdownWidth="120px"
          label={isUpdatingStatus ? 'Updating...' : 'Set status'}
        >
          <DropdownItem
            className="nc-entryEditor-toolbar-statusMenu-status"
            label="Draft"
            onClick={() => onChangeStatus('DRAFT')}
            icon={currentStatus === status.get('DRAFT') && 'check'}
          />
          <DropdownItem
            className="nc-entryEditor-toolbar-statusMenu-status"
            label="In review"
            onClick={() => onChangeStatus('PENDING_REVIEW')}
            icon={currentStatus === status.get('PENDING_REVIEW') && 'check'}
          />
          <DropdownItem
            className="nc-entryEditor-toolbar-statusMenu-status"
            label="Ready"
            onClick={() => onChangeStatus('PENDING_PUBLISH')}
            icon={currentStatus === status.get('PENDING_PUBLISH') && 'check'}
          />
        </Dropdown>,
        <Dropdown
          className="nc-entryEditor-toolbar-dropdown"
          classNameButton="nc-entryEditor-toolbar-publishButton"
          dropdownTopOverlap="40px"
          dropdownWidth="150px"
          label={isPublishing ? 'Publishing...' : 'Publish'}
        >
          <DropdownItem label="Publish now" icon="arrow" iconDirection="right" onClick={onPublish}/>
          {
            collection.get('create')
              ? <DropdownItem label="Publish and create new" icon="add" onClick={onPublishAndNew}/>
              : null
          }
        </Dropdown>
      ];
    }

    if (!isNewEntry) {
      return <div className="nc-entryEditor-toolbar-statusPublished">Published</div>;
    }
  };



  render() {
    const {
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
      hasUnpublishedChanges,
      onLogoutClick,
    } = this.props;
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
               : <div className="nc-entryEditor-toolbar-backStatus">Changes saved</div>
            }
          </div>
        </Link>
        <div className="nc-entryEditor-toolbar-mainSection">
          <div className="nc-entryEditor-toolbar-mainSection-left">
            { hasWorkflow ? this.renderWorkflowSaveControls() : this.renderSimpleSaveControls() }
          </div>
          <div className="nc-entryEditor-toolbar-mainSection-right">
            { hasWorkflow ? this.renderWorkflowPublishControls() : this.renderSimplePublishControls() }
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
          <Dropdown
            dropdownTopOverlap="50px"
            dropdownWidth="100px"
            dropdownPosition="right"
            button={
              <button className="nc-appHeader-avatar">
                {
                  avatarUrl
                    ? <img className="nc-appHeader-avatar-image" src={user.get('avatar_url')}/>
                    : <Icon className="nc-appHeader-avatar-placeholder" type="user" size="large"/>
                }
              </button>
            }
          >
            <DropdownItem label="Log Out" onClick={onLogoutClick}/>
          </Dropdown>
        </div>
      </div>
    );
  }
};
