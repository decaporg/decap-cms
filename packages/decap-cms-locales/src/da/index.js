const da = {
  auth: {
    login: 'Log ind',
    loggingIn: 'Logger ind...',
    loginWithNetlifyIdentity: 'Log ind med Netlify Identity',
    loginWithAzure: 'Log ind med Azure',
    loginWithBitbucket: 'Log ind med Bitbucket',
    loginWithGitHub: 'Log ind med GitHub',
    loginWithGitLab: 'Log ind med GitLab',
    loginWithGitea: 'Log ind med Gitea',
    errors: {
      email: 'Vær sikker på du har indtastet din e-mail.',
      password: 'Indtast dit kodeord.',
      identitySettings:
        'Kunne ikke tilgå identity opsætning. Ved brug af git-gateway som bagvedliggende service, sørg for at aktivere Identity service og Git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Indhold',
      workflow: 'Arbejdsgang',
      media: 'Medier',
      quickAdd: 'Hurtig opret',
    },
    app: {
      errorHeader: 'Fejl ved indlæsning af CMS opsætningen',
      configErrors: 'Opsætningsfejl',
      checkConfigYml: 'Kontroller din config.yml fil.',
      loadingConfig: 'Indlæser opsætning...',
      waitingBackend: 'Venter på bagvedliggende service...',
    },
    notFoundPage: {
      header: 'Ikke fundet',
    },
  },
  collection: {
    sidebar: {
      collections: 'Samlinger',
      allCollections: 'Alle samlinger',
      searchAll: 'Søg i alt',
      searchIn: 'Søg i',
    },
    collectionTop: {
      sortBy: 'Sorter efter',
      viewAs: 'Vis som',
      newButton: 'Ny %{collectionLabel}',
      ascending: 'Stigende',
      descending: 'Faldende',
      searchResults: 'Søgeresultater for "%{searchTerm}"',
      searchResultsInCollection: 'Søgeresultater for "%{searchTerm}" i %{collection}',
      filterBy: 'Filtrer efter',
      groupBy: 'Grupper efter',
    },
    entries: {
      loadingEntries: 'Indlæser dokumenter...',
      cachingEntries: 'Caching af dokumenter...',
      longerLoading: 'Dette kan tage adskillige minutter',
      noEntries: 'Ingen dokumenter',
    },
    groups: {
      other: 'Anden',
      negateLabel: 'Ikke %{label}',
    },
    defaultFields: {
      author: {
        label: 'Forfatter',
      },
      updatedOn: {
        label: 'Opdateret ',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'kan udelades',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} er påkrævet.',
        regexPattern: '%{fieldLabel} matchede ikke: %{pattern}.',
        processing: '%{fieldLabel} behandles.',
        range: '%{fieldLabel} skal være mellem %{minValue} og %{maxValue}.',
        min: '%{fieldLabel} skal være mindst %{minValue}.',
        max: '%{fieldLabel} være være %{maxValue} eller mindre.',
        rangeCount: '%{fieldLabel} skal have mellem %{minCount} og %{maxCount} element(er).',
        rangeCountExact: '%{fieldLabel} skal have præcis %{count} element(er).',
        rangeMin: '%{fieldLabel} skal have mindst %{minCount} element(er).',
        rangeMax: '%{fieldLabel} skal have %{maxCount} eller færre element(er).',
        invalidPath: `'%{path}' er ikke en gyldig sti`,
        pathExists: `Stien '%{path}' findes allerede`,
      },
      i18n: {
        writingInLocale: 'Skriver på %{locale}',
        copyFromLocale: 'Kopier fra et andet sprog',
        copyFromLocaleConfirm:
          'Vil du indsætte data fra sproget %{locale}?\nAlt eksisterende indhold vil blive overskrevet.',
      },
    },
    editor: {
      onLeavePage: 'Er du sikker på at du vil forlade siden?',
      onUpdatingWithUnsavedChanges:
        'Du har ændringer der ikke er gemt, gem disse før status ændres.',
      onPublishingNotReady: 'Skift status til "Klar" inden publicering.',
      onPublishingWithUnsavedChanges: 'Du har ændringer der ikke er gemt, gem inden publicing.',
      onPublishing: 'Er du sikker på at du vil publicere dette dokument?',
      onUnpublishing: 'Er du sikker på at du vil afpublicere dette dokument?',
      onDeleteWithUnsavedChanges:
        'Er du sikker på at du vil slette dette tidliere publiceret dokument, samt dine nuværende ugemte ændringer fra denne session?',
      onDeletePublishedEntry:
        'Er du sikker på at du vil slette dette tidliere publiceret dokument?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Alle ikke publicerede ændringer til dette dokument vil blive slettet ligesom dine nuværende ugemte ændringer fra denne session. Er du sikker på at du vil slette?',
      onDeleteUnpublishedChanges:
        'Alle ikke publicerede ændringer til dette dokument vil blive slettet. Er du sikker på at du vil slette?',
      loadingEntry: 'Indlæser dokument...',
      confirmLoadBackup:
        'En lokal sikkerhedskopi blev gendannet for dette dokument, vil du anvende denne?',
    },

    editorToolbar: {
      publishing: 'Publicerer...',
      publish: 'Publicer',
      published: 'Publiceret',
      unpublish: 'Afpublicer',
      duplicate: 'Kopier',
      unpublishing: 'Afpublicerer...',
      publishAndCreateNew: 'Publicer og opret ny',
      publishAndDuplicate: 'Publicer og kopier',
      deleteUnpublishedChanges: 'Slet upublicerede ændringer',
      deleteUnpublishedEntry: 'Slet upubliceret dokument',
      deletePublishedEntry: 'Slet publiceret dokument',
      deleteEntry: 'Slet dokument',
      saving: 'Gemmer...',
      save: 'Gem',
      statusInfoTooltipDraft:
        'Status for elementet er kladde. For at afslutte og sende til gennemsyn, skift status til ‘Til gennemsyn’',
      statusInfoTooltipInReview:
        'Elementet er til gennemsyn, det er ikke nødvendigt med yderligere handlinger. Du kan dog stadig lave yderligere ændringer mens det er til gennemsyn.',
      deleting: 'Sletter...',
      updating: 'Opdaterer...',
      status: 'Status: %{status}',
      backCollection: ' Skriver til %{collectionLabel} samlingen',
      unsavedChanges: 'Ugemte ændringer',
      changesSaved: 'Ændringer gemt',
      draft: 'Kladder',
      inReview: 'Til gennemsyn',
      ready: 'Klar',
      publishNow: 'Publicer nu',
      deployPreviewPendingButtonLabel: 'Lav preview',
      deployPreviewButtonLabel: 'Vis preview',
      deployButtonLabel: 'Vis live',
    },
    editorWidgets: {
      markdown: {
        bold: 'Fed',
        italic: 'Kursiv',
        code: 'Kode',
        link: 'Link',
        linkPrompt: 'Indtast URL for link',
        headings: 'Overskrifter',
        quote: 'Citat',
        bulletedList: 'Punktopstilling',
        numberedList: 'Nummeret liste',
        addComponent: 'Tilføj komponent',
        richText: 'Formatteret tekst',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Vælg et billede',
        chooseMultiple: 'Vælg billeder',
        chooseUrl: 'Indsæt fra URL',
        replaceUrl: 'Erstat med URL',
        promptUrl: 'Indtast URL for billeder',
        chooseDifferent: 'Vælg et andet billede',
        addMore: 'Tilføj flere billeder',
        remove: 'Fjern billede',
        removeAll: 'Fjern alle billeder',
      },
      file: {
        choose: 'Vælg fil',
        chooseUrl: 'Indsæt fra URL',
        chooseMultiple: 'Vælg filer',
        replaceUrl: 'Erstat med URL',
        promptUrl: 'Indtast URL for filen',
        chooseDifferent: 'Vælg en anden fil',
        addMore: 'Tilføj flere filer',
        remove: 'Fjern fil',
        removeAll: 'Fjern alle filer',
      },
      unknownControl: {
        noControl: "Ingen kontrol for '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Ingen preview for '%{widget}'.",
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
        now: 'Nu',
        clear: 'Ryd',
      },
      list: {
        add: 'Tilføj %{item}',
        addType: 'Tilføj %{item}',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Kladde',
      copy: 'Kopier',
      copyUrl: 'Kopier URL',
      copyPath: 'Kopier sti',
      copyName: 'Kopier navn',
      copied: 'Kopieret',
    },
    mediaLibrary: {
      onDelete: 'Er du sikker på at du vil slette det valgte medie?',
      fileTooLarge: 'Filen er for stor.\nOpsætningen tillader ikke filer større end %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Indlæser...',
      noResults: 'Ingen resultater.',
      noAssetsFound: 'Ingen elementer fundet.',
      noImagesFound: 'Ingen billeder fundet.',
      private: 'Privat ',
      images: 'Billeder',
      mediaAssets: 'Medie elementer',
      search: 'Søg...',
      uploading: 'Uploader...',
      upload: 'Upload',
      download: 'Download',
      deleting: 'Slet...',
      deleteSelected: 'Slet valgte',
      chooseSelected: 'Anvend valgte',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Tilbage til hjemmesiden',
    },
    errorBoundary: {
      title: 'Fejl',
      details: 'Der opstod en fejl - venligst ',
      reportIt: 'opret et issue på GitHub.',
      detailsHeading: 'Detalger',
      privacyWarning:
        'Ved at oprette et issue forudfyldes det med fejlbeskeden og data til debugging.\nKontroller venligst at informationerne er korrekte og fjern eventuelle følsomme data.',
      recoveredEntry: {
        heading: 'Gendannet dokument',
        warning: 'Kopier dette et sted hen inden du navigerer væk!',
        copyButtonLabel: 'Kopier til udklipsholder',
      },
    },
    settingsDropdown: {
      logOut: 'Log af',
    },
    toast: {
      onFailToLoadEntries: 'Fejl ved indlæsning af dokumenter: %{details}',
      onFailToLoadDeployPreview: 'Preview kunne ikke indlæses: %{details}',
      onFailToPersist: 'Dokumentet kunne ikke gemmes: %{details}',
      onFailToDelete: 'Dokumentet kunne ikke slettes: %{details}',
      onFailToUpdateStatus: 'Status kunne ikke opdateres: %{details}',
      missingRequiredField:
        'Ups, du mangler et påkrævet felt. Udfyld de påkrævede felter før dokumentet gemmes.',
      entrySaved: 'Dokumentet er gemt',
      entryPublished: 'Dokumentet er publiceret ',
      entryUnpublished: 'Dokumentet er afpubliceret',
      onFailToPublishEntry: 'Kunne ikke publicere på grund af en fejl: %{details}',
      onFailToUnpublishEntry: 'Kunne ikke afpublicere på grund af en fejl: %{details}',
      entryUpdated: 'Dokumentstatus er opdateret',
      onDeleteUnpublishedChanges: 'Upublicerede ændringer blev slettet',
      onFailToAuth: '%{details}',
      onLoggedOut: 'Du er blevet logget ind, gem venligst evt. ændringer og log på igen',
      onBackendDown:
        'Den bagvedliggende service er ikke tilgængelig i øjeblikket. Se %{details} for mere information',
    },
  },
  workflow: {
    workflow: {
      loading: 'Indlæser dokumenter i redaktionel arbejdsgang',
      workflowHeading: 'Redaktionel arbejdsgang',
      newPost: 'Nyt indlæg',
      description:
        '%{smart_count} dokumenter afventer gennemsyn, %{readyCount} er klar til live. |||| %{smart_count} dokumenter afventer gennemsyn, %{readyCount} klar til go live. ',
      dateFormat: 'D. MMMM',
    },
    workflowCard: {
      lastChange: '%{date} af %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'af %{author}',
      deleteChanges: 'Slet ændringer',
      deleteNewEntry: 'Slet nye dokumenter',
      publishChanges: 'Publicer ændringer',
      publishNewEntry: 'Publicer nye dokumenter',
    },
    workflowList: {
      onDeleteEntry: 'Er du sikker på at du vil slette dette dokument?',
      onPublishingNotReadyEntry:
        'Kun dokumenter med "Klar" status kan publiceres. Træk kortet til "Klar" kolonnen for at tillade publicering.',
      onPublishEntry: 'Er du sikker på at du vil publicere dokumentet?',
      draftHeader: 'Kladder',
      inReviewHeader: 'Til gennemsyn',
      readyHeader: 'Klar',
      currentEntries: '%{smart_count} dokument |||| %{smart_count} dokumenter',
    },
  },
};

export default da;
