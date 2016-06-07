import React from 'react';
import Immutable from 'immutable';
import ControlPane from './ControlPane';
import PreviewPane from './PreviewPane';

export default class EntryEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entry: props.entry,
      mediaFiles: Immutable.List()
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleAddMedia = this.handleAddMedia.bind(this);
    this.handleRemoveMedia = this.handleRemoveMedia.bind(this);
    this.handleSave = this.handleSave.bind(this);
  }

  handleChange(entry) {
    this.setState({entry: entry});
  }

  handleAddMedia(mediaFile) {
    this.setState({mediaFiles: this.state.mediaFiles.push(mediaFile)});
  }

  handleRemoveMedia(mediaFile) {
    const newState = this.state.mediaFiles.filterNot((item) => item === mediaFile);
    this.state = {
      entry: this.props.entry,
      mediaFiles: Immutable.List(newState)
    };
  }

  handleSave() {
    this.props.onPersist(this.state.entry, this.state.mediaFiles);
  }

  render() {
    const { collection, entry } = this.props;

    return <div>
      <h1>Entry in {collection.get('label')}</h1>
      <h2>{entry && entry.get('title')}</h2>
      <div className="cms-container" style={styles.container}>
        <div className="cms-control-pane" style={styles.pane}>
          <ControlPane
              collection={collection}
              entry={this.state.entry}
              onChange={this.handleChange}
              onAddMedia={this.handleAddMedia}
              onRemoveMedia={this.handleRemoveMedia}
          />
        </div>
        <div className="cms-preview-pane" style={styles.pane}>
          <PreviewPane collection={collection} entry={this.state.entry}/>
        </div>
      </div>
      <button onClick={this.handleSave}>Save</button>
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
