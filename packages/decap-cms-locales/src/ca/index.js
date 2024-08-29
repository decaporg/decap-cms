const ca = {
  auth: {
    login: 'Iniciar sessió',
    loggingIn: 'Iniciant sessió...',
    loginWithNetlifyIdentity: "Iniciar sessió amb l'identitat de Netlify",
    loginWithBitbucket: 'Iniciar sessió amb Bitbucket',
    loginWithGitHub: 'Iniciar sessió amb GitHub',
    loginWithGitLab: 'Iniciar sessió amb GitLab',
    loginWithGitea: 'Iniciar sessió amb Gitea',
    errors: {
      email: 'Comprova que has escrit el teu email.',
      password: 'Si us plau escriu la teva contrasenya.',
      identitySettings:
        "No s'ha pogut obtenir accés a les configuracions d'identitat. Quan feu servir backend de git-gateway, assegureu-vos que activeu el servei d’identitat i la passarel·la de Git.",
    },
  },
  app: {
    header: {
      content: 'Contingut',
      workflow: 'Flux Editorial',
      media: 'Multimèdia',
      quickAdd: 'Afegir',
    },
    app: {
      errorHeader: 'Error al carregar la configuració del CMS',
      configErrors: 'Errors de configuració',
      checkConfigYml: "Comprovi l'arxiu config.yml.",
      loadingConfig: 'Carregant configuració....',
      waitingBackend: 'Esperant al servidor...',
    },
    notFoundPage: {
      header: 'No trobat',
    },
  },
  collection: {
    sidebar: {
      collections: 'Col·leccions',
      allCollections: 'Totes les col·leccions',
      searchAll: 'Buscar tots',
      searchIn: 'Buscar a',
    },
    collectionTop: {
      sortBy: 'Ordenar per',
      viewAs: 'Veure com',
      newButton: 'Nou %{collectionLabel}',
      ascending: 'Ascendent',
      descending: 'Descendent',
      searchResults: 'Buscar resultats per "%{searchTerm}"',
      searchResultsInCollection: 'Buscar resultats per "%{searchTerm}" a %{collection}',
      filterBy: 'Filtrar per',
      groupBy: 'Agrupar per',
    },
    entries: {
      loadingEntries: 'Carregant entrades',
      cachingEntries: 'Emmagatzemant entrades a la caché',
      longerLoading: 'Això podria tardar uns minuts',
      noEntries: 'Cap entrada',
    },
    groups: {
      other: 'Altre',
      negateLabel: 'No %{label}',
    },
    defaultFields: {
      author: {
        label: 'Autor',
      },
      updatedOn: {
        label: 'Actualitzat el',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'opcional',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} és obligatori.',
        regexPattern: '%{fieldLabel} no coincideix amb el patró: %{pattern}.',
        processing: '%{fieldLabel} està processant.',
        range: "%{fieldLabel} ha d'estar entre %{minValue} i %{maxValue}.",
        min: '%{fieldLabel} ha ser com a mínim %{minValue}.',
        max: '%{fieldLabel} ha de ser %{maxValue} o més.',
        rangeCount: '%{fieldLabel} ha de tenir entre %{minCount} i %{maxCount} element(s).',
        rangeCountExact: '%{fieldLabel} ha de tenir exactament %{count} element(s).',
        rangeMin: "%{fieldLabel} ha de tenir com a mínim %{minCount} d'element(s).",
        rangeMax: '%{fieldLabel} ha de ser %{maxCount} o inferior.',
        invalidPath: `'%{path}' no és una ruta valida`,
        pathExists: `'%{path}' ja existeix`,
      },
      i18n: {
        writingInLocale: 'Escriure en %{locale}',
      },
    },
    editor: {
      onLeavePage: 'Estàs segur que vols deixar aquesta pàgina?',
      onUpdatingWithUnsavedChanges:
        "Tens canvis no guardats, si us plau, guarda'ls abans d'actualitzar l'estat.",
      onPublishingNotReady: 'Si us plau, actualitza l\'estat a "Llest" abans de publicar.',
      onPublishingWithUnsavedChanges:
        "Tens canvis no guardats, si us plau, guarda'ls abans de publicar-los.",
      onPublishing: 'Estàs segur que vols publicar aquesta entrada?',
      onUnpublishing: 'Estàs segur que vols esborrar aquesta entrada?',
      onDeleteWithUnsavedChanges:
        'Està segur que vol eliminar aquesta entrada publicada, així com els canvis no guardats de la sessió actual?',
      onDeletePublishedEntry: 'Està segur que vol eliminar aquesta entrada publicada?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        "Això eliminarà tots els canvis no publicats d'aquesta entrada així com els canvis no guardats de la sessió actual. Encara vol procedir?",
      onDeleteUnpublishedChanges:
        'Tots els canvis no publicats en aquesta entrada seràn esborrats. Encara els vol eliminar?',
      loadingEntry: 'Carregant entrada...',
      confirmLoadBackup:
        "S'ha recuperat una copia de seguretat local per aquesta entrada. La vol utilitzar?",
    },
    editorInterface: {
      toggleI18n: 'Mostrar/Amagar traduccions',
      togglePreview: 'Mostrar/Amagar previsualització',
    },
    editorToolbar: {
      publishing: 'Publicant...',
      publish: 'Publicar',
      published: 'Publicat',
      unpublish: 'Despublicar',
      duplicate: 'Duplicar',
      unpublishing: 'Despublicant...',
      publishAndCreateNew: 'Publicar i crear de nou',
      publishAndDuplicate: 'Publica i duplica',
      deleteUnpublishedChanges: 'Eliminar canvis no publicats',
      deleteUnpublishedEntry: 'Eliminar entrada no publicada',
      deletePublishedEntry: 'Eliminar entrada publicada',
      deleteEntry: 'Eliminar entrada',
      saving: 'Guardant...',
      save: 'Guardar',
      deleting: 'Eliminant...',
      updating: 'Actualizant...',
      status: 'Estat: %{status}',
      backCollection: 'Escrivint a la colecció %{collectionLabel}',
      unsavedChanges: 'Canvis no guardats',
      changesSaved: 'Canvis guardats',
      draft: 'Esborrany',
      inReview: 'En revisió',
      ready: 'Llest',
      publishNow: 'Publicar ara',
      deployPreviewPendingButtonLabel: 'Comprovar Vista Prèvia',
      deployPreviewButtonLabel: 'Veure Vista Prèvia',
      deployButtonLabel: 'Veure publicació',
    },
    editorWidgets: {
      markdown: {
        bold: 'Negreta',
        italic: 'Cursiva',
        code: 'Codi',
        link: 'Enllaç',
        linkPrompt: "Introdueix l'URL de l'enllaç",
        headings: 'Encapçalaments',
        bulletedList: 'Llista',
        numberedList: 'Llista numèrica',
        addComponent: 'Afegir component',
        richText: 'Text enriquit',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Escull una imatge',
        chooseUrl: 'Introdueix una URL',
        replaceUrl: 'Substitueix per una URL',
        promptUrl: "Introdueix l'URL de la imatge",
        chooseDifferent: 'Escull una imatge diferent',
        remove: 'Treu la imatge',
      },
      file: {
        choose: 'Escull un arxiu',
        chooseUrl: 'Introdueix una URL',
        replaceUrl: 'Substitueix per una URL',
        promptUrl: "Introdueix l'URL de l'arxiu",
        chooseDifferent: 'Escull un arxiu diferent',
        remove: 'Esborrar arxiu',
      },
      unknownControl: {
        noControl: "No existeix un control per al widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "No existeix una vista prèvia per al widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Encapçalament 1',
        headingTwo: 'Encapçalament 2',
        headingThree: 'Encapçalament 3',
        headingFour: 'Encapçalament 4',
        headingFive: 'Encapçalament 5',
        headingSix: 'Encapçalament 6',
      },
      datetime: {
        now: 'Ara',
        clear: 'Netejar',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Esborrany',
      copy: 'Copiar',
      copyUrl: 'Copiar URL',
      copyPath: 'Copiar path',
      copyName: 'Copiar nom',
      copied: 'Copiat',
    },
    mediaLibrary: {
      onDelete: 'Està segur de que vol eliminar el mitjà seleccionat?',
      fileTooLarge:
        'El fitxer és massa gran.\nLa configuració no permet fitxers més grans de %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Carregant...',
      noResults: 'Sense resultats.',
      noAssetsFound: 'Arxius no trobats.',
      noImagesFound: 'Imatges no trobades.',
      private: 'Privat',
      images: 'Imatges',
      mediaAssets: 'Arxius multimèdia',
      search: 'Buscar...',
      uploading: 'Penjant...',
      upload: 'Penjar nou',
      download: 'Descarregar',
      deleting: 'Eliminant...',
      deleteSelected: 'Eliminar selecció',
      chooseSelected: 'Confirmar selecció',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Torna enrere al lloc',
    },
    errorBoundary: {
      title: 'Error',
      details: "S'ha produït un error - si us plau ",
      reportIt: "Informa'ns d'això a GitHub.",
      detailsHeading: 'Detalls',
      recoveredEntry: {
        heading: 'Document recuperat',
        warning:
          'Si us plau, copiï/enganxi això en algun lloc abans de navegar a una altre pàgina!',
        copyButtonLabel: 'Copiar al porta-retalls',
      },
    },
    settingsDropdown: {
      logOut: 'Tancar sessió',
    },
    toast: {
      onFailToLoadEntries: "No s'ha ha pogut carregar l'entrada: %{details}",
      onFailToLoadDeployPreview: "No s'ha pogut carregar la vista prèvia: %{details}",
      onFailToPersist: "No s'ha pogut guardar l'entrada: %{details}",
      onFailToDelete: "No s'ha pogut eliminar l'entrada: %{details}",
      onFailToUpdateStatus: "No s'ha pogut actualitzar l'estat: %{details}",
      missingRequiredField:
        "Ups, no ha omplert un camp obligatori. Si us plau,  ompli'l abans de guardar.",
      entrySaved: 'Entrada guardada',
      entryPublished: 'Entrada publicada',
      entryUnpublished: 'Entrada despublicada',
      onFailToPublishEntry: "No s'ha pogut publicar: %{details}",
      onFailToUnpublishEntry: "No s'ha pogut despublicar l'entrada: %{details}",
      entryUpdated: "Estat de l'entrada actualitzat",
      onDeleteUnpublishedChanges: 'Canvis no publicats eliminats',
      onFailToAuth: '%{details}',
      onLoggedOut: 'La teva sessió ha estat tancada. Si us plau, torna a iniciar-la',
      onBackendDown: 'El servidor està patint problemes. Consulta %{details} per a més informació',
    },
  },
  workflow: {
    workflow: {
      loading: 'Carregant Entradas del Flux Editorial',
      workflowHeading: 'Flux Editorial',
      newPost: 'Nou article',
      description:
        '%{smart_count} entrada esperant revisió, %{readyCount} llesta per a publicar |||| %{smart_count} entrades esperant revisió, %{readyCount} llestes per a publicar. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} per %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'per %{author}',
      deleteChanges: 'Eliminar canvis',
      deleteNewEntry: 'Eliminar nova entrada',
      publishChanges: 'Publicar canvis',
      publishNewEntry: 'Publicar nova entrada',
    },
    workflowList: {
      onDeleteEntry: 'Està segur que vol borrar aquesta entrada?',
      onPublishingNotReadyEntry:
        'Només es poden publicar elements amb estat "Llest". Si us plau, arrossegui la targeta fins la columna "Llest" per a permetre\'n la publicació',
      onPublishEntry: 'Està segur que vol publicar aquesta entrada?',
      draftHeader: 'Esborranys',
      inReviewHeader: 'En revisió',
      readyHeader: 'Llest',
      currentEntries: '%{smart_count} entrada |||| %{smart_count} entrades',
    },
  },
};

export default ca;
