import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import c from 'classnames';
import { Link } from 'react-router-dom';
import { status } from 'Constants/publishModes';
import { Icon, Dropdown, DropdownItem } from 'UI';
import { stripProtocol } from 'Lib/urlHelper';
import i18n from '../../i18n';

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
    const { onPersist, onPersistAndNew, isPersisting, hasChanged, isNewEntry } = this.props;
    if (!isNewEntry && !hasChanged) {
      return <div className="nc-entryEditor-toolbar-statusPublished">{i18n.t("Published")}</div>;
    }
    return (
      <div>
        <Dropdown
          className="nc-entryEditor-toolbar-dropdown"
          classNameButton="nc-entryEditor-toolbar-publishButton"
          dropdownTopOverlap="40px"
          dropdownWidth="150px"
          label={isPersisting ? i18n.t('publishing') : i18n.t('Publish')}
        >
          <DropdownItem label={i18n.t("Publish now")} icon="arrow" iconDirection="right" onClick={onPersist}/>
          <DropdownItem label={i18n.t("Publish and create new")} icon="add" onClick={onPersistAndNew}/>
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

    const deleteLabel = (hasUnpublishedChanges && isModification && i18n.t('Delete unpublished changes'))
      || (hasUnpublishedChanges && (isNewEntry || !isModification) && i18n.t('Delete unpublished entry'))
      || (!hasUnpublishedChanges && !isModification && 'Delete published entry');

    return [
        <button
          className="nc-entryEditor-toolbar-saveButton"
          onClick={() => hasChanged && onPersist()}
        >
          {isPersisting ? i18n.t('saving') : i18n.t('save')}
        </button>,
        isNewEntry || !deleteLabel ? null
            : <button
                className="nc-entryEditor-toolbar-deleteButton"
                onClick={hasUnpublishedChanges ? onDeleteUnpublishedChanges : onDelete}
              >
                {isDeleting ? i18n.t('deleting') : deleteLabel}
              </button>,
    ];
  };

  renderWorkflowPublishControls = () => {
    const {
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
          label={isUpdatingStatus ? i18n.t('Updating...') : i18n.t('Set status')}
        >
          <DropdownItem
            className="nc-entryEditor-toolbar-statusMenu-status"
            label={i18n.t("Draft")}
            onClick={() => onChangeStatus('DRAFT')}
            icon={currentStatus === status.get('DRAFT') && 'check'}
          />
          <DropdownItem
            className="nc-entryEditor-toolbar-statusMenu-status"
            label={i18n.t("In review")}
            onClick={() => onChangeStatus('PENDING_REVIEW')}
            icon={currentStatus === status.get('PENDING_REVIEW') && 'check'}
          />
          <DropdownItem
            className="nc-entryEditor-toolbar-statusMenu-status"
            label={i18n.t("Ready")}
            onClick={() => onChangeStatus('PENDING_PUBLISH')}
            icon={currentStatus === status.get('PENDING_PUBLISH') && 'check'}
          />
        </Dropdown>,
        <Dropdown
          className="nc-entryEditor-toolbar-dropdown"
          classNameButton="nc-entryEditor-toolbar-publishButton"
          dropdownTopOverlap="40px"
          dropdownWidth="150px"
          label={isPublishing ? i18n.t('publishing') : i18n.t('Publish')}
        >
          <DropdownItem label={i18n.t("Publish now")} icon="arrow" iconDirection="right" onClick={onPublish}/>
          <DropdownItem label={i18n.t("Publish and create new")} icon="add" onClick={onPublishAndNew}/>
        </Dropdown>
      ];
    }

    if (!isNewEntry) {
      return <div className="nc-entryEditor-toolbar-statusPublished">{i18n.t("Published")}</div>;
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
              {i18n.t('Writing in')} <strong>{collection.get('label')}</strong> {i18n.t('collection')}
            </div>
            {
              hasChanged
               ? <div className="nc-entryEditor-toolbar-backStatus-hasChanged">{i18n.t('Unsaved Changes')}</div>
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
            <DropdownItem label={i18n.t("logout")} onClick={onLogoutClick}/>
          </Dropdown>
        </div>
      </div>
    );
  }
};
