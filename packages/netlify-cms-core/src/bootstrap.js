import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Route } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import history from 'Routing/history';
import store from 'Redux';
import { mergeConfig } from 'Actions/config';
import { I18n } from 'react-polyglot';
import { ErrorBoundary } from 'UI';
import App from 'App/App';
import 'EditorWidgets';
import 'src/mediaLibrary';
import 'what-input';

const ROOT_ID = 'nc-root';

function bootstrap(opts = {}) {
  const { config } = opts;

  /**
   * Log the version number.
   */
  if (NETLIFY_CMS_VERSION) {
    console.log(`netlify-cms ${NETLIFY_CMS_VERSION}`);
  } else if (NETLIFY_CMS_CORE_VERSION) {
    console.log(`netlify-cms-core ${NETLIFY_CMS_CORE_VERSION}`);
  }

  /**
   * Get DOM element where app will mount.
   */
  function getRoot() {
    /**
     * Return existing root if found.
     */
    const existingRoot = document.getElementById(ROOT_ID);
    if (existingRoot) {
      return existingRoot;
    }

    /**
     * If no existing root, create and return a new root.
     */
    const newRoot = document.createElement('div');
    newRoot.id = ROOT_ID;
    document.body.appendChild(newRoot);
    return newRoot;
  }

  /**
   * Dispatch config to store if received. This config will be merged into
   * config.yml if it exists, and any portion that produces a conflict will be
   * overwritten.
   */
  if (config) {
    store.dispatch(mergeConfig(config));
  }

  /**
   * Locales
   */
  const locale = 'en';
  const messages = {
    app: {
      header: {
        content: 'Contents',
        workflow: 'Workflow',
        media: 'Media',
        quickAdd: 'Quick add',
      },
      app: {
        errorHeader: 'Error loading the CMS configuration',
        configErrors: 'Config Errors',
        checkConfigYml: 'Check your config.yml file.',
        loadingConfig: 'Loading configuration...',
        waitingBackend: 'Waiting for backend...',
      },
      notFoundPage: {
        header: 'Not Found',
      },
    },
    editor: {
      editorControlPane: {
        widget: {
          required: '%{fieldLabel} is required.',
          regexPattern: "%{fieldLabel} didn't match the pattern: %{pattern}.",
          processing: '%{fieldLabel} is processing.',
        },
      },
      editor: {
        onLeavePage: 'Are you sure you want to leave this page?',
        onUpdatingWithUnsavedChanges:
          'You have unsaved changes, please save before updating status.',
        onPublishingNotReady: 'Please update status to "Ready" before publishing.',
        onPublishingWithUnsavedChanges: 'You have unsaved changes, please save before publishing.',
        onPublishing: 'Are you sure you want to publish this entry?',
        onDeleteWithUnsavedChanges:
          'Are you sure you want to delete this published entry, as well as your unsaved changes from the current session?',
        onDeletePublishedEntry: 'Are you sure you want to delete this published entry?',
        onDeleteUnpublishedChangesWithUnsavedChanges:
          'This will delete all unpublished changes to this entry, as well as your unsaved changes from the current session. Do you still want to delete?',
        onDeleteUnpublishedChanges:
          'All unpublished changes to this entry will be deleted. Do you still want to delete?',
        loadingEntry: 'Loading entry...',
      },
      editorToolbar: {
        publishing: 'Publishing...',
        publish: 'Publish',
        published: 'Published',
        publishAndCreateNew: 'Publish and create new',
        deleteUnpublishedChanges: 'Delete unpublished changes',
        deleteUnpublishedEntry: 'Delete unpublished entry',
        deletePublishedEntry: 'Delete published entry',
        deleteEntry: 'Delete entry',
        saving: 'Saving...',
        save: 'Save',
        deleting: 'Deleting...',
        updating: 'Updating...',
        setStatus: 'Set status',
        backCollection: ' Writing in %{collectionLabel} collection',
        unsavedChanges: 'Unsaved Changes',
        changesSaved: 'Changes saved',
        draft: 'Draft',
        inReview: 'In review',
        ready: 'Ready',
        publishNow: 'Publish now',
      },
    },
    ui: {
      settingsDropdown: {
        logOut: 'Log Out',
      },
    },
    collection: {
      sidebar: {
        collections: 'Collections',
        searchAll: 'Search all',
      },
      collectionTop: {
        viewAs: 'View as',
      },
      entries: {
        loadingEntries: 'Loading Entries',
        cachingEntries: 'Caching Entries',
        longerLoading: 'This might take several minutes',
      },
    },
  };

  /**
   * Create connected root component.
   */
  const Root = () => (
    <I18n locale={locale} messages={messages}>
      <ErrorBoundary>
        <Provider store={store}>
          <ConnectedRouter history={history}>
            <Route component={App} />
          </ConnectedRouter>
        </Provider>
      </ErrorBoundary>
    </I18n>
  );

  /**
   * Render application root.
   */
  render(<Root />, getRoot());
}

export default bootstrap;
