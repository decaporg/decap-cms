import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { Loader } from 'netlify-cms-ui-default';
import { translate } from 'react-polyglot';
import { debounce } from 'lodash';
import history from 'Routing/history';
import { logoutUser } from 'Actions/auth';
import {
  loadEntry,
  loadEntries,
  createDraftFromEntry,
  createDraftDuplicateFromEntry,
  createEmptyDraft,
  discardDraft,
  changeDraftField,
  changeDraftFieldValidation,
  persistEntry,
  deleteEntry,
  persistLocalBackup,
  loadLocalBackup,
  retrieveLocalBackup,
  deleteLocalBackup,
} from 'Actions/entries';
import {
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
  unpublishPublishedEntry,
  deleteUnpublishedEntry,
} from 'Actions/editorialWorkflow';
import { loadDeployPreview } from 'Actions/deploys';
import { deserializeValues } from 'Lib/serializeEntryValues';
import { selectEntry, selectUnpublishedEntry, selectDeployPreview } from 'Reducers';
import { getAsset } from 'Actions/media';
import { selectFields } from 'Reducers/collections';
import { status, EDITORIAL_WORKFLOW } from 'Constants/publishModes';
import EditorInterface from './EditorInterface';
import withWorkflow from './withWorkflow';

const navigateCollection = collectionPath => history.push(`/collections/${collectionPath}`);
const navigateToCollection = collectionName => navigateCollection(collectionName);
const navigateToNewEntry = collectionName => navigateCollection(`${collectionName}/new`);
const navigateToEntry = (collectionName, slug) =>
  navigateCollection(`${collectionName}/entries/${slug}`);

export class Editor extends React.Component {
  static propTypes = {
    boundGetAsset: PropTypes.func.isRequired,
    changeDraftField: PropTypes.func.isRequired,
    changeDraftFieldValidation: PropTypes.func.isRequired,
    collection: ImmutablePropTypes.map.isRequired,
    createDraftFromEntry: PropTypes.func.isRequired,
    createDraftDuplicateFromEntry: PropTypes.func.isRequired,
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
    useOpenAuthoring: PropTypes.bool,
    unpublishedEntry: PropTypes.bool,
    isModification: PropTypes.bool,
    collectionEntriesLoaded: PropTypes.bool,
    updateUnpublishedEntryStatus: PropTypes.func.isRequired,
    publishUnpublishedEntry: PropTypes.func.isRequired,
    deleteUnpublishedEntry: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
    loadEntries: PropTypes.func.isRequired,
    deployPreview: ImmutablePropTypes.map,
    loadDeployPreview: PropTypes.func.isRequired,
    currentStatus: PropTypes.string,
    user: ImmutablePropTypes.map.isRequired,
    location: PropTypes.shape({
      pathname: PropTypes.string,
    }),
    hasChanged: PropTypes.bool,
    t: PropTypes.func.isRequired,
    retrieveLocalBackup: PropTypes.func.isRequired,
    localBackup: ImmutablePropTypes.map,
    loadLocalBackup: PropTypes.func,
    persistLocalBackup: PropTypes.func.isRequired,
    deleteLocalBackup: PropTypes.func,
  };

  componentDidMount() {
    const {
      newEntry,
      collection,
      slug,
      loadEntry,
      createEmptyDraft,
      loadEntries,
      retrieveLocalBackup,
      collectionEntriesLoaded,
      t,
    } = this.props;

    retrieveLocalBackup(collection, slug);

    if (newEntry) {
      createEmptyDraft(collection);
    } else {
      loadEntry(collection, slug);
    }

    const leaveMessage = t('editor.editor.onLeavePage');

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

      this.deleteBackup();

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

    if (!prevProps.localBackup && this.props.localBackup) {
      const confirmLoadBackup = window.confirm(this.props.t('editor.editor.confirmLoadBackup'));
      if (confirmLoadBackup) {
        this.props.loadLocalBackup();
      } else {
        this.deleteBackup();
      }
    }

    if (this.props.hasChanged) {
      this.createBackup(this.props.entryDraft.get('entry'), this.props.collection);
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
    this.createBackup.flush();
    this.props.discardDraft();
    window.removeEventListener('beforeunload', this.exitBlocker);
  }

  createBackup = debounce(function(entry, collection) {
    this.props.persistLocalBackup(entry, collection);
  }, 2000);

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
      t,
    } = this.props;
    if (entryDraft.get('hasChanged')) {
      window.alert(t('editor.editor.onUpdatingWithUnsavedChanges'));
      return;
    }
    const newStatus = status.get(newStatusName);
    updateUnpublishedEntryStatus(collection.get('name'), slug, currentStatus, newStatus);
  };

  deleteBackup() {
    const { deleteLocalBackup, collection, slug, newEntry } = this.props;
    this.createBackup.cancel();
    deleteLocalBackup(collection, !newEntry && slug);
  }

  handlePersistEntry = async (opts = {}) => {
    const { createNew = false, duplicate = false } = opts;
    const {
      persistEntry,
      collection,
      currentStatus,
      hasWorkflow,
      loadEntry,
      slug,
      createDraftDuplicateFromEntry,
      entryDraft,
    } = this.props;

    await persistEntry(collection);

    this.deleteBackup(collection, slug);

    if (createNew) {
      navigateToNewEntry(collection.get('name'));
      duplicate && createDraftDuplicateFromEntry(entryDraft.get('entry'));
    } else if (slug && hasWorkflow && !currentStatus) {
      loadEntry(collection, slug);
    }
  };

  handlePublishEntry = async (opts = {}) => {
    const { createNew = false, duplicate = false } = opts;
    const {
      publishUnpublishedEntry,
      createDraftDuplicateFromEntry,
      entryDraft,
      collection,
      slug,
      currentStatus,
      t,
    } = this.props;
    if (currentStatus !== status.last()) {
      window.alert(t('editor.editor.onPublishingNotReady'));
      return;
    } else if (entryDraft.get('hasChanged')) {
      window.alert(t('editor.editor.onPublishingWithUnsavedChanges'));
      return;
    } else if (!window.confirm(t('editor.editor.onPublishing'))) {
      return;
    }

    await publishUnpublishedEntry(collection.get('name'), slug);

    this.deleteBackup();

    if (createNew) {
      navigateToNewEntry(collection.get('name'));
    }

    duplicate && createDraftDuplicateFromEntry(entryDraft.get('entry'));
  };

  handleUnpublishEntry = async () => {
    const { unpublishPublishedEntry, collection, slug, t } = this.props;
    if (!window.confirm(t('editor.editor.onUnpublishing'))) return;

    await unpublishPublishedEntry(collection, slug);

    return navigateToCollection(collection.get('name'));
  };

  handleDuplicateEntry = () => {
    const { createDraftDuplicateFromEntry, collection, entryDraft } = this.props;

    navigateToNewEntry(collection.get('name'));
    createDraftDuplicateFromEntry(entryDraft.get('entry'));
  };

  handleDeleteEntry = () => {
    const { entryDraft, newEntry, collection, deleteEntry, slug, t } = this.props;
    if (entryDraft.get('hasChanged')) {
      if (!window.confirm(t('editor.editor.onDeleteWithUnsavedChanges'))) {
        return;
      }
    } else if (!window.confirm(t('editor.editor.onDeletePublishedEntry'))) {
      return;
    }
    if (newEntry) {
      return navigateToCollection(collection.get('name'));
    }

    setTimeout(async () => {
      await deleteEntry(collection, slug);
      this.deleteBackup();
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
      t,
    } = this.props;
    if (
      entryDraft.get('hasChanged') &&
      !window.confirm(t('editor.editor.onDeleteUnpublishedChangesWithUnsavedChanges'))
    ) {
      return;
    } else if (!window.confirm(t('editor.editor.onDeleteUnpublishedChanges'))) {
      return;
    }
    await deleteUnpublishedEntry(collection.get('name'), slug);

    this.deleteBackup();

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
      useOpenAuthoring,
      unpublishedEntry,
      newEntry,
      isModification,
      currentStatus,
      logoutUser,
      deployPreview,
      loadDeployPreview,
      draftKey,
      slug,
      t,
    } = this.props;

    const isPublished = !newEntry && !unpublishedEntry;

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
      return <Loader active>{t('editor.editor.loadingEntry')}</Loader>;
    }

    return (
      <EditorInterface
        draftKey={draftKey}
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
        unPublish={this.handleUnpublishEntry}
        onDuplicate={this.handleDuplicateEntry}
        showDelete={this.props.showDelete}
        user={user}
        hasChanged={hasChanged}
        displayUrl={displayUrl}
        hasWorkflow={hasWorkflow}
        useOpenAuthoring={useOpenAuthoring}
        hasUnpublishedChanges={unpublishedEntry}
        isNewEntry={newEntry}
        isModification={isModification}
        currentStatus={currentStatus}
        onLogoutClick={logoutUser}
        deployPreview={deployPreview}
        loadDeployPreview={opts => loadDeployPreview(collection, slug, entry, isPublished, opts)}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collections, entryDraft, auth, config, entries, globalUI } = state;
  const slug = ownProps.match.params[0];
  const collection = collections.get(ownProps.match.params.name);
  const collectionName = collection.get('name');
  const newEntry = ownProps.newRecord === true;
  const fields = selectFields(collection, slug);
  const entry = newEntry ? null : selectEntry(state, collectionName, slug);
  const user = auth && auth.get('user');
  const hasChanged = entryDraft.get('hasChanged');
  const displayUrl = config.get('display_url');
  const hasWorkflow = config.get('publish_mode') === EDITORIAL_WORKFLOW;
  const useOpenAuthoring = globalUI.get('useOpenAuthoring', false);
  const isModification = entryDraft.getIn(['entry', 'isModification']);
  const collectionEntriesLoaded = !!entries.getIn(['pages', collectionName]);
  const unpublishedEntry = selectUnpublishedEntry(state, collectionName, slug);
  const currentStatus = unpublishedEntry && unpublishedEntry.getIn(['metaData', 'status']);
  const deployPreview = selectDeployPreview(state, collectionName, slug);
  const localBackup = entryDraft.get('localBackup');
  const draftKey = entryDraft.get('key');
  return {
    collection,
    collections,
    newEntry,
    entryDraft,
    fields,
    slug,
    entry,
    user,
    hasChanged,
    displayUrl,
    hasWorkflow,
    useOpenAuthoring,
    isModification,
    collectionEntriesLoaded,
    currentStatus,
    deployPreview,
    localBackup,
    draftKey,
  };
}

const mapDispatchToProps = {
  changeDraftField,
  changeDraftFieldValidation,
  loadEntry,
  loadEntries,
  loadDeployPreview,
  loadLocalBackup,
  retrieveLocalBackup,
  persistLocalBackup,
  deleteLocalBackup,
  createDraftFromEntry,
  createDraftDuplicateFromEntry,
  createEmptyDraft,
  discardDraft,
  persistEntry,
  deleteEntry,
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
  unpublishPublishedEntry,
  deleteUnpublishedEntry,
  logoutUser,
  boundGetAsset: (collection, entryPath) => (dispatch, getState) => path => {
    return getAsset({ collection, entryPath, path })(dispatch, getState);
  },
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    boundGetAsset: dispatchProps.boundGetAsset(
      stateProps.collection,
      stateProps.entryDraft.getIn(['entry', 'path']),
    ),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(withWorkflow(translate()(Editor)));
