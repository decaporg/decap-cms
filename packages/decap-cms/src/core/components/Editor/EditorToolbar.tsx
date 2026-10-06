import { Menu } from '@base-ui/react/menu';
import { Tooltip } from '@base-ui/react/tooltip';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import React from 'react';

import { SettingsDropdown } from '@/core/components/UI';
import { status } from '@/core/constants/publishModes';
import { useCurrentUserScopes } from '@/core/hooks/useCurrentUserScopes';
import { useShortcut } from '@/core/hooks/useShortcut';
import { translate } from '@/core/i18n';
import { canEditCollection } from '@/core/lib/collectionAccess';
import { Link } from '@/core/routing/Link';
import {
  buttons,
  colors,
  colorsRaw,
  components,
  Dropdown,
  DropdownItem,
  DropdownRadioItem,
  Icon,
  StyledDropdownButton,
  zIndex,
} from '@/ui/default/index';

import type { CmsCollectionState, CmsUser } from '@/lib/util/index';
import type { TranslateFunction } from '@/ui/default/index';

type Collection = CmsCollectionState;

const styles = {
  noOverflow: css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  buttonMargin: css`
    margin: 0 10px;
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

/**
 * Status-info tooltip, backed by Base UI's Tooltip: hover and keyboard-focus
 * activation, positioning, and dismissal come from Base UI (the old version
 * was a CSS-only hover tooltip that keyboard users could never reach).
 */
const StatusInfoTrigger = styled(Tooltip.Trigger)`
  appearance: none;
  background: none;
  border: 0;
  margin: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  color: inherit;
  cursor: default;
`;

const StatusInfoPositioner = styled(Tooltip.Positioner)`
  z-index: ${zIndex.zIndex300};
`;

const StatusInfoBubble = styled(Tooltip.Popup)`
  max-width: 320px;
  background-color: #555;
  color: #fff;
  border-radius: 6px;
  padding: 5px;
  font-size: 12px;
  opacity: 0.9;
`;

const DropdownButton = styled(StyledDropdownButton)`
  ${styles.noOverflow}
  @media (width >= 1200px) {
    padding-left: 10px;
  }
`;

const ToolbarContainer = styled.div`
  box-shadow:
    0 2px 6px 0 rgb(68 74 87 / 0.05),
    0 1px 3px 0 rgb(68 74 87 / 0.1),
    0 2px 54px rgb(0 0 0 / 0.1);
  /* In flow inside EditorContainer's flex column; relative so the z-index
     keeps the shadow painting above the editor panes below. */
  position: relative;
  flex-shrink: 0;
  width: 100%;
  z-index: ${zIndex.zIndex300};
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
  align-items: center;
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
`;

/* The dropdown popup is portaled to document.body now, so the teal icon
   color has to live on the items themselves instead of a descendant rule on
   ToolbarDropdown. */
const ToolbarDropdownItem = styled(DropdownItem)`
  .decap-icon {
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
`;

const BackStatusChanged = styled(BackStatus)`
  ${components.textBadgeDanger};
`;

const ToolbarButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${styles.buttonMargin};
  ${styles.noOverflow};
  display: block;

  @media (width >= 1200px) {
    padding: 0 10px;
  }
`;

const DeleteButton = styled(ToolbarButton)`
  ${buttons.lightRed};
`;

const SaveButton = styled(ToolbarButton)`
  ${buttons.lightBlue};
  &[disabled] {
    ${buttons.disabled};
  }
`;

const PublishedToolbarButton = styled(DropdownButton)`
  ${styles.publishedButton}
`;

const PublishedButton = styled(ToolbarButton)`
  ${styles.publishedButton}
`;

const PublishButton = styled(DropdownButton)`
  background-color: ${colorsRaw.teal};
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
  .decap-icon {
    color: ${colorsRaw.blue};
  }

  .decap-icon {
    position: relative;
    top: 1px;
  }
`;

const RefreshPreviewButton = styled.button<{ $spinning?: boolean | undefined }>`
  background: none;
  border: 0;
  cursor: pointer;
  color: ${colorsRaw.blue};

  span {
    margin-right: 6px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  .decap-icon {
    ${props => props.$spinning && `animation: spin 1s linear infinite;`}
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const PreviewLink = RefreshPreviewButton.withComponent('a');

const PublishDropDownItem = styled(ToolbarDropdownItem)`
  min-width: initial;
`;

const StatusDropdownItem = styled(DropdownRadioItem)`
  .decap-icon {
    color: ${colors.infoText};
  }
`;

interface EditorToolbarProps {
  isPersisting?: boolean;
  isPublishing?: boolean;
  isUpdatingStatus?: boolean;
  isDeleting?: boolean;
  onPersist: (opts?: { createNew?: boolean, duplicate?: boolean }) => void;
  onPersistAndNew: () => void;
  onPersistAndDuplicate: () => void;
  showDelete: boolean;
  onDelete: () => void;
  onDeleteUnpublishedChanges: () => void;
  onChangeStatus: (newStatus: string) => void;
  onPublish: (opts?: { createNew?: boolean, duplicate?: boolean }) => void;
  unPublish: () => void;
  onDuplicate: () => void;
  onPublishAndNew: () => void;
  onPublishAndDuplicate: () => void;
  /** ISO-8601 timestamp if this entry has a pending scheduled publish (DCMS-1991). */
  scheduledPublishAt?: string;
  onSchedulePublish?: () => void;
  onCancelSchedulePublish?: () => void;
  user?: CmsUser;
  hasChanged?: boolean;
  /**
   * Whether a new entry can be created in this collection (`create` plus any
   * `limit`). Falls back to `collection.create` when not provided.
   */
  canCreateNewEntry?: boolean;
  displayUrl?: string;
  collection: Collection;
  hasWorkflow?: boolean;
  useOpenAuthoring?: boolean;
  hasUnpublishedChanges?: boolean;
  isNewEntry?: boolean;
  isModification?: boolean;
  currentStatus?: string;
  onLogoutClick: () => void;
  deployPreview?: { url?: string, status?: string, isFetching?: boolean };
  loadDeployPreview: (opts?: { maxAttempts?: number, signal?: AbortSignal }) => void;
  t: TranslateFunction;
  editorBackLink: string;
}

export function EditorToolbar(props: EditorToolbarProps) {
  const {
    isNewEntry,
    isPersisting,
    isPublishing,
    isUpdatingStatus,
    isDeleting,
    isModification,
    hasChanged,
    canCreateNewEntry,
    hasUnpublishedChanges,
    useOpenAuthoring,
    currentStatus,
    showDelete,
    onPersist,
    onPersistAndNew,
    onPersistAndDuplicate,
    onPublish,
    onPublishAndNew,
    onPublishAndDuplicate,
    scheduledPublishAt,
    onSchedulePublish,
    onCancelSchedulePublish,
    onChangeStatus,
    onDelete,
    onDeleteUnpublishedChanges,
    unPublish,
    onDuplicate,
    onLogoutClick,
    user,
    displayUrl,
    collection,
    hasWorkflow,
    deployPreview = {},
    loadDeployPreview,
    editorBackLink,
    t,
  } = props;
  const userScopes = useCurrentUserScopes();
  const hasEditAccess = canEditCollection(collection, userScopes);

  const pollControllerRef = React.useRef<AbortController | null>(null);
  const isPersistingRef = React.useRef(isPersisting);
  const loadDeployPreviewRef = React.useRef(loadDeployPreview);
  loadDeployPreviewRef.current = loadDeployPreview;

  // Same gating the Save button itself uses (see `renderWorkflowControls`):
  // a pristine new entry stays saveable so validation can surface (#757),
  // an existing entry needs a real change first. Only workflow collections
  // render a dedicated Save button, so that's the only case Cmd/Ctrl+S maps
  // to `onPersist` (DCMS-NEW-SAVE-SHORTCUT). Registered on core's shared
  // shortcut engine (`@/core/lib/shortcuts`) rather than a bare `keydown`
  // listener, so it gets the same modal-suspension/typing-safe handling for
  // free.
  const canSave = hasEditAccess && hasWorkflow && (isNewEntry || !!hasChanged) && !isPersisting;
  useShortcut({
    id: 'editor.save',
    sequence: 'mod+s',
    label: t('editor.editorToolbar.save'),
    group: 'Editor',
    allowInInput: true,
    when: () => hasWorkflow ?? false,
    run: () => {
      if (canSave) onPersist();
    },
  });

  React.useEffect(() => {
    if (!isNewEntry) {
      // 24 attempts × 5s interval = ~2 min polling window.
      // With editorial workflow, saving remounts the component (navigates to
      // the unpublished entry view), so mount is the primary polling trigger.
      const controller = new AbortController();
      pollControllerRef.current = controller;
      loadDeployPreviewRef.current({ maxAttempts: 24, signal: controller.signal });
    }
    return () => {
      pollControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  React.useEffect(() => {
    if (!isNewEntry && isPersistingRef.current && !isPersisting) {
      // Abort any in-flight poll before starting a new one.
      pollControllerRef.current?.abort();
      const controller = new AbortController();
      pollControllerRef.current = controller;
      // Subsequent saves where the component survives (no remount).
      loadDeployPreviewRef.current({ maxAttempts: 3, signal: controller.signal });
    }
    isPersistingRef.current = isPersisting;
  }, [isPersisting, isNewEntry]);

  function renderDeployPreviewControls(label: string) {
    const { url, status: previewStatus, isFetching } = deployPreview;
    if (!previewStatus) return undefined;
    const deployPreviewReady = previewStatus === 'SUCCESS' && !isFetching;
    return (
      <PreviewButtonContainer>
        {deployPreviewReady
          ? (
            <PreviewLink rel="noopener noreferrer" target="_blank" href={url}>
              <span>{label}</span>
              <Icon type="new-tab" size="xsmall" />
            </PreviewLink>
          )
          : (
            <RefreshPreviewButton
              onClick={() => loadDeployPreview()}
              disabled={isFetching}
              $spinning={isFetching}
            >
              <span>{t('editor.editorToolbar.deployPreviewPendingButtonLabel')}</span>
              <Icon type="refresh" size="xsmall" />
            </RefreshPreviewButton>
          )}
      </PreviewButtonContainer>
    );
  }

  function renderStatusInfoTooltip() {
    const statusToLocaleKey: Record<string, string> = {
      [status.DRAFT]: 'statusInfoTooltipDraft',
      [status.PENDING_REVIEW]: 'statusInfoTooltipInReview',
    };
    const statusKey = Object.keys(statusToLocaleKey).find(key => key === currentStatus);
    const message = statusKey
      ? t(`editor.editorToolbar.${statusToLocaleKey[statusKey]}`)
      : undefined;
    return (
      <Tooltip.Root>
        <StatusInfoTrigger delay={0} aria-label={message}>
          <Icon type="info-circle" size="small" />
        </StatusInfoTrigger>
        {message && (
          <Tooltip.Portal>
            <StatusInfoPositioner side="bottom" align="end" sideOffset={6}>
              <StatusInfoBubble>{message}</StatusInfoBubble>
            </StatusInfoPositioner>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    );
  }

  function renderWorkflowStatusControls() {
    const statusToTranslation: Record<string, string> = {
      [status.DRAFT]: t('editor.editorToolbar.draft'),
      [status.PENDING_REVIEW]: t('editor.editorToolbar.inReview'),
      [status.PENDING_PUBLISH]: t('editor.editorToolbar.ready'),
    };
    const buttonText = isUpdatingStatus
      ? t('editor.editorToolbar.updating')
      : t('editor.editorToolbar.status', {
        status: currentStatus ? statusToTranslation[currentStatus] : '',
      });
    return (
      <>
        <ToolbarDropdown
          dropdownTopOverlap="40px"
          dropdownWidth="120px"
          renderButton={() => <StatusButton>{buttonText}</StatusButton>}
        >
          <Menu.RadioGroup value={currentStatus}>
            <StatusDropdownItem
              label={t('editor.editorToolbar.draft')}
              onClick={() => onChangeStatus('DRAFT')}
              value={status.DRAFT}
            />
            <StatusDropdownItem
              label={t('editor.editorToolbar.inReview')}
              onClick={() => onChangeStatus('PENDING_REVIEW')}
              value={status.PENDING_REVIEW}
            />
            {useOpenAuthoring
              ? (
                ''
              )
              : (
                <StatusDropdownItem
                  label={t('editor.editorToolbar.ready')}
                  onClick={() => onChangeStatus('PENDING_PUBLISH')}
                  value={status.PENDING_PUBLISH}
                />
              )}
          </Menu.RadioGroup>
        </ToolbarDropdown>
        {useOpenAuthoring && renderStatusInfoTooltip()}
      </>
    );
  }

  function renderNewEntryWorkflowPublishControls({
    canCreate,
    canPublish,
  }: {
    canCreate?: boolean | undefined,
    canPublish?: boolean,
  }) {
    return canPublish
      ? (
        <ToolbarDropdown
          dropdownTopOverlap="40px"
          dropdownWidth="200px"
          renderButton={() => (
            <PublishButton>
              {isPublishing
                ? t('editor.editorToolbar.publishing')
                : t('editor.editorToolbar.publish')}
            </PublishButton>
          )}
        >
          <PublishDropDownItem
            label={t('editor.editorToolbar.publishNow')}
            icon="arrow"
            iconDirection="right"
            onClick={onPublish}
          />
          {canCreate
            ? (
              <>
                <PublishDropDownItem
                  label={t('editor.editorToolbar.publishAndCreateNew')}
                  icon="add"
                  onClick={onPublishAndNew}
                />
                <PublishDropDownItem
                  label={t('editor.editorToolbar.publishAndDuplicate')}
                  icon="add"
                  onClick={onPublishAndDuplicate}
                />
              </>
            )
            : null}
          {(onSchedulePublish || onCancelSchedulePublish)
            && (scheduledPublishAt
              ? (
                <PublishDropDownItem
                  label={`${
                    t('editor.editorToolbar.scheduledFor', {
                      date: dayjs(scheduledPublishAt).format('MMM D, YYYY HH:mm'),
                    })
                  } - ${t('editor.editorToolbar.cancelScheduledPublish')}`}
                  icon="close"
                  onClick={() => onCancelSchedulePublish?.()}
                />
              )
              : (
                <PublishDropDownItem
                  label={t('editor.editorToolbar.schedulePublish')}
                  icon="write"
                  onClick={() => onSchedulePublish?.()}
                />
              ))}
        </ToolbarDropdown>
      )
      : (
        ''
      );
  }

  function renderExistingEntryWorkflowPublishControls({
    canCreate,
    canPublish,
    canDelete,
  }: {
    canCreate?: boolean | undefined,
    canPublish?: boolean,
    canDelete?: boolean,
  }) {
    return canPublish || canCreate
      ? (
        <ToolbarDropdown
          dropdownTopOverlap="40px"
          dropdownWidth="max-content"
          key="td-publish-create"
          renderButton={() => (
            <PublishedToolbarButton>
              {isPersisting
                ? t('editor.editorToolbar.unpublishing')
                : t('editor.editorToolbar.published')}
            </PublishedToolbarButton>
          )}
        >
          {canDelete && canPublish && (
            <ToolbarDropdownItem
              label={t('editor.editorToolbar.unpublish')}
              icon="arrow"
              iconDirection="right"
              onClick={unPublish}
            />
          )}
          {canCreate && (
            <ToolbarDropdownItem
              label={t('editor.editorToolbar.duplicate')}
              icon="add"
              onClick={onDuplicate}
            />
          )}
        </ToolbarDropdown>
      )
      : (
        ''
      );
  }

  function renderExistingEntrySimplePublishControls({ canCreate }: { canCreate?: boolean | undefined }) {
    return canCreate
      ? (
        <ToolbarDropdown
          dropdownTopOverlap="40px"
          dropdownWidth="max-content"
          renderButton={() => <PublishedToolbarButton>{t('editor.editorToolbar.published')}</PublishedToolbarButton>}
        >
          <ToolbarDropdownItem
            label={t('editor.editorToolbar.duplicate')}
            icon="add"
            onClick={onDuplicate}
          />
        </ToolbarDropdown>
      )
      : <PublishedButton>{t('editor.editorToolbar.published')}</PublishedButton>;
  }

  function renderNewEntrySimplePublishControls({ canCreate }: { canCreate?: boolean | undefined }) {
    return (
      <div>
        <ToolbarDropdown
          dropdownTopOverlap="40px"
          dropdownWidth="max-content"
          renderButton={() => (
            <PublishButton>
              {isPersisting
                ? t('editor.editorToolbar.publishing')
                : t('editor.editorToolbar.publish')}
            </PublishButton>
          )}
        >
          <ToolbarDropdownItem
            label={t('editor.editorToolbar.publishNow')}
            icon="arrow"
            iconDirection="right"
            onClick={onPersist}
          />
          {canCreate
            ? (
              <>
                <ToolbarDropdownItem
                  label={t('editor.editorToolbar.publishAndCreateNew')}
                  icon="add"
                  onClick={onPersistAndNew}
                />
                <ToolbarDropdownItem
                  label={t('editor.editorToolbar.publishAndDuplicate')}
                  icon="add"
                  onClick={onPersistAndDuplicate}
                />
              </>
            )
            : null}
        </ToolbarDropdown>
      </div>
    );
  }

  function renderSimpleControls() {
    if (!hasEditAccess) return null;
    const canCreate = canCreateNewEntry ?? collection.create;
    return (
      <>
        {!isNewEntry && !hasChanged
          ? renderExistingEntrySimplePublishControls({ canCreate })
          : renderNewEntrySimplePublishControls({ canCreate })}
        <div>
          {showDelete ? <DeleteButton onClick={onDelete}>{t('editor.editorToolbar.deleteEntry')}</DeleteButton> : null}
        </div>
      </>
    );
  }

  function renderSimpleDeployPreviewControls() {
    if (!isNewEntry && !hasChanged) {
      return renderDeployPreviewControls(t('editor.editorToolbar.deployButtonLabel'));
    }
  }

  function renderWorkflowControls() {
    if (!hasEditAccess) return null;
    const canCreate = canCreateNewEntry ?? collection.create;
    const canPublish = !!(collection.publish && !useOpenAuthoring);
    const canDelete = collection.delete ?? true;

    const deleteLabel = (hasUnpublishedChanges
      && isModification
      && t('editor.editorToolbar.deleteUnpublishedChanges'))
      || (hasUnpublishedChanges
        && (isNewEntry || !isModification)
        && t('editor.editorToolbar.deleteUnpublishedEntry'))
      || (!hasUnpublishedChanges && !isModification && t('editor.editorToolbar.deletePublishedEntry'));

    // A brand-new entry starts with `hasChanged: false` (DCMS-416, so a
    // freshly opened form doesn't show "unsaved changes" before the user
    // types anything). But that also disabled Save entirely, so a pristine
    // new entry could never be submitted to surface validation errors
    // (#757). New entries must stay saveable regardless of `hasChanged`;
    // existing entries still require a real change first.
    const canSave = isNewEntry || hasChanged;
    return [
      <SaveButton disabled={!canSave} key="save-button" onClick={() => canSave && onPersist()}>
        {isPersisting ? t('editor.editorToolbar.saving') : t('editor.editorToolbar.save')}
      </SaveButton>,
      currentStatus
        ? [
          <React.Fragment key="workflow-status-controls">
            {renderWorkflowStatusControls()}
            {!hasChanged && renderNewEntryWorkflowPublishControls({ canCreate, canPublish })}
          </React.Fragment>,
        ]
        : !isNewEntry && (
          <React.Fragment key="existing-entry-workflow-publish-controls">
            {renderExistingEntryWorkflowPublishControls({ canCreate, canPublish, canDelete })}
          </React.Fragment>
        ),
      (!showDelete || useOpenAuthoring) && !hasUnpublishedChanges && !isModification ? null : (
        <DeleteButton
          key="delete-button"
          onClick={hasUnpublishedChanges ? onDeleteUnpublishedChanges : onDelete}
        >
          {isDeleting ? t('editor.editorToolbar.deleting') : deleteLabel}
        </DeleteButton>
      ),
    ];
  }

  function renderWorkflowDeployPreviewControls() {
    if (currentStatus) {
      return renderDeployPreviewControls(t('editor.editorToolbar.deployPreviewButtonLabel'));
    }
    if (!isNewEntry) {
      return renderDeployPreviewControls(t('editor.editorToolbar.deployButtonLabel'));
    }
  }

  return (
    <ToolbarContainer>
      <ToolbarSectionBackLink to={editorBackLink}>
        <BackArrow>←</BackArrow>
        <div>
          <BackCollection>
            {t('editor.editorToolbar.backCollection', { collectionLabel: collection.label })}
          </BackCollection>
          {hasChanged
            ? (
              <BackStatusChanged role="status">
                {t('editor.editorToolbar.unsavedChanges')}
              </BackStatusChanged>
            )
            : isNewEntry
            ? null
            : (
              <BackStatusUnchanged role="status">
                {t('editor.editorToolbar.changesSaved')}
              </BackStatusUnchanged>
            )}
        </div>
      </ToolbarSectionBackLink>
      <ToolbarSectionMain>
        <ToolbarSubSectionFirst>
          {hasWorkflow ? renderWorkflowControls() : renderSimpleControls()}
        </ToolbarSubSectionFirst>
        <ToolbarSubSectionLast>
          {hasWorkflow
            ? renderWorkflowDeployPreviewControls()
            : renderSimpleDeployPreviewControls()}
        </ToolbarSubSectionLast>
      </ToolbarSectionMain>
      <ToolbarSectionMeta>
        <SettingsDropdown
          displayUrl={displayUrl}
          imageUrl={user?.avatar_url}
          onLogoutClick={onLogoutClick}
        />
      </ToolbarSectionMeta>
    </ToolbarContainer>
  );
}

export default translate()(EditorToolbar);
