import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import {
  loadEntry,
  createDraft,
  discardDraft,
  changeDraft,
  persist
} from '../actions/entries';
import { addMedia, removeMedia } from '../actions/media';
import { selectEntry, getMedia } from '../reducers';
import EntryEditor from '../components/EntryEditor';

class EntryPage extends React.Component {
  constructor(props) {
    super(props);
    this.props.loadEntry(props.collection, props.slug);
    this.handlePersist = this.handlePersist.bind(this);
  }

  componentDidMount() {
    if (this.props.entry) {
      this.props.createDraft(this.props.entry);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entry !== nextProps.entry && !nextProps.entry.get('isFetching')) {
      this.props.createDraft(nextProps.entry);
    }
  }

  componentWillUnmount() {
    this.props.discardDraft();
  }

  handlePersist() {
    this.props.persist(this.props.collection, this.props.entryDraft);
  }

  render() {

    const {
      entry, entryDraft, boundGetMedia, collection, changeDraft, addMedia, removeMedia
    } = this.props;

    if (entry == null || entryDraft.get('entry') == undefined || entry.get('isFetching')) {
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
          onPersist={this.handlePersist}
      />
    );
  }
}

EntryPage.propTypes = {
  addMedia: PropTypes.func.isRequired,
  boundGetMedia: PropTypes.func.isRequired,
  changeDraft: PropTypes.func.isRequired,
  collection: ImmutablePropTypes.map.isRequired,
  createDraft: PropTypes.func.isRequired,
  discardDraft: PropTypes.func.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  entryDraft: ImmutablePropTypes.map.isRequired,
  loadEntry: PropTypes.func.isRequired,
  persist: PropTypes.func.isRequired,
  removeMedia: PropTypes.func.isRequired,
  slug: PropTypes.string.isRequired,
};

function mapStateToProps(state, ownProps) {
  const { collections, entryDraft } = state;
  const collection = collections.get(ownProps.params.name);
  const slug = ownProps.params.slug;
  const entry = selectEntry(state, collection.get('name'), slug);
  const boundGetMedia = getMedia.bind(null, state);
  return { collection, collections, entryDraft, boundGetMedia, slug, entry };
}

export default connect(
  mapStateToProps,
  {
    changeDraft,
    addMedia,
    removeMedia,
    loadEntry,
    createDraft,
    discardDraft,
    persist
  }
)(EntryPage);
