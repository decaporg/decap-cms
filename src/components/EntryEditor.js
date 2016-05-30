import React from 'react';
import ControlPane from './ControlPane';
import PreviewPane from './PreviewPane';

export default class EntryEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {entry: props.entry};
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(entry) {
    console.log('Got new entry: %o', entry.toObject());
    this.setState({entry: entry});
  }

  render() {
    const { collection, entry } = this.props;

    return <div>
      <h1>Entry in {collection.get('label')}</h1>
      <h2>{entry && entry.get('title')}</h2>
      <div className="cms-container">
        <div className="cms-control-pane">
          <ControlPane collection={collection} entry={this.state.entry} onChange={this.handleChange}/>
        </div>
        <div className="cms-preview-pane">
          <PreviewPane collection={collection} entry={this.state.entry}/>
        </div>
      </div>
    </div>
  }
}
