import React from 'react';
import { connect } from 'react-redux';
import { Map } from 'immutable';
import EntryEditor from '../components/EntryEditor';

class EntryPage extends React.Component {
  render() {
    const { collection, entry } = this.props;

    return <EntryEditor entry={entry || new Map()} collection={collection}/>;
  }
}

function mapStateToProps(state, ownProps) {
  const { collections, media } = state;
  const collection = collections.get(ownProps.params.name);

  return {media, collection, collections};
}

export default connect(mapStateToProps)(EntryPage);
