const it = {
  auth: {
    login: 'Accedi',
    loggingIn: "Accesso in corso...",
    loginWithNetlifyIdentity: 'Accedi con Netlify Identity',
    loginWithBitbucket: 'Accedi con Bitbucket',
    loginWithGitHub: 'Accedi con GitHub',
    loginWithGitLab: 'Accedi con GitLab',
    loginWithGitea: 'Accedi con Gitea',
    errors: {
      email: 'Assicurati di inserire la tua mail.',
      password: 'Inserisci la tua password.',
      identitySettings:
        'Impossibile accedere alle impostazioni di Identity. Quando usi git-gateway come backend assicurati di abilitare il servizio Identity e Git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Contenuti',
      workflow: 'Flusso editoriale',
      media: 'Media',
      quickAdd: 'Aggiunta veloce',
    },
    app: {
      errorHeader: 'Errore nel caricamento della configurazione CMS',
      configErrors: 'Errori di configurazione',
      checkConfigYml: 'Controlla il tuo file config.yml.',
      loadingConfig: 'Caricando la configurazione...',
      waitingBackend: 'In attesa del backend...',
    },
    notFoundPage: {
      header: 'Non trovato',
    },
  },
  collection: {
    sidebar: {
      collections: 'Raccolte',
      searchAll: 'Cerca su tutto',
    },
    collectionTop: {
      viewAs: 'Vedi come',
      newButton: 'Aggiungi %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Caricamento delle voci in corso...',
      cachingEntries: 'Caricamento delle voci in cache...',
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
      onLeavePage: 'Vuoi davvero abbandonare questa pagina?',
      onUpdatingWithUnsavedChanges:
        'Hai delle modifiche non salvate, salvale prima di aggiornare lo stato.',
      onPublishingNotReady: 'Aggiorna lo stato a "Pronto" prima di pubblicare.',
      onPublishingWithUnsavedChanges:
        'Hai delle modifiche non salvate, salvale prima di pubblicare.',
      onPublishing: 'Vuoi davvero pubblicare questa voce?',
      onUnpublishing: 'Vuoi davvero nascondere questa voce?',
      onDeleteWithUnsavedChanges:
        'Vuoi davvero cancellare questa voce pubblicata e tutte le modifiche non salvate apportate durante la sessione corrente?',
      onDeletePublishedEntry: 'Vuoi davvero cancellare questa voce pubblicata?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Questo cancellerà tutte le modifiche a questa voce non pubblicate, come anche tutte le modifiche non salvate apportante durante la sessione corrente. Vuoi ancora cancellarle?',
      onDeleteUnpublishedChanges:
        'Tutte le modifiche non pubblicate a questa voce saranno cancellate. Vuoi ancora cancellarle?',
      loadingEntry: 'Caricando la voce...',
      confirmLoadBackup: 'Un backup locale è stato recuperato per questa voce, vuoi utilizzarlo?',
    },
    editorToolbar: {
      publishing: 'Pubblicazione in corso...',
      publish: 'Pubblica',
      published: 'Pubblicato',
      unpublish: 'Rimuovi dalla pubblicazione',
      duplicate: 'Duplica',
      unpublishing: 'Rimozione dalla pubblicazione in corso...',
      publishAndCreateNew: 'Pubblica e creane nuovo',
      publishAndDuplicate: 'Pubblica e duplica',
      deleteUnpublishedChanges: 'Cancella le modifiche non pubblicate',
      deleteUnpublishedEntry: 'Cancella voci non pubblicate',
      deletePublishedEntry: 'Cancella voce pubblicata',
      deleteEntry: 'Cancella voce',
      saving: 'Salvataggio...',
      save: 'Salva',
      deleting: 'Cancellazione in corso...',
      updating: 'Aggiornamento in corso...',
      status: 'Stato: %{status}',
      backCollection: ' Scrivendo nella raccolta %{collectionLabel}',
      unsavedChanges: 'Modifiche non salvate',
      changesSaved: 'Modifiche salvate',
      draft: 'Bozza',
      inReview: 'In revisione',
      ready: 'Pronto',
      publishNow: 'Pubblica ora',
      deployPreviewPendingButtonLabel: "Controlla l'anteprima",
      deployPreviewButtonLabel: "Visualizza l'anteprima",
      deployButtonLabel: 'Guarda Live',
    },
    editorWidgets: {
      image: {
        choose: "Scegli un'immagine",
        remove: 'Rimuovi immagine',
      },
      file: {
        choose: 'Scegli un file',
        chooseDifferent: 'Scegli un altro file',
        remove: 'Rimuovi file',
      },
      unknownControl: {
        noControl: "Nessun controllo per il widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Nessuna anteprima per il widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Intestazione 1',
        headingTwo: 'Intestazione 2',
        headingThree: 'Intestazione 3',
        headingFour: 'Intestazione 4',
        headingFive: 'Intestazione 5',
        headingSix: 'Intestazione 6',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Bozza',
    },
    mediaLibrary: {
      onDelete: 'Vuoi davvero cancellare il media selezionato?',
      fileTooLarge:
        'File troppo grande.\nLa configurazione non permette il caricamento di file piú grandi di %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Caricamento...',
      noResults: 'Nessun risultato.',
      noAssetsFound: 'Nessuna risorsa trovata.',
      noImagesFound: 'Nessuna immagine trovata.',
      private: 'Privato ',
      images: 'Immagini',
      mediaAssets: 'Risorse multimediali',
      search: 'Cerca...',
      uploading: 'Caricamento in corso...',
      upload: 'Upload',
      deleting: 'Cancellazione in corso...',
      deleteSelected: 'Cancella selezionato',
      chooseSelected: 'Prendi selezionato',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Errore',
      details: 'Si è verificato un errore - per favore ',
      reportIt: 'segnalo su GitHub.',
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
      onFailToLoadDeployPreview: "Caricamento dell'anteprima non riuscito: %{details}",
      onFailToPersist: 'Salvataggio della voce non riuscito: %{details}',
      onFailToDelete: 'Cancellazione della voce non riuscita: %{details}',
      onFailToUpdateStatus: 'Aggiornamento dello stato non riuscito: %{details}',
      missingRequiredField:
        'Oops, hai saltato un campo obbligatorio. Per favore completalo prima di salvare.',
      entrySaved: 'Voce salvata',
      entryPublished: 'Voce pubblicata',
      entryUnpublished: 'Voce rimossa dalla pubblicazione',
      onFailToPublishEntry: 'Pubblicazione fallita: %{details}',
      onFailToUnpublishEntry: 'Rimozione della pubblicazione fallita: %{details}',
      entryUpdated: 'Stato della voce aggiornato',
      onDeleteUnpublishedChanges: 'Modifiche non pubblicate cancellate',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Caricamento in corso delle voci del flusso editoriale',
      workflowHeading: 'Flusso editoriale',
      newPost: 'Nuovo post',
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
        'Solo le voci con lo stato "Pronto" possono essere pubblicati. Sposta la voce nella colonna "Pronto" per abilitare la pubblicazione.',
      onPublishEntry: 'Vuoi davvero pubblicare questa voce?',
      draftHeader: 'Bozze',
      inReviewHeader: 'In revisione',
      readyHeader: 'Pronto',
      currentEntries: '%{smart_count} voce |||| %{smart_count} voci',
    },
  },
};

export default it;
