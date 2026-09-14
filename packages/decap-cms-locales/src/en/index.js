const en = {
  auth: {
    login: 'Login',
    loggingIn: 'Logging in...',
    loginWithNetlifyIdentity: 'Login with Netlify Identity',
    loginWithAzure: 'Login with Azure',
    loginWithBitbucket: 'Login with Bitbucket',
    loginWithGitHub: 'Login with GitHub',
    loginWithGitLab: 'Login with GitLab',
    loginWithGitea: 'Login with Gitea',
    loginWithForgejo: 'Login with Forgejo',
    errors: {
      email: 'Make sure to enter your email.',
      password: 'Please enter your password.',
      identitySettings:
        'Unable to access identity settings. When using git-gateway backend make sure to enable Identity service and Git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Contents',
      workflow: 'Workflow',
      // The deploy nav item doubles as the state indicator — see §A8. It reads
      // 'Deploys' at rest and names the state when there is one worth naming.
      // The nav item names the state whenever it knows one — a coloured dot
      // alone leaves the reader to work out what the colour means. 'Deploys'
      // is only the fallback for "nothing known yet".
      deploys: 'Deploys',
      deploysDeployed: 'Deployed',
      deploysPublishing: 'Publishing…',
      deploysBuilding: 'Building',
      deploysFailed: 'Build failed',
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
      allCollections: 'All Collections',
      searchAll: 'Search all',
      searchIn: 'Search in',
    },
    collectionTop: {
      sortBy: 'Sort by',
      viewAs: 'View as',
      viewAsList: 'List view option',
      viewAsGrid: 'Grid view option',
      newButton: '＋ %{collectionLabel}',
      newButtonAriaLabel: 'Create entry of type %{collectionLabel}',
      ascending: 'Ascending',
      descending: 'Descending',
      searchResults: 'Search Results for "%{searchTerm}"',
      searchResultsInCollection: 'Search Results for "%{searchTerm}" in %{collection}',
      filterBy: 'Filter by',
      groupBy: 'Group by',
    },
    entries: {
      loadingEntries: 'Loading Entries...',
      cachingEntries: 'Caching Entries...',
      longerLoading: 'This might take several minutes',
      noEntries: 'No Entries',
      unpublishedHeader: 'Unpublished Entries',
    },
    groups: {
      other: 'Other',
      negateLabel: 'Not %{label}',
    },
    defaultFields: {
      author: {
        label: 'Author',
      },
      updatedOn: {
        label: 'Updated On',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'optional',
        widgetLabel: '%{widgetLabel} field',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} is required.',
        regexPattern: "%{fieldLabel} didn't match the pattern: %{pattern}.",
        processing: '%{fieldLabel} is processing.',
        range: '%{fieldLabel} must be between %{minValue} and %{maxValue}.',
        min: '%{fieldLabel} must be at least %{minValue}.',
        max: '%{fieldLabel} must be %{maxValue} or less.',
        rangeCount: '%{fieldLabel} must have between %{minCount} and %{maxCount} item(s).',
        rangeCountExact: '%{fieldLabel} must have exactly %{count} item(s).',
        rangeMin: '%{fieldLabel} must be at least %{minCount} item(s).',
        rangeMax: '%{fieldLabel} must be %{maxCount} or less item(s).',
        invalidPath: `'%{path}' is not a valid path`,
        pathExists: `Path '%{path}' already exists`,
      },
      i18n: {
        writingInLocale: 'Writing in %{locale}',
        copyFromLocale: 'Fill in from another locale',
        copyFromLocaleConfirm:
          'Do you want to fill in data from %{locale} locale?\nAll existing content will be overwritten.',
      },
    },
    editor: {
      onLeavePage: 'Are you sure you want to leave this page?',
      onUpdatingWithUnsavedChanges: 'You have unsaved changes, please save before updating status.',
      onPublishingNotReady: 'Please update status to "Ready" before publishing.',
      onPublishingWithUnsavedChanges: 'You have unsaved changes, please save before publishing.',
      onPublishing: 'Are you sure you want to publish this entry?',
      onUnpublishing: 'Are you sure you want to unpublish this entry?',
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
    editorInterface: {
      toggleI18n: 'Toggle i18n',
      togglePreview: 'Toggle preview',
      toggleScrollSync: 'Sync scrolling',
      toggleNotes: 'Toggle notes',
    },
    editorNotesPane: {
      title: 'Notes',
      emptyState: 'No notes yet. Add your first note below to start collaborating.',
      addNote: 'Add Note',
      addPlaceholder: 'Add a note...',
      editPlaceholder: 'Edit your note...',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      resolve: 'Resolve',
      unresolve: 'Unresolve',
      confirmDelete: 'Are you sure you want to delete this note?',
      shortcut: 'Tip: Press Ctrl+Enter to add note quickly',
    },
    editorToolbar: {
      publishing: 'Publishing...',
      publish: 'Publish',
      published: 'Published',
      unpublish: 'Unpublish',
      duplicate: 'Duplicate',
      unpublishing: 'Unpublishing...',
      publishAndCreateNew: 'Publish and create new',
      publishAndDuplicate: 'Publish and duplicate',
      deleteUnpublishedChanges: 'Delete unpublished changes',
      deleteUnpublishedEntry: 'Delete unpublished entry',
      deletePublishedEntry: 'Delete published entry',
      deleteEntry: 'Delete entry',
      saving: 'Saving...',
      save: 'Save',
      statusInfoTooltipDraft:
        'Entry status is set to draft. To finalize and submit it for review, set the status to ‘In review’',
      statusInfoTooltipInReview:
        'Entry is being reviewed, no further actions are required. However, you can still make additional changes while it is being reviewed.',
      deleting: 'Deleting...',
      updating: 'Updating...',
      status: 'Status: %{status}',
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
      markdown: {
        bold: 'Bold',
        italic: 'Italic',
        strikethrough: 'Strikethrough',
        code: 'Code',
        link: 'Link',
        linkPrompt: 'Enter the URL of the link',
        headings: 'Headings',
        quote: 'Quote',
        bulletedList: 'Bulleted List',
        numberedList: 'Numbered List',
        addComponent: 'Add Component',
        richText: 'Rich Text',
        markdown: 'Markdown',
        toggleMode: {
          rich: 'Toggle to rich text mode',
          markdown: 'Toggle to markdown mode',
        },
      },
      image: {
        choose: 'Choose an image',
        chooseMultiple: 'Choose images',
        chooseUrl: 'Insert from URL',
        replaceUrl: 'Replace with URL',
        promptUrl: 'Enter the URL of the image',
        chooseDifferent: 'Choose different image',
        addMore: 'Add more images',
        remove: 'Remove image',
        removeAll: 'Remove all images',
      },
      file: {
        choose: 'Choose a file',
        chooseUrl: 'Insert from URL',
        chooseMultiple: 'Choose files',
        replaceUrl: 'Replace with URL',
        promptUrl: 'Enter the URL of the file',
        chooseDifferent: 'Choose different file',
        addMore: 'Add more files',
        remove: 'Remove file',
        removeAll: 'Remove all files',
      },
      unknownControl: {
        noControl: "No control for widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "No preview for widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Heading 1',
        headingTwo: 'Heading 2',
        headingThree: 'Heading 3',
        headingFour: 'Heading 4',
        headingFive: 'Heading 5',
        headingSix: 'Heading 6',
      },
      datetime: {
        now: 'Now',
        clear: 'Clear',
        setToNow: 'Set %{fieldLabel} to now',
      },
      list: {
        add: 'Add %{item}',
        addType: 'Add %{item}',
      },
      object: {
        expand: 'Expand',
        collapse: 'Collapse',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Draft',
      copy: 'Copy',
      copyUrl: 'Copy URL',
      copyPath: 'Copy Path',
      copyName: 'Copy Name',
      copied: 'Copied',
    },
    mediaLibrary: {
      onDelete: 'Are you sure you want to delete selected media?',
      fileTooLarge: 'File too large.\nConfigured to not allow files greater than %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Loading...',
      close: 'Close',
      noResults: 'No results.',
      noAssetsFound: 'No assets found.',
      noImagesFound: 'No images found.',
      private: 'Private ',
      images: 'Images',
      mediaAssets: 'Media assets',
      search: 'Search...',
      uploading: 'Uploading...',
      upload: 'Upload',
      download: 'Download',
      deleting: 'Deleting...',
      deleteSelected: 'Delete selected',
      chooseSelected: 'Choose selected',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Go back to site',
    },
    errorBoundary: {
      title: 'Error',
      details: "There's been an error - please ",
      reportIt: 'open an issue on GitHub.',
      detailsHeading: 'Details',
      privacyWarning:
        'Opening an issue pre-populates it with the error message and debugging data.\nPlease verify the information is correct and remove sensitive data if exists.',
      recoveredEntry: {
        heading: 'Recovered document',
        warning: 'Please copy/paste this somewhere before navigating away!',
        copyButtonLabel: 'Copy to clipboard',
      },
    },
    settingsDropdown: {
      logOut: 'Log Out',
      account: 'Account options dropdown',
    },
    // The header pill and the Deploys page. See decap-turbo
    // docs/deploy-status-plan.md §A8 — state belongs in a place on screen,
    // not in a toast that has to leave.
    deployStatus: {
      publishing: 'Publishing…',
      building: 'Building',
      live: 'Live',
      failed: 'Build failed',
    },
    deploys: {
      heading: 'Deploys',
      refresh: 'Refresh',
      refreshing: 'Refreshing…',
      viewSite: 'View site',
      summaryPublishing: 'Publishing %{count} change(s) — waiting for your site to build.',
      summaryBuilding: 'Your site is building.',
      summaryLive: 'Your latest change is live. Deployed %{time}.',
      summaryFailed: 'The last build failed. Your most recent change is not on the site yet.',
      summaryUnknown: 'No deploy has been reported for this site yet.',
      loadError: 'Could not load deploys: %{details}',
      multipleTargets: 'Deploys are reported from more than one place: %{targets}.',
      // Deliberately explicit about the most likely cause. Netlify reports
      // nothing to git about branch or production deploys, so a site without
      // the deploy webhook will always show an empty page (§A6).
      emptyConfigured:
        'Nothing recorded yet. If this site deploys on Netlify, add the deploy webhook in your Decap Turbo dashboard — Netlify does not report branch or production deploys to your git provider. Other hosts report automatically.',
      emptyUnknown: 'Loading deploys…',
      emptyFiltered: 'No deploys match these filters.',
      filterAny: 'Any',
      filterBranch: 'Branch',
      branchUnknown: 'Not reported',
      perPage: 'Per page',
      previousPage: 'Previous',
      nextPage: 'Next',
      pageRange: 'Showing %{first}–%{last} of %{total}',
      // Only ever seen on a branch that is not the one the site publishes
      // from, where "Live" is true of that branch's own URL and nothing else.
      liveOnBranchHint:
        "The current deploy of this branch, served at the branch's own URL — not the published site.",
      stalledHint:
        'This build was still running when your host last mentioned it, and nothing has been reported since. A deploy preview whose branch was deleted mid-build ends this way.',
      columnState: 'State',
      columnEntry: 'Saved entry',
      columnWhere: 'Published to',
      columnTarget: 'Reported by',
      columnCommit: 'Commit',
      columnWhen: 'When',
      webhook: 'Deploy webhook',
      gitProvider: 'Git provider',
      state: {
        pending: 'Queued',
        building: 'Building',
        // Only the newest success is actually live; every earlier one was live
        // once and has since been superseded, so it is 'Deployed'.
        live: 'Live',
        deployed: 'Deployed',
        failed: 'Failed',
        // Not a failure: the change ships inside a newer deploy.
        canceled: 'Superseded',
        // Not reported by the host — what we call a build that stopped being
        // mentioned. See `stalledHint`.
        stalled: 'Unknown',
      },
    },
    toast: {
      onFailToLoadEntries: 'Failed to load entry: %{details}',
      onFailToLoadDeployPreview: 'Failed to load preview: %{details}',
      onFailToPersist: 'Failed to persist entry: %{details}',
      onFailToDelete: 'Failed to delete entry: %{details}',
      onFailToUpdateStatus: 'Failed to update status: %{details}',
      missingRequiredField: "Oops, you've missed a required field. Please complete before saving.",
      entrySaved: 'Entry saved',
      // Deploy status. The save toast is short-lived; a deploy outcome arrives
      // later as its own notification, wherever the editor happens to be.
      // See decap-turbo docs/deploy-status-plan.md §A4b.
      entryPublishing: 'Saved · Publishing…',
      entryLive: 'Your change to “%{entry}” is live',
      entriesLive: '%{count} changes are live',
      entryDeployFailed: 'Your site failed to build',
      viewSite: 'View',
      // Used when a single entry is named and we know where it lives on the
      // built site — the editor is being told a specific change is live, so
      // the link should show them that change rather than the home page.
      viewEntry: 'View entry',
      viewBuildLog: 'View build log',
      entryPublished: 'Entry published',
      entryUnpublished: 'Entry unpublished',
      onFailToPublishEntry: 'Failed to publish: %{details}',
      onFailToUnpublishEntry: 'Failed to unpublish entry: %{details}',
      entryUpdated: 'Entry status updated',
      onDeleteUnpublishedChanges: 'Unpublished changes deleted',
      noteAdded: 'Note added',
      onFailToAddNote: 'Failed to add note: %{details}',
      noteUpdated: 'Note updated',
      onFailToUpdateNote: 'Failed to update note: %{details}',
      noteDeleted: 'Note deleted',
      onFailToDeleteNote: 'Failed to delete note: %{details}',
      noteResolved: 'Note resolved',
      noteReopened: 'Note reopened',
      onFailToToggleNote: 'Failed to toggle note resolution: %{details}',
      onFailToAuth: '%{details}',
      onLoggedOut: 'You have been logged out, please back up any data and login again',
      onBackendDown:
        'The backend service is experiencing an outage. See %{details} for more information',
    },
  },
  workflow: {
    workflow: {
      loading: 'Loading Editorial Workflow Entries',
      workflowHeading: 'Editorial Workflow',
      newPost: 'New Post',
      description:
        '%{smart_count} entry waiting for review, %{readyCount} ready to go live. |||| %{smart_count} entries waiting for review, %{readyCount} ready to go live. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} by %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'by %{author}',
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

export default en;
