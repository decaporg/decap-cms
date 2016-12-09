import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import SplitPane from 'react-split-pane';
import { ScrollSync, ScrollSyncPane } from '../ScrollSync';
import ControlPane from '../ControlPanel/ControlPane';
import PreviewPane from '../PreviewPane/PreviewPane';
import Toolbar from './EntryEditorToolbar';
import styles from './EntryEditor.css';

export default function EntryEditor(
  {
    collection,
    entry,
    fields,
    getMedia,
    onChange,
    onAddMedia,
    onRemoveMedia,
    onPersist,
    onCancelEdit,
  }) {
  return (
    <div className={styles.root}>


      <div className={styles.container}>
        <SplitPane defaultSize="50%">
          <div className={styles.controlPane}>
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
          <div className={styles.previewPane}>
            <PreviewPane
              collection={collection}
              entry={entry}
              fields={fields}
              getMedia={getMedia}
            />
          </div>
        </SplitPane>
      </div>

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
