import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import SplitPane from 'react-split-pane';
import Button from 'react-toolbox/lib/button';
import classnames from 'classnames';
import registry from '../../lib/registry';
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync';
import EditorControlPane from './EditorControlPane/EditorControlPane';
import EditorPreviewPane from './EditorPreviewPane/EditorPreviewPane';
import EditorToolbar from './EditorToolbar';
import { StickyContext } from '../../UI/Sticky/Sticky';

const PREVIEW_VISIBLE = 'cms.preview-visible';
const SCROLL_SYNC_ENABLED = 'cms.scroll-sync-enabled';

class EditorInterface extends Component {
  state = {
    showEventBlocker: false,
    previewVisible: localStorage.getItem(PREVIEW_VISIBLE) !== "false",
    scrollSyncEnabled: localStorage.getItem(SCROLL_SYNC_ENABLED) !== "false",
  };

  handleSplitPaneDragStart = () => {
    this.setState({ showEventBlocker: true });
  };

  handleSplitPaneDragFinished = () => {
    this.setState({ showEventBlocker: false });
  };

  handleOnPersist = () => {
    this.controlPaneRef.validate();
    this.props.onPersist();
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

  resolveWidget = name => {
    return registry.getWidget(name || 'string') || registry.getWidget('unknown');
  }

  render() {
    const {
      collection,
      entry,
      fields,
      fieldsMetaData,
      fieldsErrors,
      mediaPaths,
      getAsset,
      onChange,
      enableSave,
      showDelete,
      onDelete,
      onValidate,
      onOpenMediaLibrary,
      onAddAsset,
      onRemoveInsertedMedia,
      onCancelEdit,
      user,
      hasChanged,
    } = this.props;

    const { previewVisible, scrollSyncEnabled, showEventBlocker } = this.state;

    const collectionPreviewEnabled = collection.getIn(['editor', 'preview'], true);

    const ToggleButton = ({ icon, onClick }) => (
      <Button
        className={classnames('nc-entryEditor-toggleButton', { previewVisible: 'nc-entryEditor-toggleButtonShow' })}
        icon={icon}
        onClick={onClick}
        floating
        mini
      />
    );

    const editor = (
      <StickyContext
        className={classnames('nc-entryEditor-controlPane', { 'nc-entryEditor-blocker': showEventBlocker })}
        registerListener={fn => this.updateStickyContext = fn}
      >
        <EditorControlPane
          collection={collection}
          entry={entry}
          fields={fields}
          fieldsMetaData={fieldsMetaData}
          fieldsErrors={fieldsErrors}
          mediaPaths={mediaPaths}
          getAsset={getAsset}
          onChange={onChange}
          onValidate={onValidate}
          onOpenMediaLibrary={onOpenMediaLibrary}
          onAddAsset={onAddAsset}
          onRemoveInsertedMedia={onRemoveInsertedMedia}
          resolveWidget={this.resolveWidget}
          ref={c => this.controlPaneRef = c} // eslint-disable-line
        />
      </StickyContext>
    );

    const editorWithPreview = (
      <ScrollSync enabled={this.state.scrollSyncEnabled}>
        <div>
          <SplitPane
            defaultSize="50%"
            onDragStarted={this.handleSplitPaneDragStart}
            onDragFinished={this.handleSplitPaneDragFinished}
            onChange={this.updateStickyContext}
          >
            <ScrollSyncPane>{editor}</ScrollSyncPane>
            <div className={classnames('nc-entryEditor-previewPane', { 'nc-entryEditor-blocker': showEventBlocker })}>
              <EditorPreviewPane
                collection={collection}
                entry={entry}
                fields={fields}
                fieldsMetaData={fieldsMetaData}
                getAsset={getAsset}
                resolveWidget={this.resolveWidget}
              />
            </div>
          </SplitPane>
        </div>
      </ScrollSync>
    );

    const editorWithoutPreview = (
      <div className="nc-entryEditor-noPreviewEditorContainer">
        {editor}
      </div>
    );

    return (
      <div className="nc-entryEditor-containerOuter">
        <EditorToolbar
          isPersisting={entry.get('isPersisting')}
          onPersist={this.handleOnPersist}
          onCancelEdit={onCancelEdit}
          onDelete={onDelete}
          showDelete={showDelete}
          enableSave={enableSave}
          user={user}
          hasChanged={hasChanged}
        />
        <div className="nc-entryEditor-container">
          { collectionPreviewEnabled ? (
            <div className="nc-entryEditor-controlPaneButtons">
              <ToggleButton
                icon={previewVisible ? 'visibility' : 'visibility_off'}
                onClick={this.handleTogglePreview}
              />
              { previewVisible && (
                <ToggleButton
                  icon={scrollSyncEnabled ? 'sync' : 'sync_disabled'}
                  onClick={this.handleToggleScrollSync}
                />
              ) }
            </div>
          ) : null }
          {
            collectionPreviewEnabled && this.state.previewVisible
              ? editorWithPreview
              : editorWithoutPreview
          }
        </div>
      </div>
    );
  }
}

EntryEditor.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  fieldsMetaData: ImmutablePropTypes.map.isRequired,
  fieldsErrors: ImmutablePropTypes.map.isRequired,
  mediaPaths: ImmutablePropTypes.map.isRequired,
  getAsset: PropTypes.func.isRequired,
  onOpenMediaLibrary: PropTypes.func.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  onPersist: PropTypes.func.isRequired,
  enableSave: PropTypes.bool.isRequired,
  showDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRemoveInsertedMedia: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  user: ImmutablePropTypes.map,
  hasChanged: PropTypes.bool,
};

export default EditorInterface;
