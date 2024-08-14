import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Button,
  ButtonGroup,
  Icon,
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'decap-cms-ui-next';

import { status } from '../../constants/publishModes';

const TooltipText = styled.div`
  visibility: hidden;
  width: 321px;
  background-color: #555;
  color: #fff;
  text-align: unset;
  border-radius: 6px;
  padding: 5px;

  /* Position the tooltip text */
  position: absolute;
  z-index: 1;
  top: 145%;
  left: 50%;
  margin-left: -320px;

  /* Fade in tooltip */
  opacity: 0;
  transition: opacity 0.3s;
`;

const Tooltip = styled.div`
  position: relative;
  display: inline-block;
  &:hover + ${TooltipText} {
    visibility: visible;
    opacity: 0.9;
  }
`;

const TooltipContainer = styled.div`
  position: relative;
`;

const ToolbarContainer = styled(AppBar)`
  height: 80px;
  padding: 0 1rem;

  position: sticky;
  top: 0;
  left: 0;
  z-index: 1;

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ToolbarControls = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex: 1;
`;

const PublishControlsGroup = styled(ButtonGroup)`
  & > * {
    margin: 0;
  }

  & > button:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  & button:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;

    position: relative;
    padding: 0 0.5rem;

    &::before {
      content: '';
      border-left: 1px solid ${({ theme }) => theme.color.neutral['200']};
      opacity: 0.5;

      height: 75%;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
    }
  }
`;

const BackArrow = styled(IconButton)`
  /* margin-left: 1rem; */
`;

const StyledScrollSyncIcon = styled(Icon)`
  rotate: -45deg;
`;

function EditorToolbar({
  isPersisting,
  isPublishing,
  isUpdatingStatus,
  isDeleting,
  onPersist,
  onPersistAndNew,
  onPersistAndDuplicate,
  showDelete,
  onDelete,
  onDeleteUnpublishedChanges,
  onChangeStatus,
  onPublish,
  unPublish,
  onDuplicate,
  onPublishAndNew,
  onPublishAndDuplicate,
  hasChanged,
  collection,
  hasWorkflow,
  useOpenAuthoring,
  hasUnpublishedChanges,
  isNewEntry,
  isModification,
  currentStatus,
  deployPreview = {},
  loadDeployPreview,
  previewEnabled,
  previewVisible,
  handleTogglePreview,
  scrollSyncEnabled,
  scrollSyncVisible,
  handleToggleScrollSync,
  t,
  editorBackLink,
}) {
  useEffect(() => {
    if (!isNewEntry) {
      loadDeployPreview({ maxAttempts: 3 });
    }
  }, [isPersisting]);

  function renderSimpleControls() {
    const canCreate = collection.get('create');

    return (
      <>
        {!isNewEntry && !hasChanged
          ? renderExistingEntrySimplePublishControls({ canCreate })
          : renderNewEntrySimplePublishControls({ canCreate })}
      </>
    );
  }

  function renderDeployPreviewControls(label) {
    const { url, status, isFetching } = deployPreview;

    if (!status) {
      return;
    }

    const deployPreviewReady = status === 'SUCCESS' && !isFetching;

    return (
      <>
        {previewEnabled && <DropdownMenuSeparator />}

        {deployPreviewReady ? (
          <DropdownMenuItem
            as={'a'}
            icon="external-link"
            target="_blank"
            rel="noopener noreferrer"
            href={url}
          >
            {label}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem icon="refresh" onClick={loadDeployPreview}>
            {t('editor.editorToolbar.deployPreviewPendingButtonLabel')}
          </DropdownMenuItem>
        )}
      </>
    );
  }

  function renderStatusInfoTooltip() {
    const statusToLocaleKey = {
      [status.get('DRAFT')]: 'statusInfoTooltipDraft',
      [status.get('PENDING_REVIEW')]: 'statusInfoTooltipInReview',
    };

    const statusKey = Object.keys(statusToLocaleKey).find(key => key === currentStatus);
    return (
      <TooltipContainer>
        <Tooltip>
          <Icon type="info-circle" size="small" className="tooltip" />
        </Tooltip>
        {statusKey && (
          <TooltipText>{t(`editor.editorToolbar.${statusToLocaleKey[statusKey]}`)}</TooltipText>
        )}
      </TooltipContainer>
    );
  }

  function renderWorkflowStatusControls() {
    const statusToTranslation = {
      [status.get('DRAFT')]: t('editor.editorToolbar.draft'),
      [status.get('PENDING_REVIEW')]: t('editor.editorToolbar.inReview'),
      [status.get('PENDING_PUBLISH')]: t('editor.editorToolbar.ready'),
    };

    const buttonText = isUpdatingStatus
      ? t('editor.editorToolbar.updating')
      : t('editor.editorToolbar.status', { status: statusToTranslation[currentStatus] });

    return (
      <>
        <Dropdown>
          <DropdownTrigger>
            <Button hasMenu>{buttonText}</Button>
          </DropdownTrigger>

          <DropdownMenu>
            <DropdownMenuItem
              onClick={() => onChangeStatus('DRAFT')}
              icon="edit-3"
              selected={currentStatus === status.get('DRAFT')}
            >
              {t('editor.editorToolbar.draft')}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onChangeStatus('PENDING_REVIEW')}
              icon="hard-drive"
              selected={currentStatus === status.get('PENDING_REVIEW')}
            >
              {t('editor.editorToolbar.inReview')}
            </DropdownMenuItem>

            {!useOpenAuthoring && (
              <DropdownMenuItem
                onClick={() => onChangeStatus('PENDING_PUBLISH')}
                icon="check"
                selected={currentStatus === status.get('PENDING_PUBLISH')}
              >
                {t('editor.editorToolbar.ready')}
              </DropdownMenuItem>
            )}
          </DropdownMenu>
        </Dropdown>

        {useOpenAuthoring && renderStatusInfoTooltip()}
      </>
    );
  }

  function renderNewEntryWorkflowPublishControls({ canCreate, canPublish, deleteLabel }) {
    return (
      canPublish && (
        <PublishControlsGroup>
          <Button icon="radio" onClick={onPublish}>
            {isPublishing
              ? t('editor.editorToolbar.publishing')
              : t('editor.editorToolbar.publish')}
          </Button>

          <Dropdown>
            <DropdownTrigger>
              <Button icon="chevron-down" />
            </DropdownTrigger>

            <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
              {canCreate && (
                <>
                  <DropdownMenuItem icon="plus-circle" onClick={onPublishAndNew}>
                    {t('editor.editorToolbar.publishAndCreateNew')}
                  </DropdownMenuItem>

                  <DropdownMenuItem icon="copy" onClick={onPublishAndDuplicate}>
                    {t('editor.editorToolbar.publishAndDuplicate')}
                  </DropdownMenuItem>
                </>
              )}

              {(!showDelete || useOpenAuthoring) &&
              !hasUnpublishedChanges &&
              !isModification ? null : (
                <>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    type="danger"
                    icon="trash-2"
                    onClick={hasUnpublishedChanges ? onDeleteUnpublishedChanges : onDelete}
                  >
                    {isDeleting ? t('editor.editorToolbar.deleting') : deleteLabel}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenu>
          </Dropdown>
        </PublishControlsGroup>
      )
    );
  }

  function renderExistingEntryWorkflowPublishControls({
    canCreate,
    canPublish,
    canDelete,
    deleteLabel,
  }) {
    return canPublish || canCreate ? (
      <Dropdown>
        <DropdownTrigger>
          <Button icon="radio" hasMenu>
            {isPersisting
              ? t('editor.editorToolbar.unpublishing')
              : t('editor.editorToolbar.published')}
          </Button>
        </DropdownTrigger>

        <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }} key="td-publish-create">
          {canDelete && canPublish && (
            <DropdownMenuItem icon="eye-off" onClick={unPublish}>
              {t('editor.editorToolbar.unpublish')}
            </DropdownMenuItem>
          )}
          {canCreate && (
            <DropdownMenuItem icon="copy" onClick={onDuplicate}>
              {t('editor.editorToolbar.duplicate')}
            </DropdownMenuItem>
          )}
          {(!showDelete || useOpenAuthoring) && !hasUnpublishedChanges && !isModification ? null : (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                type="danger"
                icon="trash-2"
                onClick={hasUnpublishedChanges ? onDeleteUnpublishedChanges : onDelete}
              >
                {isDeleting ? t('editor.editorToolbar.deleting') : deleteLabel}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenu>
      </Dropdown>
    ) : (
      ''
    );
  }

  function renderExistingEntrySimplePublishControls({ canCreate }) {
    return (
      <Dropdown>
        <DropdownTrigger>
          <Button icon="radio" hasMenu={canCreate || showDelete}>
            {t('editor.editorToolbar.published')}
          </Button>
        </DropdownTrigger>

        <DropdownMenu>
          {canCreate && (
            <DropdownMenuItem icon="copy" onClick={onDuplicate}>
              {t('editor.editorToolbar.duplicate')}
            </DropdownMenuItem>
          )}

          {showDelete && (
            <>
              {canCreate && <DropdownMenuSeparator />}

              <DropdownMenuItem type="danger" icon="trash-2" onClick={onDelete}>
                {t('editor.editorToolbar.deleteEntry')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenu>
      </Dropdown>
    );
  }

  function renderNewEntrySimplePublishControls({ canCreate }) {
    return (
      <Dropdown>
        <DropdownTrigger>
          <Button icon="radio" hasMenu>
            {isPersisting
              ? t('editor.editorToolbar.publishing')
              : t('editor.editorToolbar.publish')}
          </Button>
        </DropdownTrigger>

        <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
          <DropdownMenuItem icon="radio" onClick={onPersist}>
            {t('editor.editorToolbar.publishNow')}
          </DropdownMenuItem>

          {canCreate && (
            <>
              <DropdownMenuItem icon="plus-circle" onClick={onPersistAndNew}>
                {t('editor.editorToolbar.publishAndCreateNew')}
              </DropdownMenuItem>

              <DropdownMenuItem icon="copy" onClick={onPersistAndDuplicate}>
                {t('editor.editorToolbar.publishAndDuplicate')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenu>
      </Dropdown>
    );
  }

  function renderSimpleDeployPreviewControls() {
    if (!isNewEntry && !hasChanged) {
      return renderDeployPreviewControls(t('editor.editorToolbar.deployButtonLabel'));
    }
  }

  function renderWorkflowControls() {
    const canCreate = collection.get('create');
    const canPublish = collection.get('publish') && !useOpenAuthoring;
    const canDelete = collection.get('delete', true);

    const deleteLabel =
      (hasUnpublishedChanges &&
        isModification &&
        t('editor.editorToolbar.deleteUnpublishedChanges')) ||
      (hasUnpublishedChanges &&
        (isNewEntry || !isModification) &&
        t('editor.editorToolbar.deleteUnpublishedEntry')) ||
      (!hasUnpublishedChanges && !isModification && t('editor.editorToolbar.deletePublishedEntry'));

    return [
      <Button
        type="neutral"
        variant="soft"
        disabled={!hasChanged}
        key="save-button"
        onClick={() => hasChanged && onPersist()}
      >
        {isPersisting ? t('editor.editorToolbar.saving') : t('editor.editorToolbar.save')}
      </Button>,
      currentStatus
        ? [
            renderWorkflowStatusControls(),
            renderNewEntryWorkflowPublishControls({ canCreate, canPublish, deleteLabel }),
          ]
        : !isNewEntry &&
          renderExistingEntryWorkflowPublishControls({
            canCreate,
            canPublish,
            canDelete,
            deleteLabel,
          }),
    ];
  }

  function renderWorkflowDeployPreviewControls() {
    if (currentStatus) {
      return renderDeployPreviewControls(t('editor.editorToolbar.deployPreviewButtonLabel'));
    }

    /**
     * Publish control for published workflow entry.
     */
    if (!isNewEntry) {
      return renderDeployPreviewControls(t('editor.editorToolbar.deployButtonLabel'));
    }
  }

  function renderViewControls() {
    return (
      <Dropdown>
        <DropdownTrigger>
          <IconButton icon="more-vertical" />
        </DropdownTrigger>

        <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
          {previewEnabled && (
            <>
              <DropdownMenuItem
                icon="eye"
                selected={previewVisible}
                disabled={!previewEnabled}
                onClick={handleTogglePreview}
              >
                {t('editor.editorInterface.togglePreview')}
              </DropdownMenuItem>

              <DropdownMenuItem
                icon={<StyledScrollSyncIcon name="maximize-2" />}
                selected={scrollSyncVisible && scrollSyncEnabled}
                disabled={!scrollSyncVisible}
                onClick={handleToggleScrollSync}
              >
                {t('editor.editorInterface.toggleScrollSync')}
              </DropdownMenuItem>
            </>
          )}

          {hasWorkflow
            ? renderWorkflowDeployPreviewControls()
            : renderSimpleDeployPreviewControls()}
        </DropdownMenu>
      </Dropdown>
    );
  }

  return (
    <ToolbarContainer
      renderStart={() => <BackArrow icon="arrow-left" as={Link} to={editorBackLink} />}
      renderEnd={() => (
        <ToolbarControls>
          {hasWorkflow ? renderWorkflowControls() : renderSimpleControls()}
          {renderViewControls()}
        </ToolbarControls>
      )}
    />
  );
}

EditorToolbar.propTypes = {
  isPersisting: PropTypes.bool,
  isPublishing: PropTypes.bool,
  isUpdatingStatus: PropTypes.bool,
  isDeleting: PropTypes.bool,
  onPersist: PropTypes.func.isRequired,
  onPersistAndNew: PropTypes.func.isRequired,
  onPersistAndDuplicate: PropTypes.func.isRequired,
  showDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDeleteUnpublishedChanges: PropTypes.func.isRequired,
  onChangeStatus: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  unPublish: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onPublishAndNew: PropTypes.func.isRequired,
  onPublishAndDuplicate: PropTypes.func.isRequired,
  user: PropTypes.object,
  hasChanged: PropTypes.bool,
  displayUrl: PropTypes.string,
  collection: ImmutablePropTypes.map.isRequired,
  hasWorkflow: PropTypes.bool,
  useOpenAuthoring: PropTypes.bool,
  hasUnpublishedChanges: PropTypes.bool,
  isNewEntry: PropTypes.bool,
  isModification: PropTypes.bool,
  currentStatus: PropTypes.string,
  onLogoutClick: PropTypes.func.isRequired,
  deployPreview: PropTypes.object,
  loadDeployPreview: PropTypes.func.isRequired,
  previewEnabled: PropTypes.bool,
  previewVisible: PropTypes.bool,
  handleTogglePreview: PropTypes.func.isRequired,
  scrollSyncEnabled: PropTypes.bool,
  scrollSyncVisible: PropTypes.bool,
  handleToggleScrollSync: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  editorBackLink: PropTypes.string.isRequired,
};

export default translate()(EditorToolbar);
