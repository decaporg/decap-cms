import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css, Global } from '@emotion/core';
import styled from '@emotion/styled';
import SplitPane from 'react-split-pane';
import { colors, colorsRaw, components, transitions, IconButton } from 'netlify-cms-ui-default';
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync';
import EditorControlPane from './EditorControlPane/EditorControlPane';
import EditorPreviewPane from './EditorPreviewPane/EditorPreviewPane';
import EditorToolbar from './EditorToolbar';

const PREVIEW_VISIBLE = 'cms.preview-visible';
const SCROLL_SYNC_ENABLED = 'cms.scroll-sync-enabled';
const SPLIT_PANE_POSITION = 'cms.split-pane-position';

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

const ReactSplitPaneGlobalStyles = () => (
  <Global
    styles={css`
      .Resizer.vertical {
        width: 21px;
        cursor: col-resize;
        position: relative;
        transition: background-color ${transitions.main};

        &:before {
          content: '';
          width: 2px;
          height: 100%;
          position: relative;
          left: 10px;
          background-color: ${colors.textFieldBorder};
          display: block;
        }

        &:hover,
        &:active {
          background-color: ${colorsRaw.GrayLight};
        }
      }
    `}
  />
);

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
  overflow-y: auto;
  pointer-events: ${props => (props.blockEntry ? 'none' : 'auto')};
`;

const ControlPaneContainer = styled(PreviewPaneContainer)`
  padding: 0 16px;
  position: relative;
  overflow-x: hidden;
`;

const ViewControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 299;
`;

class EditorInterface extends Component {
  state = {
    showEventBlocker: false,
    previewVisible: localStorage.getItem(PREVIEW_VISIBLE) !== 'false',
    scrollSyncEnabled: localStorage.getItem(SCROLL_SYNC_ENABLED) !== 'false',
  };

  handleSplitPaneDragStart = () => {
    this.setState({ showEventBlocker: true });
  };

  handleSplitPaneDragFinished = () => {
    this.setState({ showEventBlocker: false });
  };

  handleOnPersist = (opts = {}) => {
    const { createNew = false, duplicate = false } = opts;
    this.controlPaneRef.validate();
    this.props.onPersist({ createNew, duplicate });
  };

  handleOnPublish = (opts = {}) => {
    const { createNew = false, duplicate = false } = opts;
    this.controlPaneRef.validate();
    this.props.onPublish({ createNew, duplicate });
  };

  handleTogglePreview = () => {
    const newPreviewVisible = !this.state.previewVisible;
    this.setState({ previewVisible: newPreviewVisible });
    localStorage.setItem(PREVIEW_VISIBLE, newPreviewVisible);
  };

  handleToggleScrollSync = () => {
    const newScrollSyncEnabled = !this.state.scrollSyncEnabled;
    this.setState({ scrollSyncEnabled: newScrollSyncEnabled });
    localStorage.setItem(SCROLL_SYNC_ENABLED, newScrollSyncEnabled);
  };

  render() {
    const {
      collection,
      entry,
      fields,
      fieldsMetaData,
      fieldsErrors,
      getAsset,
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
      displayUrl,
      hasWorkflow,
      useOpenAuthoring,
      hasUnpublishedChanges,
      isNewEntry,
      isModification,
      currentStatus,
      onLogoutClick,
      loadDeployPreview,
      deployPreview,
      draftKey,
    } = this.props;

    const { previewVisible, scrollSyncEnabled, showEventBlocker } = this.state;

    const collectionPreviewEnabled = collection.getIn(['editor', 'preview'], true);

    const editor = (
      <ControlPaneContainer blockEntry={showEventBlocker}>
        <EditorControlPane
          collection={collection}
          entry={entry}
          fields={fields}
          fieldsMetaData={fieldsMetaData}
          fieldsErrors={fieldsErrors}
          onChange={onChange}
          onValidate={onValidate}
          ref={c => (this.controlPaneRef = c)}
        />
      </ControlPaneContainer>
    );

    const editorWithPreview = (
      <ScrollSync enabled={this.state.scrollSyncEnabled}>
        <div>
          <ReactSplitPaneGlobalStyles />
          <StyledSplitPane
            maxSize={-100}
            defaultSize={parseInt(localStorage.getItem(SPLIT_PANE_POSITION), 10) || '50%'}
            onChange={size => localStorage.setItem(SPLIT_PANE_POSITION, size)}
            onDragStarted={this.handleSplitPaneDragStart}
            onDragFinished={this.handleSplitPaneDragFinished}
          >
            <ScrollSyncPane>{editor}</ScrollSyncPane>
            <PreviewPaneContainer blockEntry={showEventBlocker}>
              <EditorPreviewPane
                collection={collection}
                entry={entry}
                fields={fields}
                fieldsMetaData={fieldsMetaData}
                getAsset={getAsset}
              />
            </PreviewPaneContainer>
          </StyledSplitPane>
        </div>
      </ScrollSync>
    );

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
        />
        <Editor key={draftKey}>
          <ViewControls>
            {collectionPreviewEnabled && (
              <EditorToggle
                isActive={previewVisible}
                onClick={this.handleTogglePreview}
                size="large"
                type="eye"
                title="Toggle preview"
              />
            )}
            {collectionPreviewEnabled && previewVisible && (
              <EditorToggle
                isActive={scrollSyncEnabled}
                onClick={this.handleToggleScrollSync}
                size="large"
                type="scroll"
                title="Sync scrolling"
              />
            )}
          </ViewControls>
          {collectionPreviewEnabled && this.state.previewVisible ? (
            editorWithPreview
          ) : (
            <NoPreviewContainer>{editor}</NoPreviewContainer>
          )}
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
  getAsset: PropTypes.func.isRequired,
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
  user: ImmutablePropTypes.map.isRequired,
  hasChanged: PropTypes.bool,
  displayUrl: PropTypes.string,
  hasWorkflow: PropTypes.bool,
  useOpenAuthoring: PropTypes.bool,
  hasUnpublishedChanges: PropTypes.bool,
  isNewEntry: PropTypes.bool,
  isModification: PropTypes.bool,
  currentStatus: PropTypes.string,
  onLogoutClick: PropTypes.func.isRequired,
  deployPreview: ImmutablePropTypes.map,
  loadDeployPreview: PropTypes.func.isRequired,
  draftKey: PropTypes.string.isRequired,
};

export default EditorInterface;
