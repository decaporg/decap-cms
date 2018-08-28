import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled, { css } from 'react-emotion';
import { Link } from 'react-router-dom';
import {
  Icon,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  colorsRaw,
  colors,
  components,
  buttons,
  lengths,
} from 'netlify-cms-ui-default';
import { status } from 'Constants/publishModes';
import SettingsDropdown from 'UI/SettingsDropdown';

const styles = {
  buttonMargin: css`
    margin: 0 10px;
  `,
  toolbarSection: css`
    height: 100%;
    display: flex;
    align-items: center;
    border: 0 solid ${colors.textFieldBorder};
  `,
};

const ToolbarContainer = styled.div`
  box-shadow: 0 2px 6px 0 rgba(68, 74, 87, 0.05), 0 1px 3px 0 rgba(68, 74, 87, 0.1),
    0 2px 54px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  min-width: 800px;
  z-index: 300;
  background-color: #fff;
  height: 66px;
  display: flex;
  justify-content: space-between;
`;

const ToolbarSectionMain = styled.div`
  ${styles.toolbarSection};
  flex: 10;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
`;

const ToolbarSubSectionFirst = styled.div`
  display: flex;
`;

const ToolbarSubSectionLast = styled(ToolbarSubSectionFirst)`
  justify-content: flex-end;
`;

const ToolbarSectionBackLink = styled(Link)`
  ${styles.toolbarSection};
  border-right-width: 1px;
  font-weight: normal;
  padding: 0 20px;

  &:hover,
  &:focus {
    background-color: #f1f2f4;
  }
`;

const ToolbarSectionMeta = styled.div`
  ${styles.toolbarSection};
  border-left-width: 1px;
  padding: 0 7px;
`;

const ToolbarDropdown = styled(Dropdown)`
  ${styles.buttonMargin};

  ${Icon} {
    color: ${colorsRaw.teal};
  }
`;

const BackArrow = styled.div`
  color: ${colors.textLead};
  font-size: 21px;
  font-weight: 600;
  margin-right: 16px;
`;

const BackCollection = styled.div`
  color: ${colors.textLead};
  font-size: 14px;
`;

const BackStatus = styled.div`
  margin-top: 6px;
`;

const BackStatusUnchanged = styled(BackStatus)`
  ${components.textBadgeSuccess};

  &::after {
    height: 12px;
    width: 15.5px;
    color: ${colors.successText};
    margin-left: 5px;

    position: relative;
    top: 1px;

    content: url("data:image/svg+xml; utf8, <svg xmlns='http://www.w3.org/2000/svg' width='15' height='11'><path fill='#005614' fill-rule='nonzero' d='M4.016 11l-.648-.946a6.202 6.202 0 0 0-.157-.22 9.526 9.526 0 0 1-.096-.133l-.511-.7a7.413 7.413 0 0 0-.162-.214l-.102-.134-.265-.346a26.903 26.903 0 0 0-.543-.687l-.11-.136c-.143-.179-.291-.363-.442-.54l-.278-.332a8.854 8.854 0 0 0-.192-.225L.417 6.28l-.283-.324L0 5.805l1.376-1.602c.04.027.186.132.186.132l.377.272.129.095c.08.058.16.115.237.175l.37.28c.192.142.382.292.565.436l.162.126c.27.21.503.398.714.574l.477.393c.078.064.156.127.23.194l.433.375.171-.205A50.865 50.865 0 0 1 8.18 4.023a35.163 35.163 0 0 1 2.382-2.213c.207-.174.42-.349.635-.518l.328-.255.333-.245c.072-.055.146-.107.221-.159l.117-.083c.11-.077.225-.155.341-.23.163-.11.334-.217.503-.32l1.158 1.74a11.908 11.908 0 0 0-.64.55l-.065.06c-.07.062-.139.125-.207.192l-.258.249-.26.265c-.173.176-.345.357-.512.539a32.626 32.626 0 0 0-1.915 2.313 52.115 52.115 0 0 0-2.572 3.746l-.392.642-.19.322-.233.382H4.016z'/></svg>");
  }
`;

const BackStatusChanged = styled(BackStatus)`
  ${components.textBadgeDanger};
`;

const ToolbarButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${styles.buttonMargin};
  display: block;
`;

const DeleteButton = styled(ToolbarButton)`
  ${buttons.lightRed};
`;

const SaveButton = styled(ToolbarButton)`
  ${buttons.lightBlue};
`;

const StatusPublished = styled.div`
  ${styles.buttonMargin};
  border: 1px solid ${colors.textFieldBorder};
  border-radius: ${lengths.borderRadius};
  background-color: ${colorsRaw.white};
  color: ${colorsRaw.teal};
  padding: 0 24px;
  line-height: 36px;
  cursor: default;
  font-size: 14px;
  font-weight: 500;
`;

const PublishButton = styled(StyledDropdownButton)`
  background-color: ${colorsRaw.teal};
`;

const StatusButton = styled(StyledDropdownButton)`
  background-color: ${colorsRaw.tealLight};
  color: ${colorsRaw.teal};
`;

const StatusDropdownItem = styled(DropdownItem)`
  ${Icon} {
    color: ${colors.infoText};
  }
`;

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
    user: ImmutablePropTypes.map.isRequired,
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
      <div>{showDelete ? <DeleteButton onClick={onDelete}>Delete entry</DeleteButton> : null}</div>
    );
  };

  renderSimplePublishControls = () => {
    const {
      collection,
      onPersist,
      onPersistAndNew,
      isPersisting,
      hasChanged,
      isNewEntry,
    } = this.props;
    if (!isNewEntry && !hasChanged) {
      return <StatusPublished>Published</StatusPublished>;
    }
    return (
      <div>
        <ToolbarDropdown
          dropdownTopOverlap="40px"
          dropdownWidth="150px"
          renderButton={() => (
            <PublishButton>{isPersisting ? 'Publishing...' : 'Publish'}</PublishButton>
          )}
        >
          <DropdownItem
            label="Publish now"
            icon="arrow"
            iconDirection="right"
            onClick={onPersist}
          />
          {collection.get('create') ? (
            <DropdownItem label="Publish and create new" icon="add" onClick={onPersistAndNew} />
          ) : null}
        </ToolbarDropdown>
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

    const deleteLabel =
      (hasUnpublishedChanges && isModification && 'Delete unpublished changes') ||
      (hasUnpublishedChanges && (isNewEntry || !isModification) && 'Delete unpublished entry') ||
      (!hasUnpublishedChanges && !isModification && 'Delete published entry');

    return [
      <SaveButton key="save-button" onClick={() => hasChanged && onPersist()}>
        {isPersisting ? 'Saving...' : 'Save'}
      </SaveButton>,
      isNewEntry || !deleteLabel ? null : (
        <DeleteButton
          key="delete-button"
          onClick={hasUnpublishedChanges ? onDeleteUnpublishedChanges : onDelete}
        >
          {isDeleting ? 'Deleting...' : deleteLabel}
        </DeleteButton>
      ),
    ];
  };

  renderWorkflowPublishControls = () => {
    const {
      collection,
      isUpdatingStatus,
      isPublishing,
      onChangeStatus,
      onPublish,
      onPublishAndNew,
      currentStatus,
      isNewEntry,
    } = this.props;
    if (currentStatus) {
      return (
        <>
          <ToolbarDropdown
            dropdownTopOverlap="40px"
            dropdownWidth="120px"
            renderButton={() => (
              <StatusButton>{isUpdatingStatus ? 'Updating...' : 'Set status'}</StatusButton>
            )}
          >
            <StatusDropdownItem
              label="Draft"
              onClick={() => onChangeStatus('DRAFT')}
              icon={currentStatus === status.get('DRAFT') && 'check'}
            />
            <StatusDropdownItem
              label="In review"
              onClick={() => onChangeStatus('PENDING_REVIEW')}
              icon={currentStatus === status.get('PENDING_REVIEW') && 'check'}
            />
            <StatusDropdownItem
              label="Ready"
              onClick={() => onChangeStatus('PENDING_PUBLISH')}
              icon={currentStatus === status.get('PENDING_PUBLISH') && 'check'}
            />
          </ToolbarDropdown>
          <ToolbarDropdown
            dropdownTopOverlap="40px"
            dropdownWidth="150px"
            renderButton={() => (
              <PublishButton>{isPublishing ? 'Publishing...' : 'Publish'}</PublishButton>
            )}
          >
            <DropdownItem
              label="Publish now"
              icon="arrow"
              iconDirection="right"
              onClick={onPublish}
            />
            {collection.get('create') ? (
              <DropdownItem label="Publish and create new" icon="add" onClick={onPublishAndNew} />
            ) : null}
          </ToolbarDropdown>
        </>
      );
    }

    if (!isNewEntry) {
      return <StatusPublished>Published</StatusPublished>;
    }
  };

  render() {
    const { user, hasChanged, displayUrl, collection, hasWorkflow, onLogoutClick } = this.props;

    return (
      <ToolbarContainer>
        <ToolbarSectionBackLink to={`/collections/${collection.get('name')}`}>
          <BackArrow>←</BackArrow>
          <div>
            <BackCollection>
              Writing in <strong>{collection.get('label')}</strong> collection
            </BackCollection>
            {hasChanged ? (
              <BackStatusChanged>Unsaved Changes</BackStatusChanged>
            ) : (
              <BackStatusUnchanged>Changes saved</BackStatusUnchanged>
            )}
          </div>
        </ToolbarSectionBackLink>
        <ToolbarSectionMain>
          <ToolbarSubSectionFirst>
            {hasWorkflow ? this.renderWorkflowSaveControls() : this.renderSimpleSaveControls()}
          </ToolbarSubSectionFirst>
          <ToolbarSubSectionLast>
            {hasWorkflow
              ? this.renderWorkflowPublishControls()
              : this.renderSimplePublishControls()}
          </ToolbarSubSectionLast>
        </ToolbarSectionMain>
        <ToolbarSectionMeta>
          <SettingsDropdown
            displayUrl={displayUrl}
            imageUrl={user.get('avatar_url')}
            onLogoutClick={onLogoutClick}
          />
        </ToolbarSectionMeta>
      </ToolbarContainer>
    );
  }
}
