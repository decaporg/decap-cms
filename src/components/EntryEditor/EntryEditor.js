import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import SplitPane from 'react-split-pane';
import Button from 'react-toolbox/lib/button';
import { ScrollSync, ScrollSyncPane } from '../ScrollSync';
import ControlPane from '../ControlPanel/ControlPane';
import PreviewPane from '../PreviewPane/PreviewPane';
import Toolbar from './EntryEditorToolbar';
import styles from './EntryEditor.css';
import stickyStyles from '../UI/Sticky/Sticky.css';

const PREVIEW_VISIBLE = 'cms.preview-visible';

class EntryEditor extends Component {
  state = {
    showEventBlocker: false,
    previewVisible: localStorage.getItem(PREVIEW_VISIBLE) !== "false",
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

  setSticky = (contextTop, containerRect, sticky) => {
    if (contextTop >= containerRect.top) {
      if (contextTop < containerRect.bottom - 60) {
        sticky.classList.add(stickyStyles.top);
        sticky.classList.remove(stickyStyles.bottom);
      } else if (contextTop >= containerRect.bottom - 60) {
        sticky.classList.remove(stickyStyles.top);
        sticky.classList.add(stickyStyles.bottom);
      }
    } else {
      sticky.classList.remove(stickyStyles.top);
      sticky.classList.remove(stickyStyles.bottom);
    }
  };

  handleControlPaneRef = (ref) => {
    const sticky = ref.querySelector('.cms__index__editorControlBar');
    const stickyContainer = ref.querySelector('.stickyContainer');
    stickyContainer.style.paddingTop = `${ sticky.offsetHeight }px`;
    sticky.style.position = 'absolute';
    sticky.style.top = `${ -sticky.offsetHeight }px`;
    sticky.style.width = `${ stickyContainer.getBoundingClientRect().width }px`;

    ref && ref.addEventListener('scroll', (e) => {
      const contextTop = e.target.getBoundingClientRect().top;
      this.setSticky(contextTop, stickyContainer.getBoundingClientRect(), sticky);
    });
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
        onValidate,
        onAddAsset,
        onRemoveAsset,
        onCancelEdit,
    } = this.props;

    const controlClassName = `${ styles.controlPane } ${ this.state.showEventBlocker && styles.blocker }`;
    const previewClassName = `${ styles.previewPane } ${ this.state.showEventBlocker && styles.blocker }`;

    const collectionPreviewEnabled = collection.getIn(['editor', 'preview'], true);

    const togglePreviewButton = (
      <Button className={styles.previewToggle} onClick={this.handleTogglePreview}>Toggle Preview</Button>
    );

    const editor = (
      <div className={controlClassName} ref={this.handleControlPaneRef}>
        { collectionPreviewEnabled ? togglePreviewButton : null }
        <ControlPane
          collection={collection}
          entry={entry}
          fields={fields}
          fieldsMetaData={fieldsMetaData}
          fieldsErrors={fieldsErrors}
          getAsset={getAsset}
          onChange={onChange}
          onValidate={onValidate}
          onAddAsset={onAddAsset}
          onRemoveAsset={onRemoveAsset}
          ref={c => this.controlPaneRef = c} // eslint-disable-line
        />
      </div>
    );

    const editorWithPreview = (
      <ScrollSync>
        <div className={styles.container}>
          <SplitPane
            defaultSize="50%"
            onDragStarted={this.handleSplitPaneDragStart}
            onDragFinished={this.handleSplitPaneDragFinished}
          >
            <ScrollSyncPane>{editor}</ScrollSyncPane>
            <div className={previewClassName}>
              <PreviewPane
                collection={collection}
                entry={entry}
                fields={fields}
                fieldsMetaData={fieldsMetaData}
                getAsset={getAsset}
              />
            </div>
          </SplitPane>
        </div>
      </ScrollSync>
    );

    const editorWithoutPreview = (
      <div className={styles.noPreviewEditorContainer}>
        {editor}
      </div>
    );

    return (
      <div className={styles.root}>
        { collectionPreviewEnabled && this.state.previewVisible ? editorWithPreview : editorWithoutPreview }
        <div className={styles.footer}>
          <Toolbar
            isPersisting={entry.get('isPersisting')}
            onPersist={this.handleOnPersist}
            onCancelEdit={onCancelEdit}
          />
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
  getAsset: PropTypes.func.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  onPersist: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
};

export default EntryEditor;
