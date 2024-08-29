const gr = {
  auth: {
    login: 'Σύνδεση',
    loggingIn: 'Σύνδεση στο...',
    loginWithNetlifyIdentity: 'Σύνδεση μέσω Netlify',
    loginWithBitbucket: 'Σύνδεση μέσω Bitbucket',
    loginWithGitHub: 'Σύνδεση μέσω GitHub',
    loginWithGitLab: 'Σύνδεση μέσω GitLab',
    loginWithGitea: 'Σύνδεση μέσω Gitea',
    errors: {
      email: 'Βεβαιωθείτε ότι έχετε εισαγάγει το email σας.',
      password: 'Παρακαλώ εισάγετε τον κωδικό πρόσβασής σας.',
      identitySettings:
        'Δεν είναι δυνατή η πρόσβαση στις ρυθμίσεις ταυτότητας. Όταν χρησιμοποιείτε το παρασκήνιο του git Gateway, φροντίστε να ενεργοποιήσετε την υπηρεσία Identity και το git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Περιεχόμενα',
      workflow: 'Ροής εργασίας',
      media: 'Πολυμέσα',
      quickAdd: 'Γρήγορη προσθήκη',
    },
    app: {
      errorHeader: 'Σφάλμα κατά τη φόρτωση της ρύθμισης παραμέτρων CMS',
      configErrors: 'Σφάλματα ρύθμισης παραμέτρων',
      checkConfigYml: 'Ελέγξτε το αρχείο config.yml.',
      loadingConfig: 'Φόρτωση ρύθμισης παραμέτρων...',
      waitingBackend: 'Αναμονή για παρασκηνιακό...',
    },
    notFoundPage: {
      header: 'Δεν βρέθηκε',
    },
  },
  collection: {
    sidebar: {
      collections: 'Συλλογές',
      searchAll: 'Αναζήτηση όλων',
    },
    collectionTop: {
      viewAs: 'Προβολή ως',
      newButton: 'Νέο %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Εγγραφές φόρτωσης',
      cachingEntries: 'Εγγραφές προσωρινής αποθήκευσης',
      longerLoading: 'Αυτό μπορεί να διαρκέσει αρκετά λεπτά',
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'προαιρετικός',
      },
    },
    editorControlPane: {
      widget: {
        required: 'Το %{fieldLabel} είναι απαραίτητο.',
        regexPattern: 'Το %{fieldLabel} δεν ταιριάζει με το μοτίβο: %{pattern}.',
        processing: 'Το %{fieldLabel} επεξεργάζεται.',
        range: 'Το %{fieldLabel} πρέπει να είναι μεταξύ %{minValue} και %{maxValue}.',
        min: 'Το %{fieldLabel} πρέπει να είναι τουλάχιστον %{minValue}.',
        max: 'Το %{fieldLabel} πρέπει να είναι %{maxValue} ή μικρότερο.',
      },
    },
    editor: {
      onLeavePage: 'Είστε βέβαιοι ότι θέλετε να αφήσετε αυτήν τη σελίδα;',
      onUpdatingWithUnsavedChanges:
        'Έχετε μη αποθηκευμένες αλλαγές, αποθηκεύστε πριν να ενημερώσετε την κατάσταση.',
      onPublishingNotReady: 'Ενημερώστε την κατάσταση σε "έτοιμο" πριν από τη δημοσίευση.',
      onPublishingWithUnsavedChanges:
        'Έχετε μη αποθηκευμένες αλλαγές, αποθηκεύστε πριν από τη δημοσίευση.',
      onPublishing: 'Είστε βέβαιοι ότι θέλετε να δημοσιεύσετε αυτήν την καταχώρηση;',
      onUnpublishing:
        'Είστε βέβαιοι ότι θέλετε να καταργήσετε τη δημοσίευση αυτής της καταχώρησης;',
      onDeleteWithUnsavedChanges:
        'Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτήν τη δημοσιευμένη καταχώρηση, καθώς και τις αλλαγές που δεν αποθηκεύσατε από την τρέχουσα περίοδο λειτουργίας;',
      onDeletePublishedEntry:
        'Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτήν τη δημοσιευμένη καταχώρηση;',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Αυτό θα διαγράψει όλες τις μη δημοσιευμένες αλλαγές σε αυτήν την καταχώρηση, καθώς και τις αλλαγές που δεν έχετε αποθηκεύσει από την τρέχουσα περίοδο λειτουργίας. Θέλετε ακόμα να διαγράψετε;',
      onDeleteUnpublishedChanges:
        'Όλες οι μη δημοσιευμένες αλλαγές σε αυτήν την καταχώρηση θα διαγραφούν. Θέλετε ακόμα να διαγράψετε;',
      loadingEntry: 'Φόρτωση εισόδου...',
      confirmLoadBackup:
        'Ανακτήθηκε ένα τοπικό αντίγραφο ασφαλείας για αυτήν την καταχώρηση, θέλετε να το χρησιμοποιήσετε;',
    },
    editorToolbar: {
      publishing: 'Δημοσίευση...',
      publish: 'Δημοσίευση',
      published: 'Δημοσιεύθηκε',
      unpublish: 'Κατάργηση δημοσίευσης',
      duplicate: 'Διπλότυπο',
      unpublishing: 'Κατάργηση δημοσίευσης...',
      publishAndCreateNew: 'Δημοσίευση και δημιουργία νέων',
      publishAndDuplicate: 'Δημοσίευση και αντίγραφο',
      deleteUnpublishedChanges: 'Διαγραφή μη δημοσιευμένων αλλαγών',
      deleteUnpublishedEntry: 'Διαγραφή μη δημοσιευμένης καταχώρησης',
      deletePublishedEntry: 'Διαγραφή δημοσιευμένης καταχώρησης',
      deleteEntry: 'Διαγραφή καταχώρησης',
      saving: 'Εξοικονόμηση...',
      save: 'Αποθήκευση',
      deleting: 'Διαγραφή...',
      updating: 'Ενημέρωση...',
      status: 'Κατάστασης: %{status}',
      backCollection: ' Εγγραφή στη συλλογή %{collectionLabel}',
      unsavedChanges: 'Μη αποθηκευμένες αλλαγές',
      changesSaved: 'Αλλαγές που αποθηκεύτηκαν',
      draft: 'Σχέδιο',
      inReview: 'Σε επανεξέταση',
      ready: 'Έτοιμα',
      publishNow: 'Δημοσίευση τώρα',
      deployPreviewPendingButtonLabel: 'Έλεγχος για προεπισκόπηση',
      deployPreviewButtonLabel: 'Προβολή προεπισκόπησης',
      deployButtonLabel: 'Προβολή Live',
    },
    editorWidgets: {
      image: {
        choose: 'Επιλέξτε μια εικόνα',
        chooseDifferent: 'Επιλέξτε διαφορετική εικόνα',
        remove: 'Αφαιρέστε την εικόνα',
      },
      file: {
        choose: 'Επιλέξτε ένα αρχείο',
        chooseDifferent: 'Επιλέξτε διαφορετικό αρχείο',
        remove: 'Αφαιρέστε το αρχείο',
      },
      unknownControl: {
        noControl: "Δεν υπάρχει έλεγχος για το widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Δεν υπάρχει προεπισκόπηση για το widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Heading 1',
        headingTwo: 'Heading 2',
        headingThree: 'Heading 3',
        headingFour: 'Heading 4',
        headingFive: 'Heading 5',
        headingSix: 'Heading 6',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Προσχέδιο',
    },
    mediaLibrary: {
      onDelete: 'Είστε βέβαιοι ότι θέλετε να διαγράψετε τα επιλεγμένα πολυμέσα;',
      fileTooLarge:
        'Το αρχείο είναι πολύ μεγάλο.\nΔεν επιτρέπονται αρχεία μεγαλύτερα από %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Φόρτωση...',
      noResults: 'Χωρίς αποτελέσματα.',
      noAssetsFound: 'Δεν βρέθηκαν αρχεία.',
      noImagesFound: 'Δεν βρέθηκαν εικόνες.',
      private: 'Ιδιωτικό',
      images: 'Εικόνες',
      mediaAssets: 'Αρχεία πολυμέσων',
      search: 'Αναζήτηση...',
      uploading: 'Φόρτωμα...',
      upload: 'Ανεβάστε νέα',
      deleting: 'Διαγραφή...',
      deleteSelected: 'Διαγραφή επιλεγμένου',
      chooseSelected: 'Επιλέξτε επιλεγμένο',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Σφάλμα',
      details: 'Υπάρχει ένα λάθος ',
      reportIt: 'παρακαλώ να το αναφέρετε.',
      detailsHeading: 'Λεπτομέρειες',
      recoveredEntry: {
        heading: 'Ανακτημένο έγγραφο',
        warning: 'Παρακαλώ αντιγράψτε/επικολλήστε αυτό κάπου πριν πλοηγηθείτε μακριά!',
        copyButtonLabel: 'Αντιγραφή στο Πρόχειρο',
      },
    },
    settingsDropdown: {
      logOut: 'Αποσύνδεση',
    },
    toast: {
      onFailToLoadEntries: 'Απέτυχε η φόρτωση της καταχώρησης: %{details}',
      onFailToLoadDeployPreview: 'Απέτυχε η φόρτωση της προεπισκόπησης: %{details}',
      onFailToPersist: 'Απέτυχε η διατήρηση της καταχώρησης:% {Details}',
      onFailToDelete: 'Απέτυχε η διαγραφή της καταχώρησης: %{details}',
      onFailToUpdateStatus: 'Απέτυχε η ενημέρωση της κατάστασης: %{details}',
      missingRequiredField:
        'Ουπς, ξεχάσατε ένα απαιτούμενο πεδίο. Συμπληρώστε το πριν από την αποθήκευση.',
      entrySaved: 'Η καταχώρηση Αποθηκεύτηκε',
      entryPublished: 'Η καταχώρηση δημοσιεύτηκε',
      entryUnpublished: 'Μη δημοσιευμένη καταχώρηση',
      onFailToPublishEntry: 'Η δημοσίευση απέτυχε: %{details}',
      onFailToUnpublishEntry: 'Απέτυχε η κατάργηση δημοσίευσης καταχώρησης: %{details}',
      entryUpdated: 'Η κατάσταση εισόδου ενημερώθηκε',
      onDeleteUnpublishedChanges: 'Οι μη δημοσιευμένες αλλαγές διαγράφηκαν',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Φόρτωση καταχωρήσεων ροής εργασίας σύνταξης',
      workflowHeading: 'Ροή εργασιών',
      newPost: 'Νέα δημοσίευση',
      description:
        '%{smart_count} καταχώρησεις σε αναμονή για αναθεώρηση, %{readyCount} έτοιμες για Live μετάβαση. |||| %{smart_count} καταχωρήσεις σε αναμονή για αναθεώρηση, %{readyCount} έτοιμες για Live μετάβαση. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} από %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'από %{author}',
      deleteChanges: 'Διαγραφή αλλαγών',
      deleteNewEntry: 'Διαγραφή νέας καταχώρησης',
      publishChanges: 'Δημοσίευση αλλαγών',
      publishNewEntry: 'Δημοσίευση νέας καταχώρησης',
    },
    workflowList: {
      onDeleteEntry: 'Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτήν την καταχώρηση;',
      onPublishingNotReadyEntry:
        'Μόνο τα στοιχεία με κατάσταση "Ready" μπορούν να δημοσιευτούν. Σύρετε την κάρτα στη στήλη "έτοιμο" για να ενεργοποιήσετε τη δημοσίευση.',
      onPublishEntry: 'Είστε βέβαιοι ότι θέλετε να δημοσιεύσετε αυτήν την καταχώρηση;',
      draftHeader: 'Προσχέδια',
      inReviewHeader: 'Σε ανασκόπηση',
      readyHeader: 'Έτοιμα',
      currentEntries: '%{smart_count} καταχωρηση |||| %{smart_count} καταχωρησεις',
    },
  },
};

export default gr;
