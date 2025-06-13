const it = {
  auth: {
    login: 'Accedi',
    loggingIn: 'Accesso in corso...',
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
      allCollections: 'Tutte le raccolte',
      searchAll: 'Cerca su tutto',
      searchIn: 'Cerca in',
    },
    collectionTop: {
      sortBy: 'Ordina per',
      viewAs: 'Vedi come',
      newButton: 'Aggiungi %{collectionLabel}',
      ascending: 'Crescente',
      descending: 'Decrescente',
      searchResults: 'Risultati di ricerca per "%{searchTerm}"',
      searchResultsInCollection: 'Risultati di ricerca per "%{searchTerm}" in %{collection}',
      filterBy: 'Filtra per',
      groupBy: 'Raggruppa per',
    },
    entries: {
      loadingEntries: 'Caricamento delle voci in corso...',
      cachingEntries: 'Caricamento delle voci in cache...',
      longerLoading: 'Questa operazione potrebbe durare diversi minuti',
      noEntries: 'Nessuna voce',
    },
    groups: {
      other: 'Altro',
      negateLabel: 'Non %{label}',
    },
    defaultFields: {
      author: {
        label: 'Autore',
      },
      updatedOn: {
        label: 'Aggiornato il',
      },
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
        rangeCount: '%{fieldLabel} deve avere tra %{minCount} e %{maxCount} elementi.',
        rangeCountExact: '%{fieldLabel} deve avere esattamente %{count} elementi.',
        rangeMin: '%{fieldLabel} deve avere almeno %{minCount} elementi.',
        rangeMax: '%{fieldLabel} deve avere al più %{maxCount} elementi.',
        invalidPath: `'%{path}' non è un percorso valido`,
        pathExists: `Il percorso '%{path}' esiste già`,
      },
      i18n: {
        writingInLocale: 'Scrivendo in %{locale}',
        copyFromLocale: "Compila con un'altra lingua",
        copyFromLocaleConfirm:
          "Vuoi compilare usando i dati in lingua %{locale}?\nL'intero contenuto verrà sovrascritto.",
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
    editorInterface: {
      toggleI18n: 'Alterna i18n',
      togglePreview: 'Alterna anteprima',
      toggleScrollSync: 'Sincronizza scorrimento',
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
      statusInfoTooltipDraft:
        'La voce è una bozza. Per finalizzarla e inviarla per la revisione, imposta lo stato su ‘In revisione’.',
      statusInfoTooltipInReview:
        'La voce è in revisione, non sono richieste ulteriori azioni. Puoi continuare ad apportare modifiche.',
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
      markdown: {
        bold: 'Grassetto',
        italic: 'Corsivo',
        code: 'Codice',
        link: 'Collegamento',
        linkPrompt: "Insersci l'URL del collegamento",
        headings: 'Intestazioni',
        quote: 'Citazione',
        bulletedList: 'Elenco puntato',
        numberedList: 'Elenco numerato',
        addComponent: 'Aggiungi componente',
        richText: 'Testo formattato',
        markdown: 'Markdown',
      },
      image: {
        choose: "Scegli un'immagine",
        chooseMultiple: 'Scegli più immagini',
        chooseUrl: 'Inserisci da URL',
        replaceUrl: 'Sostituisci con URL',
        promptUrl: "Inserisci l'URL dell'immagine",
        chooseDifferent: "Scegli un'altra immagine",
        addMore: 'Aggiungi altre immagini',
        remove: 'Rimuovi immagine',
        removeAll: 'Rimuovi tutte le immagini',
      },
      file: {
        choose: 'Scegli un file',
        chooseUrl: 'Inserisci da URL',
        chooseMultiple: 'Scegli più file',
        replaceUrl: 'Sostituisci con URL',
        promptUrl: "Inserisci l'URL del file",
        chooseDifferent: 'Scegli un altro file',
        addMore: 'Aggiungi altri file',
        remove: 'Rimuovi file',
        removeAll: 'Rimuovi tutti i file',
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
      datetime: {
        now: 'Adesso',
        clear: 'Pulisci',
      },
      list: {
        add: 'Aggiungi %{item}',
        addType: 'Aggiungi %{item}',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Bozza',
      copy: 'Copia',
      copyUrl: 'Copia URL',
      copyPath: 'Copia percorso',
      copyName: 'Copia nome',
      copied: 'Copiato',
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
      download: 'Download',
      deleting: 'Cancellazione in corso...',
      deleteSelected: 'Cancella selezionato',
      chooseSelected: 'Prendi selezionato',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Torna al sito',
    },
    errorBoundary: {
      title: 'Errore',
      details: 'Si è verificato un errore - per favore ',
      reportIt: 'segnalo su GitHub.',
      detailsHeading: 'Dettagli',
      privacyWarning:
        'La segnalazione sarà popolata automaticamente con il messaggio di errore e i dati di debug.\nPer favore, verifica che i dati siano corretti e rimuovi eventuali informazioni sensibili.',
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
      onLoggedOut:
        'È stato effettuato il logout, si prega di eseguire il backup dei dati e di effettuare nuovamente il login',
      onBackendDown:
        'Il servizio di backend non è raggiungibile. Consulta %{details} per maggiori informazioni',
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
