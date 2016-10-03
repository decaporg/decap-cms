import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import {
  loadEntry,
  createDraftFromEntry,
  createEmptyDraft,
  discardDraft,
  changeDraft,
  persistEntry
} from '../actions/entries';
import { addMedia, removeMedia } from '../actions/media';
import { selectEntry, getMedia } from '../reducers';
import EntryEditor from '../components/EntryEditor';
import EntryPageHOC from './editorialWorkflow/EntryPageHOC';

class EntryPage extends React.Component {
  componentDidMount() {
    if (!this.props.newEntry) {
      this.props.loadEntry(this.props.collection, this.props.slug);

      this.createDraft(this.props.entry);
    } else {
      this.props.createEmptyDraft(this.props.collection);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entry === nextProps.entry) return;

    if (nextProps.entry && !nextProps.entry.get('isFetching')) {
      this.createDraft(nextProps.entry);
    } else if (nextProps.newEntry) {
      this.props.createEmptyDraft(nextProps.collection);
    }
  }

  componentWillUnmount() {
    this.props.discardDraft();
  }

  createDraft = entry => {
    if (entry) this.props.createDraftFromEntry(entry);
  };

  handlePersistEntry = () => {
    this.props.persistEntry(this.props.collection, this.props.entryDraft);
  };

  render() {
    const {
      entry, entryDraft, boundGetMedia, collection, changeDraft, addMedia, removeMedia
    } = this.props;

    if (entryDraft == null || entryDraft.get('entry') == undefined || entry && entry.get('isFetching')) {
      return <div>Loading...</div>;
    }
    return (
      <EntryEditor
          entry={entryDraft.get('entry')}
          getMedia={boundGetMedia}
          collection={collection}
          onChange={changeDraft}
          onAddMedia={addMedia}
          onRemoveMedia={removeMedia}
          onPersist={this.handlePersistEntry}
      />
    );
  }
}

EntryPage.propTypes = {
  addMedia: PropTypes.func.isRequired,
  boundGetMedia: PropTypes.func.isRequired,
  changeDraft: PropTypes.func.isRequired,
  collection: ImmutablePropTypes.map.isRequired,
  createDraftFromEntry: PropTypes.func.isRequired,
  createEmptyDraft: PropTypes.func.isRequired,
  discardDraft: PropTypes.func.isRequired,
  entry: ImmutablePropTypes.map,
  entryDraft: ImmutablePropTypes.map.isRequired,
  loadEntry: PropTypes.func.isRequired,
  persistEntry: PropTypes.func.isRequired,
  removeMedia: PropTypes.func.isRequired,
  slug: PropTypes.string,
  newEntry: PropTypes.bool.isRequired,
};

function mapStateToProps(state, ownProps) {
  const { collections, entryDraft } = state;
  const collection = collections.get(ownProps.params.name);
  const newEntry = ownProps.route && ownProps.route.newRecord === true;
  const slug = ownProps.params.slug;
  const entry = newEntry ? null : selectEntry(state, collection.get('name'), slug);
  const boundGetMedia = getMedia.bind(null, state);
  return { collection, collections, newEntry, entryDraft, boundGetMedia, slug, entry };
}

/*
 * Instead of checking the publish mode everywhere to dispatch & render the additional editorial workflow stuff,
 * We delegate it to a Higher Order Component
 */
EntryPage = EntryPageHOC(EntryPage);

export default connect(
  mapStateToProps,
  {
    changeDraft,
    addMedia,
    removeMedia,
    loadEntry,
    createDraftFromEntry,
    createEmptyDraft,
    discardDraft,
    persistEntry
  }
)(EntryPage);
