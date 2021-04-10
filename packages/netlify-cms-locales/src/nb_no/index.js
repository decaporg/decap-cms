const nb_no = {
  auth: {
    login: 'Logg inn',
    loggingIn: 'Logger inn..',
    loginWithNetlifyIdentity: 'Logg på med Netlify Identity',
    loginWithBitbucket: 'Logg på med Bitbucket',
    loginWithGitHub: 'Logg på med GitHub',
    loginWithGitLab: 'Logg på med GitLab',
    errors: {
      email: 'Du må skrive inn e-posten din.',
      password: 'Du må skrive inn passordet ditt.',
      identitySettings:
        'Fant ingen innstillinger for Identity. Hvis du skal bruke git-gateway må du skru på Identity service og Git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Innhold',
      workflow: 'Arbeidsflyt',
      media: 'Media',
      quickAdd: 'Hurtiginnlegg',
    },
    app: {
      errorHeader: 'Det oppstod en feil under lastingen av CMS konfigurasjonen',
      configErrors: 'Konfigurasjonsfeil',
      checkConfigYml: 'Sjekk config.yml filen.',
      loadingConfig: 'Laster konfigurasjon...',
      waitingBackend: 'Venter på backend...',
    },
    notFoundPage: {
      header: 'Ikke funnet',
    },
  },
  collection: {
    sidebar: {
      collections: 'Samlinger',
      searchAll: 'Søk i alle',
    },
    collectionTop: {
      sortBy: 'Sorter etter',
      viewAs: 'Vis som',
      newButton: 'Ny %{collectionLabel}',
      ascending: 'Stigende',
      descending: 'Synkende',
    },
    entries: {
      loadingEntries: 'Laster innlegg...',
      cachingEntries: 'Mellomlagrer innlegg...',
      longerLoading: 'Dette kan ta opptil flere minutter',
      noEntries: 'Ingen innlegg',
    },
    defaultFields: {
      author: {
        label: 'Forfatter',
      },
      updatedOn: {
        label: 'Oppdatert',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'valgfritt',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} er påkrevd.',
        regexPattern: '%{fieldLabel} samsvarer ikke med mønsteret: %{pattern}.',
        processing: '%{fieldLabel} blir prosessert.',
        range: '%{fieldLabel} må være mellom %{minValue} og %{maxValue}.',
        min: '%{fieldLabel} må minst være %{minValue}.',
        max: '%{fieldLabel} må være %{maxValue} eller mindre.',
        rangeCount: '%{fieldLabel} må ha mellom %{minCount} og %{maxCount} element(er).',
        rangeCountExact: '%{fieldLabel} må ha nøyaktig %{count} element(er).',
        rangeMin: '%{fieldLabel} må minst ha %{minCount} element(er).',
        rangeMax: '%{fieldLabel} må ha %{maxCount} eller færre element(er).',
      },
    },
    editor: {
      onLeavePage: 'Er du sikker på du vil navigere bort fra denne siden?',
      onUpdatingWithUnsavedChanges: 'Du må lagre endringene dine før du oppdaterer status.',
      onPublishingNotReady: 'Du må endre status til "Klar" før du publiserer.',
      onPublishingWithUnsavedChanges: 'Du må lagre endringene dine før du kan publisere.',
      onPublishing: 'Er du sikker på at du vil publisere?',
      onUnpublishing: 'Er du sikker på at du vil avpublisere innlegget?',
      onDeleteWithUnsavedChanges:
        'Er du sikker på at du vil slette et publisert innlegg med tilhørende ulagrede endringer?',
      onDeletePublishedEntry: 'Er du sikker på at du vil slette dette publiserte innlegget?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Handlingen sletter endringer som ikke er publisert eller lagret enda. Er du sikker på du vil fortsette?',
      onDeleteUnpublishedChanges:
        'Alle endringer som ikke er publisert i dette innlegget vil gå tapt. Vil du fortsette?',
      loadingEntry: 'Laster innlegg...',
      confirmLoadBackup: 'Vil du gjenopprette tidligere endringer som ikke har blitt lagret?',
    },
    editorToolbar: {
      publishing: 'Publiserer...',
      publish: 'Publiser',
      published: 'Publisert',
      unpublish: 'Avpubliser',
      duplicate: 'Dupliser',
      unpublishing: 'Avpubliserer...',
      publishAndCreateNew: 'Publiser og lag nytt',
      publishAndDuplicate: 'Publiser og dupliser',
      deleteUnpublishedChanges: 'Slett upubliserte endringer',
      deleteUnpublishedEntry: 'Slett upublisert innlegg',
      deletePublishedEntry: 'Slett publisert innlegg',
      deleteEntry: 'Sletter innlegg',
      saving: 'Lagrer...',
      save: 'Lagre',
      deleting: 'Sletter...',
      updating: 'Oppdaterer...',
      setStatus: 'Sett status',
      backCollection: ' Skriver i samlingen %{collectionLabel}',
      unsavedChanges: 'Ulagrede endringer',
      changesSaved: 'Endringer lagret',
      draft: 'Kladd',
      inReview: 'Til godkjenning',
      ready: 'Klar',
      publishNow: 'Publiser nå',
      deployPreviewPendingButtonLabel: 'Kontroller forhåndsvisning',
      deployPreviewButtonLabel: 'Vis forhåndsvisning',
      deployButtonLabel: 'Vis i produksjon',
    },
    editorWidgets: {
      markdown: {
        richText: 'Rik-tekst',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Velg et bilde',
        chooseDifferent: 'Velg et annet bilde',
        remove: 'Fjern bilde',
      },
      file: {
        choose: 'Velg en fil',
        chooseDifferent: 'Velg en annen fil',
        remove: 'Fjern fil',
      },
      unknownControl: {
        noControl: "Ingen konfigurasjon for widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Ingen forhåndsvisning tilgjengelig for '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Overskrift 1',
        headingTwo: 'Overskrift 2',
        headingThree: 'Overskrift 3',
        headingFour: 'Overskrift 4',
        headingFive: 'Overskrift 5',
        headingSix: 'Overskrift 6',
      },
      datetime: {
        now: 'Nå',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Kladd',
    },
    mediaLibrary: {
      onDelete: 'Er du sikker på at du vil slette markert element?',
      fileTooLarge: 'Filen er for stor.\nMaksimal konfiguert filstørrelse er %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Laster...',
      noResults: 'Ingen resultater.',
      noAssetsFound: 'Ingen elementer funnet.',
      noImagesFound: 'Ingen bilder funnet.',
      private: 'Privat ',
      images: 'Bilder',
      mediaAssets: 'Mediebibliotek',
      search: 'Søk...',
      uploading: 'Laster opp...',
      upload: 'Last opp',
      download: 'Last ned',
      deleting: 'Sletter...',
      deleteSelected: 'Slett markert',
      chooseSelected: 'Velg markert',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Gå tilbake til siden',
    },
    errorBoundary: {
      title: 'Feil',
      details: 'Det har oppstått en feil. Det er fint om du ',
      reportIt: 'oppretter et issue på GitHub.',
      detailsHeading: 'Detaljer',
      privacyWarning:
        'Når du åpner et issue forhåndsutfylles feil og feilsøkingsdata. Dobbeltsjekk at informasjonen er riktig, og fjern eventuelle sensitive data.',
      recoveredEntry: {
        heading: 'Gjenopprettet dokument',
        warning: 'Det kan være lurt å ta kopi av innholdet før navigerer bort fra denne siden!',
        copyButtonLabel: 'Kopier til utklippstavle',
      },
    },
    settingsDropdown: {
      logOut: 'Logg ut',
    },
    toast: {
      onFailToLoadEntries: 'Kunne ikke laste innlegg: %{details}',
      onFailToLoadDeployPreview: 'Kunne ikke laste forhåndsvisning: %{details}',
      onFailToPersist: 'Kunne ikke lagre: %{details}',
      onFailToDelete: 'Kunne ikke slette: %{details}',
      onFailToUpdateStatus: 'Kunne ikke laste opp: %{details}',
      missingRequiredField:
        'Oisann, ser ut som du glemte et påkrevd felt. Du må fylle det ut før du kan fortsette.',
      entrySaved: 'Innlegg lagret',
      entryPublished: 'Innlegg publisert',
      entryUnpublished: 'Innlegg avpublisert',
      onFailToPublishEntry: 'Kunne ikke publisere: %{details}',
      onFailToUnpublishEntry: 'Kunne ikke avpublisere: %{details}',
      entryUpdated: 'Innleggsstatus oppdatert',
      onDeleteUnpublishedChanges: 'Avpubliserte endringer slettet',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Laster innlegg for redaksjonell arbeidsflyt',
      workflowHeading: 'Redaksjonell arbeidsflyt',
      newPost: 'Nytt innlegg',
      description:
        '%{smart_count} innlegg trenger gjennomgang, og %{readyCount} er klar til publisering. |||| %{smart_count} innlegg trenger gjennomgang, og %{readyCount} er klar til publisering ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} av %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'av %{author}',
      deleteChanges: 'Slett endringer',
      deleteNewEntry: 'Slett nytt innlegg',
      publishChanges: 'Publiser endringer',
      publishNewEntry: 'Publiser nytt innlegg',
    },
    workflowList: {
      onDeleteEntry: 'Er du sikker på du vil slette innlegget?',
      onPublishingNotReadyEntry:
        'Du kan bare publisere innlegg i "Klar" kolonnen. Trekk kortet til riktig kolonne for å fortsette.',
      onPublishEntry: 'Er du sikker på du vil publisere innlegget?',
      draftHeader: 'Kladd',
      inReviewHeader: 'Gjennomgås',
      readyHeader: 'Klar',
      currentEntries: '%{smart_count} innlegg |||| %{smart_count} innlegg',
    },
  },
};

export default nb_no;
