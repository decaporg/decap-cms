"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Editor = void 0;
var _debounce2 = _interopRequireDefault(require("lodash/debounce"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _reactRedux = require("react-redux");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _reactPolyglot = require("react-polyglot");
var _history = require("../../routing/history");
var _auth = require("../../actions/auth");
var _entries = require("../../actions/entries");
var _editorialWorkflow = require("../../actions/editorialWorkflow");
var _deploys = require("../../actions/deploys");
var _reducers = require("../../reducers");
var _collections = require("../../reducers/collections");
var _publishModes = require("../../constants/publishModes");
var _EditorInterface = _interopRequireDefault(require("./EditorInterface"));
var _withWorkflow = _interopRequireDefault(require("./withWorkflow"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
class Editor extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "createBackup", (0, _debounce2.default)(function (entry, collection) {
      this.props.persistLocalBackup(entry, collection);
    }, 2000));
    _defineProperty(this, "handleChangeDraftField", (field, value, metadata, i18n) => {
      const entries = [this.props.unPublishedEntry, this.props.publishedEntry].filter(Boolean);
      this.props.changeDraftField({
        field,
        value,
        metadata,
        entries,
        i18n
      });
    });
    _defineProperty(this, "handleChangeStatus", newStatusName => {
      const {
        entryDraft,
        updateUnpublishedEntryStatus,
        collection,
        slug,
        currentStatus,
        t
      } = this.props;
      if (entryDraft.get('hasChanged')) {
        window.alert(t('editor.editor.onUpdatingWithUnsavedChanges'));
        return;
      }
      const newStatus = _publishModes.status.get(newStatusName);
      updateUnpublishedEntryStatus(collection.get('name'), slug, currentStatus, newStatus);
    });
    _defineProperty(this, "handlePersistEntry", async (opts = {}) => {
      const {
        createNew = false,
        duplicate = false
      } = opts;
      const {
        persistEntry,
        collection,
        currentStatus,
        hasWorkflow,
        loadEntry,
        slug,
        createDraftDuplicateFromEntry,
        entryDraft
      } = this.props;
      await persistEntry(collection);
      this.deleteBackup();
      if (createNew) {
        (0, _history.navigateToNewEntry)(collection.get('name'));
        duplicate && createDraftDuplicateFromEntry(entryDraft.get('entry'));
      } else if (slug && hasWorkflow && !currentStatus) {
        loadEntry(collection, slug);
      }
    });
    _defineProperty(this, "handlePublishEntry", async (opts = {}) => {
      const {
        createNew = false,
        duplicate = false
      } = opts;
      const {
        publishUnpublishedEntry,
        createDraftDuplicateFromEntry,
        entryDraft,
        collection,
        slug,
        currentStatus,
        t
      } = this.props;
      if (currentStatus !== _publishModes.status.last()) {
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
        (0, _history.navigateToNewEntry)(collection.get('name'));
      }
      duplicate && createDraftDuplicateFromEntry(entryDraft.get('entry'));
    });
    _defineProperty(this, "handleUnpublishEntry", async () => {
      const {
        unpublishPublishedEntry,
        collection,
        slug,
        t
      } = this.props;
      if (!window.confirm(t('editor.editor.onUnpublishing'))) return;
      await unpublishPublishedEntry(collection, slug);
      return (0, _history.navigateToCollection)(collection.get('name'));
    });
    _defineProperty(this, "handleDuplicateEntry", () => {
      const {
        createDraftDuplicateFromEntry,
        collection,
        entryDraft
      } = this.props;
      (0, _history.navigateToNewEntry)(collection.get('name'));
      createDraftDuplicateFromEntry(entryDraft.get('entry'));
    });
    _defineProperty(this, "handleDeleteEntry", () => {
      const {
        entryDraft,
        newEntry,
        collection,
        deleteEntry,
        slug,
        t
      } = this.props;
      if (entryDraft.get('hasChanged')) {
        if (!window.confirm(t('editor.editor.onDeleteWithUnsavedChanges'))) {
          return;
        }
      } else if (!window.confirm(t('editor.editor.onDeletePublishedEntry'))) {
        return;
      }
      if (newEntry) {
        return (0, _history.navigateToCollection)(collection.get('name'));
      }
      setTimeout(async () => {
        await deleteEntry(collection, slug);
        this.deleteBackup();
        return (0, _history.navigateToCollection)(collection.get('name'));
      }, 0);
    });
    _defineProperty(this, "handleDeleteUnpublishedChanges", async () => {
      const {
        entryDraft,
        collection,
        slug,
        deleteUnpublishedEntry,
        loadEntry,
        isModification,
        t
      } = this.props;
      if (entryDraft.get('hasChanged') && !window.confirm(t('editor.editor.onDeleteUnpublishedChangesWithUnsavedChanges'))) {
        return;
      } else if (!window.confirm(t('editor.editor.onDeleteUnpublishedChanges'))) {
        return;
      }
      await deleteUnpublishedEntry(collection.get('name'), slug);
      this.deleteBackup();
      if (isModification) {
        loadEntry(collection, slug);
      } else {
        (0, _history.navigateToCollection)(collection.get('name'));
      }
    });
  }
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
      t
    } = this.props;
    retrieveLocalBackup(collection, slug);
    if (newEntry) {
      createEmptyDraft(collection, this.props.location.search);
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
      if (isPersisting && newRecord && this.props.location.pathname === newEntryPath && action === 'PUSH') {
        return;
      }
      if (this.props.hasChanged) {
        return leaveMessage;
      }
    };
    const unblock = _history.history.block(navigationBlocker);

    /**
     * This will run as soon as the location actually changes, unless creating
     * a new post. The confirmation above will run first.
     */
    this.unlisten = _history.history.listen((location, action) => {
      const newEntryPath = `/collections/${collection.get('name')}/new`;
      const entriesPath = `/collections/${collection.get('name')}/entries/`;
      const {
        pathname
      } = location;
      if (pathname.startsWith(newEntryPath) || pathname.startsWith(entriesPath) && action === 'PUSH') {
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
    const {
      newEntry,
      collection
    } = this.props;
    if (newEntry) {
      prevProps.createEmptyDraft(collection, this.props.location.search);
    }
  }
  componentWillUnmount() {
    this.createBackup.flush();
    this.props.discardDraft();
    window.removeEventListener('beforeunload', this.exitBlocker);
  }
  deleteBackup() {
    const {
      deleteLocalBackup,
      collection,
      slug,
      newEntry
    } = this.props;
    this.createBackup.cancel();
    deleteLocalBackup(collection, !newEntry && slug);
  }
  render() {
    const {
      entry,
      entryDraft,
      fields,
      collection,
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
      editorBackLink
    } = this.props;
    const isPublished = !newEntry && !unpublishedEntry;
    if (entry && entry.get('error')) {
      return (0, _core.jsx)("div", null, (0, _core.jsx)("h3", null, entry.get('error')));
    } else if (entryDraft == null || entryDraft.get('entry') === undefined || entry && entry.get('isFetching')) {
      return (0, _core.jsx)(_decapCmsUiDefault.Loader, {
        active: true
      }, t('editor.editor.loadingEntry'));
    }
    return (0, _core.jsx)(_EditorInterface.default, {
      draftKey: draftKey,
      entry: entryDraft.get('entry'),
      collection: collection,
      fields: fields,
      fieldsMetaData: entryDraft.get('fieldsMetaData'),
      fieldsErrors: entryDraft.get('fieldsErrors'),
      onChange: this.handleChangeDraftField,
      onValidate: changeDraftFieldValidation,
      onPersist: this.handlePersistEntry,
      onDelete: this.handleDeleteEntry,
      onDeleteUnpublishedChanges: this.handleDeleteUnpublishedChanges,
      onChangeStatus: this.handleChangeStatus,
      onPublish: this.handlePublishEntry,
      unPublish: this.handleUnpublishEntry,
      onDuplicate: this.handleDuplicateEntry,
      showDelete: this.props.showDelete,
      user: user,
      hasChanged: hasChanged,
      displayUrl: displayUrl,
      hasWorkflow: hasWorkflow,
      useOpenAuthoring: useOpenAuthoring,
      hasUnpublishedChanges: unpublishedEntry,
      isNewEntry: newEntry,
      isModification: isModification,
      currentStatus: currentStatus,
      onLogoutClick: logoutUser,
      deployPreview: deployPreview,
      loadDeployPreview: opts => loadDeployPreview(collection, slug, entry, isPublished, opts),
      editorBackLink: editorBackLink,
      t: t
    });
  }
}
exports.Editor = Editor;
_defineProperty(Editor, "propTypes", {
  changeDraftField: _propTypes.default.func.isRequired,
  changeDraftFieldValidation: _propTypes.default.func.isRequired,
  collection: _reactImmutableProptypes.default.map.isRequired,
  createDraftDuplicateFromEntry: _propTypes.default.func.isRequired,
  createEmptyDraft: _propTypes.default.func.isRequired,
  discardDraft: _propTypes.default.func.isRequired,
  entry: _reactImmutableProptypes.default.map,
  entryDraft: _reactImmutableProptypes.default.map.isRequired,
  loadEntry: _propTypes.default.func.isRequired,
  persistEntry: _propTypes.default.func.isRequired,
  deleteEntry: _propTypes.default.func.isRequired,
  showDelete: _propTypes.default.bool.isRequired,
  fields: _reactImmutableProptypes.default.list.isRequired,
  slug: _propTypes.default.string,
  newEntry: _propTypes.default.bool.isRequired,
  displayUrl: _propTypes.default.string,
  hasWorkflow: _propTypes.default.bool,
  useOpenAuthoring: _propTypes.default.bool,
  unpublishedEntry: _propTypes.default.bool,
  isModification: _propTypes.default.bool,
  collectionEntriesLoaded: _propTypes.default.bool,
  updateUnpublishedEntryStatus: _propTypes.default.func.isRequired,
  publishUnpublishedEntry: _propTypes.default.func.isRequired,
  deleteUnpublishedEntry: _propTypes.default.func.isRequired,
  logoutUser: _propTypes.default.func.isRequired,
  loadEntries: _propTypes.default.func.isRequired,
  deployPreview: _propTypes.default.object,
  loadDeployPreview: _propTypes.default.func.isRequired,
  currentStatus: _propTypes.default.string,
  user: _propTypes.default.object,
  location: _propTypes.default.shape({
    pathname: _propTypes.default.string,
    search: _propTypes.default.string
  }),
  hasChanged: _propTypes.default.bool,
  t: _propTypes.default.func.isRequired,
  retrieveLocalBackup: _propTypes.default.func.isRequired,
  localBackup: _reactImmutableProptypes.default.map,
  loadLocalBackup: _propTypes.default.func,
  persistLocalBackup: _propTypes.default.func.isRequired,
  deleteLocalBackup: _propTypes.default.func
});
function mapStateToProps(state, ownProps) {
  const {
    collections,
    entryDraft,
    auth,
    config,
    entries,
    globalUI
  } = state;
  const slug = ownProps.match.params[0];
  const collection = collections.get(ownProps.match.params.name);
  const collectionName = collection.get('name');
  const newEntry = ownProps.newRecord === true;
  const fields = (0, _collections.selectFields)(collection, slug);
  const entry = newEntry ? null : (0, _reducers.selectEntry)(state, collectionName, slug);
  const user = auth.user;
  const hasChanged = entryDraft.get('hasChanged');
  const displayUrl = config.display_url;
  const hasWorkflow = config.publish_mode === _publishModes.EDITORIAL_WORKFLOW;
  const useOpenAuthoring = globalUI.useOpenAuthoring;
  const isModification = entryDraft.getIn(['entry', 'isModification']);
  const collectionEntriesLoaded = !!entries.getIn(['pages', collectionName]);
  const unPublishedEntry = (0, _reducers.selectUnpublishedEntry)(state, collectionName, slug);
  const publishedEntry = (0, _reducers.selectEntry)(state, collectionName, slug);
  const currentStatus = unPublishedEntry && unPublishedEntry.get('status');
  const deployPreview = (0, _reducers.selectDeployPreview)(state, collectionName, slug);
  const localBackup = entryDraft.get('localBackup');
  const draftKey = entryDraft.get('key');
  let editorBackLink = `/collections/${collectionName}`;
  if (new URLSearchParams(ownProps.location.search).get('ref') === 'workflow') {
    editorBackLink = `/workflow`;
  }
  if (collection.has('nested') && slug) {
    const pathParts = slug.split('/');
    if (pathParts.length > 2) {
      editorBackLink = `${editorBackLink}/filter/${pathParts.slice(0, -2).join('/')}`;
    }
  }
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
    publishedEntry,
    unPublishedEntry,
    editorBackLink
  };
}
const mapDispatchToProps = {
  changeDraftField: _entries.changeDraftField,
  changeDraftFieldValidation: _entries.changeDraftFieldValidation,
  loadEntry: _entries.loadEntry,
  loadEntries: _entries.loadEntries,
  loadDeployPreview: _deploys.loadDeployPreview,
  loadLocalBackup: _entries.loadLocalBackup,
  retrieveLocalBackup: _entries.retrieveLocalBackup,
  persistLocalBackup: _entries.persistLocalBackup,
  deleteLocalBackup: _entries.deleteLocalBackup,
  createDraftDuplicateFromEntry: _entries.createDraftDuplicateFromEntry,
  createEmptyDraft: _entries.createEmptyDraft,
  discardDraft: _entries.discardDraft,
  persistEntry: _entries.persistEntry,
  deleteEntry: _entries.deleteEntry,
  updateUnpublishedEntryStatus: _editorialWorkflow.updateUnpublishedEntryStatus,
  publishUnpublishedEntry: _editorialWorkflow.publishUnpublishedEntry,
  unpublishPublishedEntry: _editorialWorkflow.unpublishPublishedEntry,
  deleteUnpublishedEntry: _editorialWorkflow.deleteUnpublishedEntry,
  logoutUser: _auth.logoutUser
};
var _default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)((0, _withWorkflow.default)((0, _reactPolyglot.translate)()(Editor)));
exports.default = _default;