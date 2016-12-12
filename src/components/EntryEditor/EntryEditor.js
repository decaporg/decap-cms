import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import SplitPane from 'react-split-pane';
import { ScrollSync, ScrollSyncPane } from '../ScrollSync';
import ControlPane from '../ControlPanel/ControlPane';
import PreviewPane from '../PreviewPane/PreviewPane';
import Toolbar from './EntryEditorToolbar';
import styles from './EntryEditor.css';

class EntryEditor extends Component {
  state = {
    showEventBlocker: false,
  };

  handleSplitPaneDragStart = () => {
    this.setState({ showEventBlocker: true });
  };

  handleSplitPaneDragFinished = () => {
    this.setState({ showEventBlocker: false });
  };

  render() {
    const {
        collection,
        entry,
        fields,
        getMedia,
        onChange,
        onAddMedia,
        onRemoveMedia,
        onPersist,
        onCancelEdit,
    } = this.props;

    const controlClassName = `${ styles.controlPane } ${ this.state.showEventBlocker && styles.blocker }`;
    const previewClassName = `${ styles.previewPane } ${ this.state.showEventBlocker && styles.blocker }`;
    return (
      <div className={styles.root}>
        <ScrollSync>
          <div className={styles.container}>
            <SplitPane
              defaultSize="50%"
              onDragStarted={this.handleSplitPaneDragStart}
              onDragFinished={this.handleSplitPaneDragFinished}
            >
              <ScrollSyncPane>
                <div className={controlClassName}>

                  <ControlPane
                    collection={collection}
                    entry={entry}
                    fields={fields}
                    getMedia={getMedia}
                    onChange={onChange}
                    onAddMedia={onAddMedia}
                    onRemoveMedia={onRemoveMedia}
                  />

                </div>
              </ScrollSyncPane>
              <div className={previewClassName}>
                <PreviewPane
                  collection={collection}
                  entry={entry}
                  fields={fields}
                  getMedia={getMedia}
                />
              </div>
            </SplitPane>
          </div>
        </ ScrollSync>
        <div className={styles.footer}>
          <Toolbar
            isPersisting={entry.get('isPersisting')}
            onPersist={onPersist}
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
  getMedia: PropTypes.func.isRequired,
  onAddMedia: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onPersist: PropTypes.func.isRequired,
  onRemoveMedia: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
};


export default EntryEditor;
