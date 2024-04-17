import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { colorsRaw, colors, buttons } from 'decap-cms-ui-default';
import {
  AppBar,
  Button,
  Icon,
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  UserMenu,
  NotificationCenter,
} from 'decap-cms-ui-next';

import { status } from '../../constants/publishModes';

const styles = {
  noOverflow: css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  toolbarSection: css`
    height: 100%;
    display: flex;
    align-items: center;
    border: 0 solid ${colors.textFieldBorder};
  `,
  publishedButton: css`
    background-color: ${colorsRaw.tealLight};
    color: ${colorsRaw.tealDark};
  `,
};

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

const DropdownButton = styled(Button)`
  ${styles.noOverflow}
  @media (max-width: 1200px) {
    padding-left: 10px;
  }
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

const BackArrow = styled(IconButton)`
  margin-left: 1rem;
`;

const StyledUserMenu = styled(UserMenu)`
  margin-left: 0.75rem;
`;

const ToolbarButton = styled(Button)`
  @media (max-width: 1200px) {
    padding: 0 10px;
  }
`;

const DeleteButton = styled(ToolbarButton)`
  ${buttons.lightRed};
`;

const PublishedToolbarButton = styled(DropdownButton)`
  ${styles.publishedButton}
`;

const PublishedButton = styled(ToolbarButton)`
  ${styles.publishedButton}
`;

const PublishButton = styled(DropdownButton)`
  background-color: '${colorsRaw.teal}';
`;

const StatusButton = styled(DropdownButton)`
  background-color: ${colorsRaw.tealLight};
  color: ${colorsRaw.teal};
`;

const PreviewButtonContainer = styled.div`
  margin-right: 12px;
  color: ${colorsRaw.blue};
  display: flex;
  align-items: center;

  a,
  ${Icon} {
    color: ${colorsRaw.blue};
  }

  ${Icon} {
    position: relative;
    top: 1px;
  }
`;

const RefreshPreviewButton = styled.button`
  background: none;
  border: 0;
  cursor: pointer;
  color: ${colorsRaw.blue};

  span {
    margin-right: 6px;
  }
`;

const PreviewLink = RefreshPreviewButton.withComponent('a');

const StatusDropdownItem = styled(DropdownMenuItem)`
  ${Icon} {
    color: ${colors.infoText};
  }
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
  user,
  hasChanged,
  collection,
  hasWorkflow,
  useOpenAuthoring,
  hasUnpublishedChanges,
  isNewEntry,
  isModification,
  currentStatus,
  onLogoutClick,
  deployPreview = {},
  loadDeployPreview,
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
        <div>
          {showDelete ? (
            <DeleteButton onClick={onDelete}>{t('editor.editorToolbar.deleteEntry')}</DeleteButton>
          ) : null}
        </div>
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
      <PreviewButtonContainer>
        {deployPreviewReady ? (
          <PreviewLink rel="noopener noreferrer" target="_blank" href={url}>
            <span>{label}</span>
            <Icon type="new-tab" size="xsmall" />
          </PreviewLink>
        ) : (
          <RefreshPreviewButton onClick={loadDeployPreview}>
            <span>{t('editor.editorToolbar.deployPreviewPendingButtonLabel')}</span>
            <Icon type="refresh" size="xsmall" />
          </RefreshPreviewButton>
        )}
      </PreviewButtonContainer>
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
            <StatusButton>{buttonText}</StatusButton>
          </DropdownTrigger>

          <DropdownMenu>
            <StatusDropdownItem
              label={t('editor.editorToolbar.draft')}
              onClick={() => onChangeStatus('DRAFT')}
              icon={currentStatus === status.get('DRAFT') ? 'check' : null}
            />
            <StatusDropdownItem
              label={t('editor.editorToolbar.inReview')}
              onClick={() => onChangeStatus('PENDING_REVIEW')}
              icon={currentStatus === status.get('PENDING_REVIEW') ? 'check' : null}
            />
            {useOpenAuthoring ? (
              ''
            ) : (
              <StatusDropdownItem
                label={t('editor.editorToolbar.ready')}
                onClick={() => onChangeStatus('PENDING_PUBLISH')}
                icon={currentStatus === status.get('PENDING_PUBLISH') ? 'check' : null}
              />
            )}
          </DropdownMenu>
        </Dropdown>

        {useOpenAuthoring && renderStatusInfoTooltip()}
      </>
    );
  }

  function renderNewEntryWorkflowPublishControls({ canCreate, canPublish }) {
    return canPublish ? (
      <Dropdown>
        <DropdownTrigger>
          <PublishButton>
            {isPublishing
              ? t('editor.editorToolbar.publishing')
              : t('editor.editorToolbar.publish')}{' '}
          </PublishButton>
        </DropdownTrigger>

        <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
          <DropdownMenuItem icon="arrow" iconDirection="right" onClick={onPublish}>
            {t('editor.editorToolbar.publishNow')}
          </DropdownMenuItem>

          {canCreate ? (
            <>
              <DropdownMenuItem
                label={t('editor.editorToolbar.publishAndCreateNew')}
                icon="add"
                onClick={onPublishAndNew}
              />
              <DropdownMenuItem
                label={t('editor.editorToolbar.publishAndDuplicate')}
                icon="add"
                onClick={onPublishAndDuplicate}
              />
            </>
          ) : null}
        </DropdownMenu>
      </Dropdown>
    ) : (
      ''
    );
  }

  function renderExistingEntryWorkflowPublishControls({ canCreate, canPublish, canDelete }) {
    const deleteLabel =
      (hasUnpublishedChanges &&
        isModification &&
        t('editor.editorToolbar.deleteUnpublishedChanges')) ||
      (hasUnpublishedChanges &&
        (isNewEntry || !isModification) &&
        t('editor.editorToolbar.deleteUnpublishedEntry')) ||
      (!hasUnpublishedChanges && !isModification && t('editor.editorToolbar.deletePublishedEntry'));

    return canPublish || canCreate ? (
      <Dropdown>
        <DropdownTrigger>
          <Button type="success" primary icon="radio" hasMenu>
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
    return canCreate ? (
      <Dropdown>
        <DropdownTrigger>
          <PublishedToolbarButton>{t('editor.editorToolbar.published')}</PublishedToolbarButton>
        </DropdownTrigger>

        <DropdownMenu>
          <DropdownMenuItem
            label={t('editor.editorToolbar.duplicate')}
            icon="add"
            onClick={onDuplicate}
          />
        </DropdownMenu>
      </Dropdown>
    ) : (
      <PublishedButton>{t('editor.editorToolbar.published')}</PublishedButton>
    );
  }

  function renderNewEntrySimplePublishControls({ canCreate }) {
    return (
      <div>
        <Dropdown
          dropdownTopOverlap="40px"
          dropdownWidth="150px"
          renderButton={() => (
            <PublishButton>
              {isPersisting
                ? t('editor.editorToolbar.publishing')
                : t('editor.editorToolbar.publish')}
            </PublishButton>
          )}
        >
          <DropdownMenuItem
            label={t('editor.editorToolbar.publishNow')}
            icon="arrow"
            iconDirection="right"
            onClick={onPersist}
          />
          {canCreate ? (
            <>
              <DropdownMenuItem
                label={t('editor.editorToolbar.publishAndCreateNew')}
                icon="add"
                onClick={onPersistAndNew}
              />
              <DropdownMenuItem
                label={t('editor.editorToolbar.publishAndDuplicate')}
                icon="add"
                onClick={onPersistAndDuplicate}
              />
            </>
          ) : null}
        </Dropdown>
      </div>
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

    return [
      <Button
        disabled={!hasChanged}
        key="save-button"
        type="success"
        primary
        onClick={() => hasChanged && onPersist()}
      >
        {isPersisting ? t('editor.editorToolbar.saving') : t('editor.editorToolbar.save')}
      </Button>,
      currentStatus
        ? [
            renderWorkflowStatusControls(),
            renderNewEntryWorkflowPublishControls({ canCreate, canPublish }),
          ]
        : !isNewEntry &&
          renderExistingEntryWorkflowPublishControls({ canCreate, canPublish, canDelete }),
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
          <Button icon="more-vertical" />
        </DropdownTrigger>

        <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
          <DropdownMenuItem icon="eye">
            {t('editor.editorInterface.togglePreview')}
          </DropdownMenuItem>
          <DropdownMenuItem icon={<StyledScrollSyncIcon name="maximize-2" />}>
            {t('editor.editorInterface.toggleScrollSync')}
          </DropdownMenuItem>
        </DropdownMenu>

        {/* {previewEnabled && (
          <EditorToggle
            isActive={previewVisible}
            onClick={this.handleTogglePreview}
            size="large"
            type="eye"
            title={t('editor.editorInterface.togglePreview')}
          />
        )}
        {scrollSyncVisible && (
          <EditorToggle
            isActive={scrollSyncEnabled}
            onClick={this.handleToggleScrollSync}
            size="large"
            type="scroll"
            title={t('editor.editorInterface.toggleScrollSync')}
          />
        )} */}
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
      renderActions={() => (
        <>
          <NotificationCenter />
          <StyledUserMenu user={user} onLogoutClick={onLogoutClick} />
        </>
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
  t: PropTypes.func.isRequired,
  editorBackLink: PropTypes.string.isRequired,
};

export default translate()(EditorToolbar);
