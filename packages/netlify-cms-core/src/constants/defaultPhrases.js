export function getPhrases() {
  return {
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
    collection: {
      sidebar: {
        collections: 'Collections',
        searchAll: 'Search all',
      },
      collectionTop: {
        viewAs: 'View as',
        newButton: 'New %{collectionLabel}',
      },
      entries: {
        loadingEntries: 'Loading Entries',
        cachingEntries: 'Caching Entries',
        longerLoading: 'This might take several minutes',
      },
    },
    editor: {
      editorControlPane: {
        widget: {
          required: '%{fieldLabel} is required.',
          regexPattern: "%{fieldLabel} didn't match the pattern: %{pattern}.",
          processing: '%{fieldLabel} is processing.',
          range: '%{fieldLabel} must be between %{minValue} and %{maxValue}.',
          min: '%{fieldLabel} must be at least %{minValue}.',
          max: '%{fieldLabel} must be %{maxValue} or less.',
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
        confirmLoadBackup: 'A local backup was recovered for this entry, would you like to use it?',
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
        deployPreviewPendingButtonLabel: 'Check for Preview',
        deployPreviewButtonLabel: 'View Preview',
        deployButtonLabel: 'View Live',
      },
      editorWidgets: {
        unknownControl: {
          noControl: "No control for widget '%{widget}'.",
        },
        unknownPreview: {
          noPreview: "No preview for widget '%{widget}'.",
        },
      },
    },
    mediaLibrary: {
      mediaLibrary: {
        onDelete: 'Are you sure you want to delete selected media?',
      },
      mediaLibraryModal: {
        loading: 'Loading...',
        noResults: 'No results.',
        noAssetsFound: 'No assets found.',
        noImagesFound: 'No images found.',
        private: 'Private ',
        images: 'Images',
        mediaAssets: 'Media assets',
        search: 'Search...',
        uploading: 'Uploading...',
        uploadNew: 'Upload new',
        deleting: 'Deleting...',
        deleteSelected: 'Delete selected',
        chooseSelected: 'Choose selected',
      },
    },
    ui: {
      errorBoundary: {
        title: 'Error',
        details: "There's been an error - please ",
        reportIt: 'report it.',
        detailsHeading: 'Details',
        recoveredEntry: {
          heading: 'Recovered document',
          warning: 'Please copy/paste this somewhere before navigating away!',
          copyButtonLabel: 'Copy to clipboard',
        },
      },
      settingsDropdown: {
        logOut: 'Log Out',
      },
      toast: {
        onFailToLoadEntries: 'Failed to load entry: %{details}',
        onFailToLoadDeployPreview: 'Failed to load preview: %{details}',
        onFailToPersist: 'Failed to persist entry: %{details}',
        onFailToDelete: 'Failed to delete entry: %{details}',
        onFailToUpdateStatus: 'Failed to update status: %{details}',
        missingRequiredField:
          "Oops, you've missed a required field. Please complete before saving.",
        entrySaved: 'Entry saved',
        entryPublished: 'Entry published',
        onFailToPublishEntry: 'Failed to publish: %{details}',
        entryUpdated: 'Entry status updated',
        onDeleteUnpublishedChanges: 'Unpublished changes deleted',
        onFailToAuth: '%{details}',
      },
    },
    workflow: {
      workflow: {
        loading: 'Loading Editorial Workflow Entries',
        workflowHeading: 'Editorial Workflow',
        newPost: 'New Post',
        description:
          '%{smart_count} entry waiting for review, %{readyCount} ready to go live. |||| %{smart_count} entries waiting for review, %{readyCount} ready to go live. ',
      },
      workflowCard: {
        lastChange: '%{date} by %{author}',
        deleteChanges: 'Delete changes',
        deleteNewEntry: 'Delete new entry',
        publishChanges: 'Publish changes',
        publishNewEntry: 'Publish new entry',
      },
      workflowList: {
        onDeleteEntry: 'Are you sure you want to delete this entry?',
        onPublishingNotReadyEntry:
          'Only items with a "Ready" status can be published. Please drag the card to the "Ready" column to enable publishing.',
        onPublishEntry: 'Are you sure you want to publish this entry?',
        draftHeader: 'Drafts',
        inReviewHeader: 'In Review',
        readyHeader: 'Ready',
        currentEntries: '%{smart_count} entry |||| %{smart_count} entries',
      },
    },
  };
}
