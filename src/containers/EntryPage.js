import React from 'react';
import { connect } from 'react-redux';
import { Map } from 'immutable';
import { loadEntry } from '../actions/entries';
import { selectEntry } from '../reducers/entries';
import EntryEditor from '../components/EntryEditor';

class EntryPage extends React.Component {
  constructor(props) {
    super(props);
    this.props.dispatch(loadEntry(props.collection, props.slug));
  }

  render() {
    const { entry, collection } = this.props;
    if (entry == null || entry.get('isFetching')) {
      return <div>Loading...</div>;
    }

    return (
      <EntryEditor
          entry={entry || new Map()}
          collection={collection}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const collection = collections.get(ownProps.params.name);
  const slug = ownProps.params.slug;
  const entry = selectEntry(state, collection.get('name'), slug);

  return {collection, collections, slug, entry};
}

export default connect(mapStateToProps)(EntryPage);
