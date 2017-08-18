import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import history from '../routing/history';
import {
  loadEntry,
  createDraftFromEntry,
  createEmptyDraft,
  discardDraft,
  changeDraftField,
  changeDraftFieldValidation,
  persistEntry,
  deleteEntry,
} from '../actions/entries';
import { closeEntry } from '../actions/editor';
import { deserializeValues } from '../lib/serializeEntryValues';
import { addAsset, removeAsset } from '../actions/media';
import { openMediaLibrary } from '../actions/mediaLibrary';
import { openSidebar } from '../actions/globalUI';
import { selectEntry, getAsset } from '../reducers';
import { selectFields } from '../reducers/collections';
import EntryEditor from '../components/EntryEditor/EntryEditor';
import entryPageHOC from './editorialWorkflow/EntryPageHOC';
import { Loader } from '../components/UI';

class EntryPage extends React.Component {
  static propTypes = {
    addAsset: PropTypes.func.isRequired,
    boundGetAsset: PropTypes.func.isRequired,
    changeDraftField: PropTypes.func.isRequired,
    changeDraftFieldValidation: PropTypes.func.isRequired,
    collection: ImmutablePropTypes.map.isRequired,
    createDraftFromEntry: PropTypes.func.isRequired,
    createEmptyDraft: PropTypes.func.isRequired,
    discardDraft: PropTypes.func.isRequired,
    entry: ImmutablePropTypes.map,
    mediaPaths: ImmutablePropTypes.map.isRequired,
    entryDraft: ImmutablePropTypes.map.isRequired,
    loadEntry: PropTypes.func.isRequired,
    persistEntry: PropTypes.func.isRequired,
    deleteEntry: PropTypes.func.isRequired,
    showDelete: PropTypes.bool.isRequired,
    openMediaLibrary: PropTypes.func.isRequired,
    removeAsset: PropTypes.func.isRequired,
    closeEntry: PropTypes.func.isRequired,
    openSidebar: PropTypes.func.isRequired,
    fields: ImmutablePropTypes.list.isRequired,
    slug: PropTypes.string,
    newEntry: PropTypes.bool.isRequired,
  };

  componentDidMount() {
    const { entry, newEntry, collection, slug, loadEntry, createEmptyDraft } = this.props;
    this.props.openSidebar();
    if (newEntry) {
      createEmptyDraft(collection);
    } else {
      loadEntry(collection, slug);
    }

    this.unlisten = history.listenBefore((location) => {
      if (this.props.entryDraft.get('hasChanged')) {
        return "Are you sure you want to leave this page?";
      }
      return true;
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entry === nextProps.entry) return;
    const { entry, newEntry, fields, collection } = nextProps;

    if (entry && !entry.get('isFetching') && !entry.get('error')) {

      /**
       * Deserialize entry values for widgets with registered serializers before
       * creating the entry draft.
       */
      const values = deserializeValues(entry.get('data'), fields);
      const deserializedEntry = entry.set('data', values);
      this.createDraft(deserializedEntry);
    } else if (newEntry) {
      this.props.createEmptyDraft(collection);
    }
  }

  componentWillUnmount() {
    this.props.discardDraft();
    this.unlisten();
  }

  createDraft = (entry) => {
    if (entry) this.props.createDraftFromEntry(entry);
  };

  handleCloseEntry = () => {
    return this.props.closeEntry();
  };

  handlePersistEntry = () => {
    const { persistEntry, collection } = this.props;
    setTimeout(() => {
      persistEntry(collection).then(() => this.handleCloseEntry());
    }, 0);
  };

  handleDeleteEntry = () => {
    if (!window.confirm('Are you sure you want to delete this entry?')) { return; }
    if (this.props.newEntry) {
      return this.handleCloseEntry();
    }

    const { deleteEntry, entry, collection } = this.props;
    const slug = entry.get('slug');
    setTimeout(() => {
      deleteEntry(collection, slug).then(() => this.handleCloseEntry());
    }, 0);
  }

  render() {
    const {
      entry,
      entryDraft,
      fields,
      mediaPaths,
      boundGetAsset,
      collection,
      changeDraftField,
      changeDraftFieldValidation,
      openMediaLibrary,
      addAsset,
      removeAsset,
      closeEntry,
    } = this.props;

    if (entry && entry.get('error')) {
      return <div><h3>{ entry.get('error') }</h3></div>;
    } else if (entryDraft == null
      || entryDraft.get('entry') === undefined
      || (entry && entry.get('isFetching'))) {
      return <Loader active>Loading entry...</Loader>;
    }

    return (
      <EntryEditor
        entry={entryDraft.get('entry')}
        getAsset={boundGetAsset}
        collection={collection}
        fields={fields}
        fieldsMetaData={entryDraft.get('fieldsMetaData')}
        fieldsErrors={entryDraft.get('fieldsErrors')}
        mediaPaths={mediaPaths}
        onChange={changeDraftField}
        onValidate={changeDraftFieldValidation}
        onOpenMediaLibrary={openMediaLibrary}
        onAddAsset={addAsset}
        onRemoveAsset={removeAsset}
        onPersist={this.handlePersistEntry}
        onDelete={this.handleDeleteEntry}
        showDelete={this.props.showDelete}
        enableSave={entryDraft.get('hasChanged')}
        onCancelEdit={this.handleCloseEntry}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collections, entryDraft, mediaLibrary } = state;
  const slug = ownProps.params.slug;
  const collection = collections.get(ownProps.params.name);
  const newEntry = ownProps.route && ownProps.route.newRecord === true;
  const fields = selectFields(collection, slug);
  const entry = newEntry ? null : selectEntry(state, collection.get('name'), slug);
  const boundGetAsset = getAsset.bind(null, state);
  const mediaPaths = mediaLibrary.get('controlMedia');
  return {
    collection,
    collections,
    newEntry,
    entryDraft,
    mediaPaths,
    boundGetAsset,
    fields,
    slug,
    entry,
  };
}

export default connect(
  mapStateToProps,
  {
    changeDraftField,
    changeDraftFieldValidation,
    openMediaLibrary,
    addAsset,
    removeAsset,
    loadEntry,
    createDraftFromEntry,
    createEmptyDraft,
    discardDraft,
    persistEntry,
    deleteEntry,
    closeEntry,
    openSidebar,
  }
)(entryPageHOC(EntryPage));
