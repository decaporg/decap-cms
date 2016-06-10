import React from 'react';
import ControlPane from './ControlPane';
import PreviewPane from './PreviewPane';

export default class EntryEditor extends React.Component {

  render() {
    const { collection, entry, getMedia, onChange, onAddMedia, onPersist } = this.props;
    return <div>
      <h1>Entry in {collection.get('label')}</h1>
      <h2>{entry && entry.get('title')}</h2>
      <div className="cms-container" style={styles.container}>
        <div className="cms-control-pane" style={styles.pane}>
          <ControlPane
              collection={collection}
              entry={entry}
              getMedia={getMedia}
              onChange={onChange}
              onAddMedia={onAddMedia}
          />
        </div>
        <div className="cms-preview-pane" style={styles.pane}>
          <PreviewPane collection={collection} entry={entry} getMedia={getMedia} />
        </div>
      </div>
      <button onClick={onPersist}>Save</button>
    </div>;
  }
}

const styles = {
  container: {
    display: 'flex'
  },
  pane: {
    width: '50%'
  }
};
