const it = {
  auth: {
    login: 'Accedi',
    loggingIn: "Effettuando l'accesso...",
    loginWithNetlifyIdentity: 'Accedi con Netlify Identity',
    loginWithBitbucket: 'Accedi con Bitbucket',
    loginWithGitHub: 'Accedi con GitHub',
    loginWithGitLab: 'Accedi con GitLab',
    errors: {
      email: 'Assicurati di inserire la tua mail.',
      password: 'Inserisci la tua password.',
      identitySettings:
        'Impossibile accedere alle impostazioni di Identity. Quando usi git-gateway come backend assicurati di abilitare il servizio Itentity e Git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Contenuti',
      workflow: 'Workflow',
      media: 'Media',
      quickAdd: 'Aggiunta veloce',
    },
    app: {
      errorHeader: 'Errore nel caricamento della configurazione CMS',
      configErrors: 'Errori di Configurazione',
      checkConfigYml: 'Controlla il tuo file config.yml.',
      loadingConfig: 'Caricando la configurazione...',
      waitingBackend: 'Attendi il backend...',
    },
    notFoundPage: {
      header: 'Non trovato',
    },
  },
  collection: {
    sidebar: {
      collections: 'Collezioni',
      searchAll: 'Cerca su tutto',
    },
    collectionTop: {
      viewAs: 'Vedi come',
      newButton: 'Nuovo/a %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Caricando le voci',
      cachingEntries: 'Cachando le voci',
      longerLoading: 'Questa operazione potrebbe durare diversi minuti',
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'opzionale',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} è richiesto.',
        regexPattern: '%{fieldLabel} non corrisponde allo schema: %{pattern}.',
        processing: '%{fieldLabel} sta elaborando.',
        range: '%{fieldLabel} deve essere tra %{minValue} e %{maxValue}.',
        min: '%{fieldLabel} deve essere almeno %{minValue}.',
        max: '%{fieldLabel} deve essere %{maxValue} o meno.',
      },
    },
    editor: {
      onLeavePage: 'Sei sicuro di voler lasciare questa pagina?',
      onUpdatingWithUnsavedChanges:
        'Hai delle modifiche non salvate, salvale prima di aggiornare lo status.',
      onPublishingNotReady: 'Aggiorna lo status a "Pronto" prima di pubblicare.',
      onPublishingWithUnsavedChanges:
        'Hai delle modifiche non salvate, salvale prima di pubblicare.',
      onPublishing: 'Sei sicuro di voler pubblicare questa voce?',
      onUnpublishing: 'Sei sicuro di voler nascondere questa voce?',
      onDeleteWithUnsavedChanges:
        'Sei sicuro di voler cancellare questa voce pubblicata e tutte le modifiche non salvate della tua sessione corrente?',
      onDeletePublishedEntry: 'Sei sicuro di voler cancellare questa voce pubblicata?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Questo cancellerà tutte le modifiche non pubblicate di questa voce, come anche tutte le modifiche non salvate della sessione corrente. Vuoi ancora cancellarle?',
      onDeleteUnpublishedChanges:
        'Tutte le modifiche non pubblicate a questa voce saranno cancellate. Vuoi ancora cancellarle?',
      loadingEntry: 'Caricando la voce...',
      confirmLoadBackup: 'Un backup locale è stato recuperato per questa voce, vuoi utilizzarlo?',
    },
    editorToolbar: {
      publishing: 'Pubblicando...',
      publish: 'Pubblica',
      published: 'Pubblicato',
      unpublish: 'Rimuovi dalla pubblicazione',
      duplicate: 'Duplica',
      unpublishing: 'Rimuovendo dalla pubblicazione...',
      publishAndCreateNew: 'Pubblica e creane uno nuovo',
      publishAndDuplicate: 'Pubblica e duplica',
      deleteUnpublishedChanges: 'Cancella le modifiche non pubblicate',
      deleteUnpublishedEntry: 'Cancella le voci non pubblicate',
      deletePublishedEntry: 'Cancella la voce pubblicata',
      deleteEntry: 'Cancella voce',
      saving: 'Salvando...',
      save: 'Salva',
      deleting: 'Cancellando...',
      updating: 'Aggiornando...',
      setStatus: 'Imposta status',
      backCollection: ' Scrivendo nella sezione %{collectionLabel}',
      unsavedChanges: 'Modifiche non salvate',
      changesSaved: 'Modifiche salvate',
      draft: 'Bozza',
      inReview: 'In revisione',
      ready: 'Pronto',
      publishNow: 'Pubblica ora',
      deployPreviewPendingButtonLabel: "Controlla l'anteprima",
      deployPreviewButtonLabel: "Guarda l'anteprima",
      deployButtonLabel: 'Guarda Live',
    },
    editorWidgets: {
      image: {
        choose: "Scegli un'immagine",
        chooseDifferent: "Scegli un'immagine diversa",
        remove: 'Rimuovi immagine',
      },
      file: {
        choose: 'Scegli un file',
        chooseDifferent: 'Scegli un altro file',
        remove: 'Rimuovi il file',
      },
      unknownControl: {
        noControl: "Nessun controllo per il widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Nessuna preview per il widget '%{widget}'.",
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
      draft: 'Bozza',
    },
    mediaLibrary: {
      onDelete: 'Sei sicuro di voler cancellare il media selezionato?',
      fileTooLarge:
        'File troppo grande.\nConfigurato per non accettare file piú grandi di %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Caricamento...',
      noResults: 'Nessun risultato.',
      noAssetsFound: 'Nessun assets trovato.',
      noImagesFound: 'Nessuna immagine trovata.',
      private: 'Privato ',
      images: 'Immagini',
      mediaAssets: 'Media assets',
      search: 'Cerca...',
      uploading: 'Uploading...',
      upload: 'Upload',
      deleting: 'Deleting...',
      deleteSelected: 'Cancella selezionato',
      chooseSelected: 'Prendi selezionato',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Errore',
      details: "C'è stato un errore - per favore ",
      reportIt: 'riportalo.',
      detailsHeading: 'Dettagli',
      recoveredEntry: {
        heading: 'Documento recuperato',
        warning: 'Per favore copia/incollalo da qualche parte prima di navigare altrove!',
        copyButtonLabel: 'Copialo negli appunti',
      },
    },
    settingsDropdown: {
      logOut: 'Esci',
    },
    toast: {
      onFailToLoadEntries: 'Caricamento voce non riuscito: %{details}',
      onFailToLoadDeployPreview: 'Caricamento della preview non riuscito: %{details}',
      onFailToPersist: 'Salvataggio della voce non riuscito: %{details}',
      onFailToDelete: 'Cancellazione della voce non riuscita: %{details}',
      onFailToUpdateStatus: 'Aggiornamento dello status non riuscito: %{details}',
      missingRequiredField:
        'Oops, ti sei perso un campo obbligatorio. Per favore completalo prima di salvare.',
      entrySaved: 'Voce salvata',
      entryPublished: 'Voce pubblicata',
      entryUnpublished: 'Voce rimossa dalla pubblicazione',
      onFailToPublishEntry: 'Pubblicazione fallita: %{details}',
      onFailToUnpublishEntry: 'Rimozione della pubblicazione fallita: %{details}',
      entryUpdated: 'Status della voce aggiornato',
      onDeleteUnpublishedChanges: 'Modifiche non pubblicate cancellate',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Caricando le voci del Flusso Editoriale',
      workflowHeading: 'Flusso Editoriale',
      newPost: 'Nuovo Post',
      description:
        '%{smart_count} voce attende la revisione, %{readyCount} pronte per la pubblicazione. |||| %{smart_count} voci attendono la revisione, %{readyCount} pronte per la pubblicazione. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} da %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'da %{author}',
      deleteChanges: 'Cancella le modifiche',
      deleteNewEntry: 'Cancella nuova voce',
      publishChanges: 'Pubblica modifiche',
      publishNewEntry: 'Pubblica una nuova voce',
    },
    workflowList: {
      onDeleteEntry: 'Sei sicuro di voler cancellare questa voce?',
      onPublishingNotReadyEntry:
        'Solo gli oggetti con lo status "Pronto" possono essere pubblicati. Sposta la Card nella colonna "Pronto" per abilitare la pubblicazione.',
      onPublishEntry: 'Sei sicuro di voler pubblicare questa voce?',
      draftHeader: 'Bozze',
      inReviewHeader: 'In Revisione',
      readyHeader: 'Pronto',
      currentEntries: '%{smart_count} voce |||| %{smart_count} voci',
    },
  },
};

export default it;
