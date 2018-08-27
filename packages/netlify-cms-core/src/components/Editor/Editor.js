import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { Loader } from 'netlify-cms-ui-default';
import history from 'Routing/history';
import { logoutUser } from 'Actions/auth';
import {
  loadEntry,
  loadEntries,
  createDraftFromEntry,
  createEmptyDraft,
  discardDraft,
  changeDraftField,
  changeDraftFieldValidation,
  persistEntry,
  deleteEntry,
} from 'Actions/entries';
import {
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
  deleteUnpublishedEntry,
} from 'Actions/editorialWorkflow';
import { deserializeValues } from 'Lib/serializeEntryValues';
import { selectEntry, selectUnpublishedEntry, getAsset } from 'Reducers';
import { selectFields } from 'Reducers/collections';
import { status } from 'Constants/publishModes';
import { EDITORIAL_WORKFLOW } from 'Constants/publishModes';
import EditorInterface from './EditorInterface';
import withWorkflow from './withWorkflow';

const navigateCollection = collectionPath => history.push(`/collections/${collectionPath}`);
const navigateToCollection = collectionName => navigateCollection(collectionName);
const navigateToNewEntry = collectionName => navigateCollection(`${collectionName}/new`);
const navigateToEntry = (collectionName, slug) =>
  navigateCollection(`${collectionName}/entries/${slug}`);

class Editor extends React.Component {
  static propTypes = {
    boundGetAsset: PropTypes.func.isRequired,
    changeDraftField: PropTypes.func.isRequired,
    changeDraftFieldValidation: PropTypes.func.isRequired,
    collection: ImmutablePropTypes.map.isRequired,
    createDraftFromEntry: PropTypes.func.isRequired,
    createEmptyDraft: PropTypes.func.isRequired,
    discardDraft: PropTypes.func.isRequired,
    entry: ImmutablePropTypes.map,
    entryDraft: ImmutablePropTypes.map.isRequired,
    loadEntry: PropTypes.func.isRequired,
    persistEntry: PropTypes.func.isRequired,
    deleteEntry: PropTypes.func.isRequired,
    showDelete: PropTypes.bool.isRequired,
    fields: ImmutablePropTypes.list.isRequired,
    slug: PropTypes.string,
    newEntry: PropTypes.bool.isRequired,
    displayUrl: PropTypes.string,
    hasWorkflow: PropTypes.bool,
    unpublishedEntry: PropTypes.bool,
    isModification: PropTypes.bool,
    collectionEntriesLoaded: PropTypes.bool,
    updateUnpublishedEntryStatus: PropTypes.func.isRequired,
    publishUnpublishedEntry: PropTypes.func.isRequired,
    deleteUnpublishedEntry: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
    loadEntries: PropTypes.func.isRequired,
    currentStatus: PropTypes.string,
    user: ImmutablePropTypes.map.isRequired,
    location: PropTypes.shape({
      pathname: PropTypes.string,
    }),
    hasChanged: PropTypes.bool,
  };

  componentDidMount() {
    const {
      newEntry,
      collection,
      slug,
      loadEntry,
      createEmptyDraft,
      loadEntries,
      collectionEntriesLoaded,
    } = this.props;

    if (newEntry) {
      createEmptyDraft(collection);
    } else {
      loadEntry(collection, slug);
    }

    const leaveMessage = 'Are you sure you want to leave this page?';

    this.exitBlocker = event => {
      if (this.props.entryDraft.get('hasChanged')) {
        // This message is ignored in most browsers, but its presence
        // triggers the confirmation dialog
        event.returnValue = leaveMessage;
        return leaveMessage;
      }
    };
    window.addEventListener('beforeunload', this.exitBlocker);

    const navigationBlocker = (location, action) => {
      /**
       * New entry being saved and redirected to it's new slug based url.
       */
      const isPersisting = this.props.entryDraft.getIn(['entry', 'isPersisting']);
      const newRecord = this.props.entryDraft.getIn(['entry', 'newRecord']);
      const newEntryPath = `/collections/${collection.get('name')}/new`;
      if (
        isPersisting &&
        newRecord &&
        this.props.location.pathname === newEntryPath &&
        action === 'PUSH'
      ) {
        return;
      }

      if (this.props.hasChanged) {
        return leaveMessage;
      }
    };
    const unblock = history.block(navigationBlocker);

    /**
     * This will run as soon as the location actually changes, unless creating
     * a new post. The confirmation above will run first.
     */
    this.unlisten = history.listen((location, action) => {
      const newEntryPath = `/collections/${collection.get('name')}/new`;
      const entriesPath = `/collections/${collection.get('name')}/entries/`;
      const { pathname } = location;
      if (
        pathname.startsWith(newEntryPath) ||
        (pathname.startsWith(entriesPath) && action === 'PUSH')
      ) {
        return;
      }
      unblock();
      this.unlisten();
    });

    if (!collectionEntriesLoaded) {
      loadEntries(collection);
    }
  }

  componentDidUpdate(prevProps) {
    /**
     * If the old slug is empty and the new slug is not, a new entry was just
     * saved, and we need to update navigation to the correct url using the
     * slug.
     */
    const newSlug = this.props.entryDraft && this.props.entryDraft.getIn(['entry', 'slug']);
    if (!prevProps.slug && newSlug && this.props.newEntry) {
      navigateToEntry(prevProps.collection.get('name'), newSlug);
      this.props.loadEntry(this.props.collection, newSlug);
    }

    if (prevProps.entry === this.props.entry) return;
    const { entry, newEntry, fields, collection } = this.props;

    if (entry && !entry.get('isFetching') && !entry.get('error')) {
      /**
       * Deserialize entry values for widgets with registered serializers before
       * creating the entry draft.
       */
      const values = deserializeValues(entry.get('data'), fields);
      const deserializedEntry = entry.set('data', values);
      const fieldsMetaData = this.props.entryDraft && this.props.entryDraft.get('fieldsMetaData');
      this.createDraft(deserializedEntry, fieldsMetaData);
    } else if (newEntry) {
      prevProps.createEmptyDraft(collection);
    }
  }

  componentWillUnmount() {
    this.props.discardDraft();
    window.removeEventListener('beforeunload', this.exitBlocker);
  }

  createDraft = (entry, metadata) => {
    if (entry) this.props.createDraftFromEntry(entry, metadata);
  };

  handleChangeStatus = newStatusName => {
    const {
      entryDraft,
      updateUnpublishedEntryStatus,
      collection,
      slug,
      currentStatus,
    } = this.props;
    if (entryDraft.get('hasChanged')) {
      window.alert('You have unsaved changes, please save before updating status.');
      return;
    }
    const newStatus = status.get(newStatusName);
    updateUnpublishedEntryStatus(collection.get('name'), slug, currentStatus, newStatus);
  };

  handlePersistEntry = async (opts = {}) => {
    const { createNew = false } = opts;
    const {
      persistEntry,
      collection,
      currentStatus,
      hasWorkflow,
      loadEntry,
      slug,
      createEmptyDraft,
    } = this.props;

    await persistEntry(collection);

    if (createNew) {
      navigateToNewEntry(collection.get('name'));
      createEmptyDraft(collection);
    } else if (slug && hasWorkflow && !currentStatus) {
      loadEntry(collection, slug);
    }
  };

  handlePublishEntry = async (opts = {}) => {
    const { createNew = false } = opts;
    const {
      publishUnpublishedEntry,
      entryDraft,
      collection,
      slug,
      currentStatus,
      loadEntry,
    } = this.props;
    if (currentStatus !== status.last()) {
      window.alert('Please update status to "Ready" before publishing.');
      return;
    } else if (entryDraft.get('hasChanged')) {
      window.alert('You have unsaved changes, please save before publishing.');
      return;
    } else if (!window.confirm('Are you sure you want to publish this entry?')) {
      return;
    }

    await publishUnpublishedEntry(collection.get('name'), slug);

    if (createNew) {
      navigateToNewEntry(collection.get('name'));
    } else {
      loadEntry(collection, slug);
    }
  };

  handleDeleteEntry = () => {
    const { entryDraft, newEntry, collection, deleteEntry, slug } = this.props;
    if (entryDraft.get('hasChanged')) {
      if (
        !window.confirm(
          'Are you sure you want to delete this published entry, as well as your unsaved changes from the current session?',
        )
      ) {
        return;
      }
    } else if (!window.confirm('Are you sure you want to delete this published entry?')) {
      return;
    }
    if (newEntry) {
      return navigateToCollection(collection.get('name'));
    }

    setTimeout(async () => {
      await deleteEntry(collection, slug);
      return navigateToCollection(collection.get('name'));
    }, 0);
  };

  handleDeleteUnpublishedChanges = async () => {
    const {
      entryDraft,
      collection,
      slug,
      deleteUnpublishedEntry,
      loadEntry,
      isModification,
    } = this.props;
    if (
      entryDraft.get('hasChanged') &&
      !window.confirm(
        'This will delete all unpublished changes to this entry, as well as your unsaved changes from the current session. Do you still want to delete?',
      )
    ) {
      return;
    } else if (
      !window.confirm(
        'All unpublished changes to this entry will be deleted. Do you still want to delete?',
      )
    ) {
      return;
    }
    await deleteUnpublishedEntry(collection.get('name'), slug);

    if (isModification) {
      loadEntry(collection, slug);
    } else {
      navigateToCollection(collection.get('name'));
    }
  };

  render() {
    const {
      entry,
      entryDraft,
      fields,
      boundGetAsset,
      collection,
      changeDraftField,
      changeDraftFieldValidation,
      user,
      hasChanged,
      displayUrl,
      hasWorkflow,
      unpublishedEntry,
      newEntry,
      isModification,
      currentStatus,
      logoutUser,
    } = this.props;

    if (entry && entry.get('error')) {
      return (
        <div>
          <h3>{entry.get('error')}</h3>
        </div>
      );
    } else if (
      entryDraft == null ||
      entryDraft.get('entry') === undefined ||
      (entry && entry.get('isFetching'))
    ) {
      return <Loader active>Loading entry...</Loader>;
    }

    return (
      <EditorInterface
        entry={entryDraft.get('entry')}
        getAsset={boundGetAsset}
        collection={collection}
        fields={fields}
        fieldsMetaData={entryDraft.get('fieldsMetaData')}
        fieldsErrors={entryDraft.get('fieldsErrors')}
        onChange={changeDraftField}
        onValidate={changeDraftFieldValidation}
        onPersist={this.handlePersistEntry}
        onDelete={this.handleDeleteEntry}
        onDeleteUnpublishedChanges={this.handleDeleteUnpublishedChanges}
        onChangeStatus={this.handleChangeStatus}
        onPublish={this.handlePublishEntry}
        showDelete={this.props.showDelete}
        user={user}
        hasChanged={hasChanged}
        displayUrl={displayUrl}
        hasWorkflow={hasWorkflow}
        hasUnpublishedChanges={unpublishedEntry}
        isNewEntry={newEntry}
        isModification={isModification}
        currentStatus={currentStatus}
        onLogoutClick={logoutUser}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collections, entryDraft, auth, config, entries } = state;
  const slug = ownProps.match.params.slug;
  const collection = collections.get(ownProps.match.params.name);
  const collectionName = collection.get('name');
  const newEntry = ownProps.newRecord === true;
  const fields = selectFields(collection, slug);
  const entry = newEntry ? null : selectEntry(state, collectionName, slug);
  const boundGetAsset = getAsset.bind(null, state);
  const user = auth && auth.get('user');
  const hasChanged = entryDraft.get('hasChanged');
  const displayUrl = config.get('display_url');
  const hasWorkflow = config.get('publish_mode') === EDITORIAL_WORKFLOW;
  const isModification = entryDraft.getIn(['entry', 'isModification']);
  const collectionEntriesLoaded = !!entries.getIn(['entities', collectionName]);
  const unpublishedEntry = selectUnpublishedEntry(state, collectionName, slug);
  const currentStatus = unpublishedEntry && unpublishedEntry.getIn(['metaData', 'status']);
  return {
    collection,
    collections,
    newEntry,
    entryDraft,
    boundGetAsset,
    fields,
    slug,
    entry,
    user,
    hasChanged,
    displayUrl,
    hasWorkflow,
    isModification,
    collectionEntriesLoaded,
    currentStatus,
  };
}

export default connect(
  mapStateToProps,
  {
    changeDraftField,
    changeDraftFieldValidation,
    loadEntry,
    loadEntries,
    createDraftFromEntry,
    createEmptyDraft,
    discardDraft,
    persistEntry,
    deleteEntry,
    updateUnpublishedEntryStatus,
    publishUnpublishedEntry,
    deleteUnpublishedEntry,
    logoutUser,
  },
)(withWorkflow(Editor));
