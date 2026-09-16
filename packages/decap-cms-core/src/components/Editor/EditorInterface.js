import PropTypes from 'prop-types';
import { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import SplitPane from 'react-split-pane';
import {
  colors,
  colorsRaw,
  components,
  transitions,
  IconButton,
  zIndex,
} from 'decap-cms-ui-default';
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync';

import EditorControlPane from './EditorControlPane/EditorControlPane';
import EditorPreviewPane from './EditorPreviewPane/EditorPreviewPane';
import EditorNotesPane from './EditorNotesPane/EditorNotesPane';
import EditorToolbar from './EditorToolbar';
import { hasI18n, getI18nInfo, getPreviewEntry } from '../../lib/i18n';
import { FILES } from '../../constants/collectionTypes';
import { getFileFromSlug } from '../../reducers/collections';

const SCROLL_SYNC_ENABLED = 'cms.scroll-sync-enabled';
const SPLIT_PANE_POSITION = 'cms.split-pane-position';
const RIGHT_PANE = 'cms.right-pane';

// Superseded by RIGHT_PANE; read once so an existing editor keeps their layout.
const LEGACY_PREVIEW_VISIBLE = 'cms.preview-visible';
const LEGACY_NOTES_VISIBLE = 'cms.notes-visible';
const LEGACY_I18N_VISIBLE = 'cms.i18n-visible';

/**
 * There is one slot to the right of the form and three things that want it, so
 * which one is showing is a single value rather than three booleans.
 *
 * As three booleans they could all be true at once — which was the default,
 * since each read `!== 'false'` from empty storage — and the renderer picked a
 * winner by precedence. Only i18n's toggle told the truth in that state:
 * pressing Notes set its flag and lit its button while i18n kept the slot, so
 * the control claimed to be on while showing something else. A single value
 * cannot represent that.
 *
 * Order is the precedence the old renderer applied, kept so an editor who
 * never expressed a preference sees the same pane as before.
 */
const PANE_ORDER = ['i18n', 'notes', 'preview'];
const NO_PANE = 'none';

export function storedPanePreference() {
  const stored = localStorage.getItem(RIGHT_PANE);
  if (stored) {
    return stored;
  }
  // No preference recorded yet: honour whichever legacy pane was last turned
  // off, so an editor who hid the preview does not find it back.
  const legacyOff = {
    i18n: localStorage.getItem(LEGACY_I18N_VISIBLE) === 'false',
    notes: localStorage.getItem(LEGACY_NOTES_VISIBLE) === 'false',
    preview: localStorage.getItem(LEGACY_PREVIEW_VISIBLE) === 'false',
  };
  const firstStillOn = PANE_ORDER.find(pane => !legacyOff[pane]);
  return firstStillOn ?? NO_PANE;
}

/**
 * `preferred` is what the editor asked for; `available` is what this entry can
 * actually offer (notes need a saved entry, i18n needs a second locale, preview
 * can be switched off per collection). A preference for a pane this entry does
 * not have falls through to the next one rather than leaving the slot empty,
 * which is what the three-boolean version did.
 */
export function resolveRightPane(preferred, available) {
  if (preferred === NO_PANE) {
    return null;
  }
  if (preferred && available[preferred]) {
    return preferred;
  }
  return PANE_ORDER.find(pane => available[pane]) ?? null;
}

const styles = {
  splitPane: css`
    ${components.card};
    border-radius: 0;
    height: 100%;
  `,
  pane: css`
    height: 100%;
    overflow-y: auto;
  `,
};

const EditorToggle = styled(IconButton)`
  margin-bottom: 12px;
`;

function ReactSplitPaneGlobalStyles() {
  return (
    <Global
      styles={css`
        .Resizer.vertical {
          width: 2px;
          cursor: col-resize;
          position: relative;
          background: none;

          &:before {
            content: '';
            width: 2px;
            height: 100%;
            position: relative;
            background-color: ${colors.textFieldBorder};
            display: block;
            z-index: 10;
            transition: background-color ${transitions.main};
          }

          &:hover,
          &:active {
            &:before {
              width: 4px;
              left: -1px;
              background-color: ${colorsRaw.blue};
            }
          }
        }
      `}
    />
  );
}

const StyledSplitPane = styled(SplitPane)`
  ${styles.splitPane};

  /**
   * Quick fix for preview pane not fully displaying in Safari
   */
  .Pane {
    height: 100%;
  }
`;

const NoPreviewContainer = styled.div`
  ${styles.splitPane};
`;

const EditorContainer = styled.div`
  width: 100%;
  min-width: 800px;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  padding-top: 66px;
  background-color: ${colors.background};
`;

const Editor = styled.div`
  height: 100%;
  margin: 0 auto;
  position: relative;
`;

const PreviewPaneContainer = styled.div`
  height: 100%;
  pointer-events: ${props => (props.blockEntry ? 'none' : 'auto')};
  overflow-y: ${props => (props.overFlow ? 'auto' : 'hidden')};
`;

const ControlPaneContainer = styled(PreviewPaneContainer)`
  padding: 0 16px;
  position: relative;
  overflow-x: hidden;
`;

const NotesPaneContainer = styled.div`
  height: 100%;
  pointer-events: ${props => (props.blockEntry ? 'none' : 'auto')};
  overflow: hidden;
`;

const ViewControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: ${zIndex.zIndex299};
`;

function EditorContent({
  rightPane,
  editor,
  editorWithEditor,
  editorWithPreview,
  editorWithNotes,
}) {
  switch (rightPane) {
    case 'i18n':
      return editorWithEditor;
    case 'notes':
      return editorWithNotes;
    case 'preview':
      return editorWithPreview;
    default:
      return <NoPreviewContainer>{editor}</NoPreviewContainer>;
  }
}

function isPreviewEnabled(collection, entry) {
  if (collection.get('type') === FILES) {
    const file = getFileFromSlug(collection, entry.get('slug'));
    const previewEnabled = file?.getIn(['editor', 'preview']);
    if (previewEnabled != null) return previewEnabled;
  }
  return collection.getIn(['editor', 'preview'], true);
}

function isNotesEnabled(collection, entry, isNewEntry, isPublished, hasWorkflow) {
  if (isNewEntry || !hasWorkflow) {
    return false;
  }

  if (collection.get('type') === FILES) {
    const file = getFileFromSlug(collection, entry.get('slug'));
    const notesEnabled = file?.getIn(['editor', 'notes']);
    if (notesEnabled != null) return notesEnabled;
  }
  return collection.getIn(['editor', 'notes'], false);
}

class EditorInterface extends Component {
  state = {
    showEventBlocker: false,
    rightPane: storedPanePreference(),
    scrollSyncEnabled: localStorage.getItem(SCROLL_SYNC_ENABLED) !== 'false',
  };

  handleFieldClick = path => {
    this.controlPaneRef?.focus(path);
  };

  handleSplitPaneDragStart = () => {
    this.setState({ showEventBlocker: true });
  };

  handleSplitPaneDragFinished = () => {
    this.setState({ showEventBlocker: false });
  };

  handleOnPersist = async (opts = {}) => {
    const { createNew = false, duplicate = false } = opts;
    await this.controlPaneRef.switchToDefaultLocale();
    this.controlPaneRef.validate();
    this.props.onPersist({ createNew, duplicate });
  };

  handleOnPublish = async (opts = {}) => {
    const { createNew = false, duplicate = false } = opts;
    await this.controlPaneRef.switchToDefaultLocale();
    this.controlPaneRef.validate();
    this.props.onPublish({ createNew, duplicate });
  };

  /**
   * Takes the pane that is actually showing, not the stored preference: the two
   * differ when the preference names a pane this entry cannot offer, and a
   * toggle must act on what the editor can see.
   */
  handleTogglePane = (pane, showing) => {
    const next = showing === pane ? NO_PANE : pane;
    this.setState({ rightPane: next });
    localStorage.setItem(RIGHT_PANE, next);
  };

  handleNotesChange = (action, payload) => {
    this.props.onNotesChange(action, payload);
  };

  handleToggleScrollSync = () => {
    const newScrollSyncEnabled = !this.state.scrollSyncEnabled;
    this.setState({ scrollSyncEnabled: newScrollSyncEnabled });
    localStorage.setItem(SCROLL_SYNC_ENABLED, newScrollSyncEnabled);
  };

  handleLeftPanelLocaleChange = locale => {
    this.setState({ leftPanelLocale: locale });
  };

  render() {
    const {
      collection,
      entry,
      fields,
      fieldsMetaData,
      fieldsErrors,
      onChange,
      showDelete,
      onDelete,
      onDeleteUnpublishedChanges,
      onChangeStatus,
      onPublish,
      unPublish,
      onDuplicate,
      onValidate,
      user,
      hasChanged,
      canCreateNewEntry,
      displayUrl,
      hasWorkflow,
      useOpenAuthoring,
      hasUnpublishedChanges,
      isNewEntry,
      isModification,
      isPublished,
      currentStatus,
      onLogoutClick,
      loadDeployPreview,
      deployPreview,
      draftKey,
      editorBackLink,
      t,
    } = this.props;

    const { scrollSyncEnabled, showEventBlocker } = this.state;

    const previewEnabled = isPreviewEnabled(collection, entry);
    const notesEnabled = isNotesEnabled(collection, entry, isNewEntry, isPublished, hasWorkflow);

    const { locales, defaultLocale } = getI18nInfo(this.props.collection);
    const collectionI18nEnabled = hasI18n(collection) && locales.length > 1;
    const editorProps = {
      collection,
      entry,
      fields,
      fieldsMetaData,
      fieldsErrors,
      onChange,
      onValidate,
    };

    const leftPanelLocale = this.state.leftPanelLocale || locales?.[0];
    const editor = (
      <ControlPaneContainer overFlow blockEntry={showEventBlocker}>
        <EditorControlPane
          {...editorProps}
          ref={c => (this.controlPaneRef = c)}
          locale={leftPanelLocale}
          t={t}
          onLocaleChange={this.handleLeftPanelLocaleChange}
        />
      </ControlPaneContainer>
    );

    const editor2 = (
      <ControlPaneContainer overFlow={!this.state.scrollSyncEnabled} blockEntry={showEventBlocker}>
        <EditorControlPane {...editorProps} locale={locales?.[1]} t={t} />
      </ControlPaneContainer>
    );

    const previewEntry = collectionI18nEnabled
      ? getPreviewEntry(entry, leftPanelLocale, defaultLocale)
      : entry;

    const editorWithPreview = (
      <ScrollSync enabled={this.state.scrollSyncEnabled}>
        <div>
          <ReactSplitPaneGlobalStyles />
          <StyledSplitPane
            maxSize={-100}
            minSize={400}
            defaultSize={parseInt(localStorage.getItem(SPLIT_PANE_POSITION), 10) || '50%'}
            onChange={size => localStorage.setItem(SPLIT_PANE_POSITION, size)}
            onDragStarted={this.handleSplitPaneDragStart}
            onDragFinished={this.handleSplitPaneDragFinished}
          >
            <ScrollSyncPane>{editor}</ScrollSyncPane>
            <PreviewPaneContainer blockEntry={showEventBlocker}>
              <EditorPreviewPane
                collection={collection}
                entry={previewEntry}
                fields={fields}
                fieldsMetaData={fieldsMetaData}
                locale={leftPanelLocale}
                onFieldClick={this.handleFieldClick}
              />
            </PreviewPaneContainer>
          </StyledSplitPane>
        </div>
      </ScrollSync>
    );

    const editorWithNotes = (
      <ScrollSync enabled={this.state.scrollSyncEnabled}>
        <div>
          <ReactSplitPaneGlobalStyles />
          <StyledSplitPane
            maxSize={-100}
            minSize={400}
            defaultSize={parseInt(localStorage.getItem(SPLIT_PANE_POSITION), 10) || '50%'}
            onChange={size => localStorage.setItem(SPLIT_PANE_POSITION, size)}
            onDragStarted={this.handleSplitPaneDragStart}
            onDragFinished={this.handleSplitPaneDragFinished}
          >
            <ScrollSyncPane>{editor}</ScrollSyncPane>
            <NotesPaneContainer blockEntry={showEventBlocker}>
              <EditorNotesPane
                notes={this.props.notes}
                onChange={this.handleNotesChange}
                entry={entry}
                collection={collection}
                user={user}
                t={t}
              />
            </NotesPaneContainer>
          </StyledSplitPane>
        </div>
      </ScrollSync>
    );

    const editorWithEditor = (
      <ScrollSync enabled={this.state.scrollSyncEnabled}>
        <div>
          <StyledSplitPane
            maxSize={-100}
            defaultSize={parseInt(localStorage.getItem(SPLIT_PANE_POSITION), 10) || '50%'}
            onChange={size => localStorage.setItem(SPLIT_PANE_POSITION, size)}
            onDragStarted={this.handleSplitPaneDragStart}
            onDragFinished={this.handleSplitPaneDragFinished}
          >
            <ScrollSyncPane>{editor}</ScrollSyncPane>
            <ScrollSyncPane>{editor2}</ScrollSyncPane>
          </StyledSplitPane>
        </div>
      </ScrollSync>
    );

    const rightPane = resolveRightPane(this.state.rightPane, {
      i18n: collectionI18nEnabled,
      notes: notesEnabled,
      preview: previewEnabled,
    });
    const scrollSyncVisible = rightPane !== null;

    return (
      <EditorContainer>
        <EditorToolbar
          isPersisting={entry.get('isPersisting')}
          isPublishing={entry.get('isPublishing')}
          isUpdatingStatus={entry.get('isUpdatingStatus')}
          isDeleting={entry.get('isDeleting')}
          onPersist={this.handleOnPersist}
          onPersistAndNew={() => this.handleOnPersist({ createNew: true })}
          onPersistAndDuplicate={() => this.handleOnPersist({ createNew: true, duplicate: true })}
          onDelete={onDelete}
          onDeleteUnpublishedChanges={onDeleteUnpublishedChanges}
          onChangeStatus={onChangeStatus}
          showDelete={showDelete}
          onPublish={onPublish}
          unPublish={unPublish}
          onDuplicate={onDuplicate}
          onPublishAndNew={() => this.handleOnPublish({ createNew: true })}
          onPublishAndDuplicate={() => this.handleOnPublish({ createNew: true, duplicate: true })}
          user={user}
          hasChanged={hasChanged}
          canCreateNewEntry={canCreateNewEntry}
          displayUrl={displayUrl}
          collection={collection}
          hasWorkflow={hasWorkflow}
          useOpenAuthoring={useOpenAuthoring}
          hasUnpublishedChanges={hasUnpublishedChanges}
          isNewEntry={isNewEntry}
          isModification={isModification}
          currentStatus={currentStatus}
          onLogoutClick={onLogoutClick}
          loadDeployPreview={loadDeployPreview}
          deployPreview={deployPreview}
          editorBackLink={editorBackLink}
        />
        <Editor key={draftKey}>
          <ViewControls>
            {collectionI18nEnabled && (
              <EditorToggle
                isActive={rightPane === 'i18n'}
                onClick={() => this.handleTogglePane('i18n', rightPane)}
                size="large"
                type="page"
                title={t('editor.editorInterface.toggleI18n')}
                marginTop="70px"
              />
            )}
            {previewEnabled && (
              <EditorToggle
                isActive={rightPane === 'preview'}
                onClick={() => this.handleTogglePane('preview', rightPane)}
                size="large"
                type="eye"
                title={t('editor.editorInterface.togglePreview')}
              />
            )}
            {notesEnabled && (
              <EditorToggle
                isActive={rightPane === 'notes'}
                onClick={() => this.handleTogglePane('notes', rightPane)}
                size="large"
                type="write"
                title={t('editor.editorInterface.toggleNotes')}
              />
            )}
            {scrollSyncVisible && !collection.getIn(['editor', 'visualEditing']) && (
              <EditorToggle
                isActive={scrollSyncEnabled}
                onClick={this.handleToggleScrollSync}
                size="large"
                type="scroll"
                title={t('editor.editorInterface.toggleScrollSync')}
              />
            )}
          </ViewControls>
          <EditorContent
            rightPane={rightPane}
            editor={editor}
            editorWithEditor={editorWithEditor}
            editorWithPreview={editorWithPreview}
            editorWithNotes={editorWithNotes}
          />
        </Editor>
      </EditorContainer>
    );
  }
}

EditorInterface.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  fieldsMetaData: ImmutablePropTypes.map.isRequired,
  fieldsErrors: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  onPersist: PropTypes.func.isRequired,
  showDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDeleteUnpublishedChanges: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  unPublish: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onChangeStatus: PropTypes.func.isRequired,
  user: PropTypes.object,
  hasChanged: PropTypes.bool,
  canCreateNewEntry: PropTypes.bool,
  displayUrl: PropTypes.string,
  hasWorkflow: PropTypes.bool,
  useOpenAuthoring: PropTypes.bool,
  hasUnpublishedChanges: PropTypes.bool,
  isNewEntry: PropTypes.bool,
  isModification: PropTypes.bool,
  isPublished: PropTypes.bool,
  currentStatus: PropTypes.string,
  onLogoutClick: PropTypes.func.isRequired,
  deployPreview: PropTypes.object,
  loadDeployPreview: PropTypes.func.isRequired,
  draftKey: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
  notes: ImmutablePropTypes.list,
  onNotesChange: PropTypes.func,
};

export default EditorInterface;
