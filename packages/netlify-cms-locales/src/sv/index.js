const sv = {
  auth: {
    login: 'Logga in',
    loggingIn: 'Loggar in...',
    loginWithNetlifyIdentity: 'Logga in med Netlify Identity',
    loginWithAzure: 'Logga in med Azure',
    loginWithBitbucket: 'Logga in med Bitbucket',
    loginWithGitHub: 'Logga in med GitHub',
    loginWithGitLab: 'Logga in med GitLab',
    errors: {
      email: 'Fyll i din epostadress.',
      password: 'Vänligen skriv ditt lösenord.',
      identitySettings:
        'Kan inte hämta inställningar för Identity. Vid användade av git-gateway backend, kontrollera att Identity service och Git Gateway är aktiverade.',
    },
  },
  app: {
    header: {
      content: 'Innehåll',
      workflow: 'Arbetsflöde',
      media: 'Media',
      quickAdd: 'Snabbt tillägg',
    },
    app: {
      errorHeader: 'Ett fel uppstod vid hämtning av CMS-konfigurationen',
      configErrors: 'Konfigurationsfel',
      checkConfigYml: 'Kontrollera din config.yml-fil.',
      loadingConfig: 'Hämtar konfiguration...',
      waitingBackend: 'Väntar på backend...',
    },
    notFoundPage: {
      header: 'Sidan finns inte',
    },
  },
  collection: {
    sidebar: {
      collections: 'Samlingar',
      allCollections: 'Alla Samlingar',
      searchAll: 'Sök',
      searchIn: 'Sök i',
    },
    collectionTop: {
      sortBy: 'Sortera efter',
      viewAs: 'Visa som',
      newButton: 'Ny %{collectionLabel}',
      ascending: 'Stigande',
      descending: 'Fallande',
      searchResults: 'Sökresultat för "%{searchTerm}"',
      searchResultsInCollection: 'Sökresultat för "%{searchTerm}" i %{collection}',
      filterBy: 'Filtrera efter',
      groupBy: 'Gruppera efter',
    },
    entries: {
      loadingEntries: 'Hämtar inlägg...',
      cachingEntries: 'Sparar inlägg i cache...',
      longerLoading: 'Det här kan ta några minuter',
      noEntries: 'Inga inlägg',
    },
    groups: {
      other: 'Annat',
      negateLabel: 'Inte %{label}',
    },
    defaultFields: {
      author: {
        label: 'Författare',
      },
      updatedOn: {
        label: 'Uppdaterad vid',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'frivillig',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} är obligatoriskt.',
        regexPattern: '%{fieldLabel} matchar inte mönstret: %{pattern}.',
        processing: '%{fieldLabel} bearbetas.',
        range: '%{fieldLabel} måste vara mellan %{minValue} och %{maxValue}.',
        min: '%{fieldLabel} måste vara åtminstone %{minValue}.',
        max: '%{fieldLabel} måste vara %{maxValue} eller mindre.',
        rangeCount: '%{fieldLabel} måste ha mellan %{minCount} och %{maxCount} element.',
        rangeCountExact: '%{fieldLabel} måste ha exakt %{count} element.',
        rangeMin: '%{fieldLabel} måste ha åtminstone %{minCount} element.',
        rangeMax: '%{fieldLabel} måste ha %{maxCount} eller färre element.',
        invalidPath: `'%{path}' är inte en giltig sökväg`,
        pathExists: `Sökvägen '%{path}' existerar redan`,
      },
      i18n: {
        writingInLocale: 'Skriver i %{locale}',
      },
    },
    editor: {
      onLeavePage: 'Är du säker på att du vill lämna sidan?',
      onUpdatingWithUnsavedChanges:
        'Du har osparade ändringar, vänligen spara dem innan du uppdaterar status.',
      onPublishingNotReady: 'Vänligen uppdatera status till "Redo" innan du publicerar.',
      onPublishingWithUnsavedChanges:
        'Du har osparade ändringar, vänligen spara innan du publicerar.',
      onPublishing: 'Är du säker på att du vill publicera det här inlägget?',
      onUnpublishing: 'Är du säker på att du vill avpublicera det här inlägget?',
      onDeleteWithUnsavedChanges:
        'Är du säker på att du vill radera det här publicerade inlägget, inklusive dina osparade ändringar från nuvarande session?',
      onDeletePublishedEntry: 'Är du säker på att du vill radera det här publicerade inlägget?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Du är på väg att radera alla opublicerade ändringar för det här inlägget, inklusive dina osparade ändringar från nuvarande session. Vill du fortfarande radera?',
      onDeleteUnpublishedChanges:
        'Alla opublicerade ändringar kommer raderas. Vill du fortfarande radera?',
      loadingEntry: 'Hämtar inlägg...',
      confirmLoadBackup: 'En lokal kopia hittades för det här inlägget, vill du använda den?',
    },
    editorInterface: {
      toggleI18n: 'Slå på/av i18n',
      togglePreview: 'Visa/Dölj förhandsvisning',
      toggleScrollSync: 'Synka scrollning',
    },
    editorToolbar: {
      publishing: 'Publicerar...',
      publish: 'Publicera',
      published: 'Publicerad',
      unpublish: 'Avpublicera',
      duplicate: 'Duplicera',
      unpublishing: 'Avpublicerar...',
      publishAndCreateNew: 'Publicera och skapa ny',
      publishAndDuplicate: 'Publicera och duplicera',
      deleteUnpublishedChanges: 'Radera opublicerade ändringar',
      deleteUnpublishedEntry: 'Radera opublicerat inlägg',
      deletePublishedEntry: 'Radera publicerat inlägg',
      deleteEntry: 'Radera inlägg',
      saving: 'Sparar...',
      save: 'Spara',
      deleting: 'Raderar...',
      updating: 'Updaterar...',
      setStatus: 'Sätt status',
      backCollection: ' Redigerar i samlingen %{collectionLabel}',
      unsavedChanges: 'Osparade ändringar',
      changesSaved: 'Ändringar sparade',
      draft: 'Utkast',
      inReview: 'Under granskning',
      ready: 'Redo',
      publishNow: 'Publicera nu',
      deployPreviewPendingButtonLabel: 'Kontrollera förhandsvisning',
      deployPreviewButtonLabel: 'Visa förhandsvisning',
      deployButtonLabel: 'Visa Live',
    },
    editorWidgets: {
      markdown: {
        bold: 'Fetstil',
        italic: 'Kursiv',
        code: 'Kod',
        link: 'Länk',
        linkPrompt: 'Ange en URL för länken',
        headings: 'Rubriker',
        quote: 'Citat',
        bulletedList: 'Punktlista',
        numberedList: 'Numrerad lista',
        addComponent: 'Lägg till komponent',
        richText: 'Rich Text',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Välj en bild',
        chooseUrl: 'Infoga från URL',
        replaceUrl: 'Ersätt med URL',
        promptUrl: 'Ange en URL för bilden',
        chooseDifferent: 'Välj en annan bild',
        remove: 'Ta bort bild',
      },
      file: {
        choose: 'Välj en fil',
        chooseUrl: 'Infoga från URL',
        replaceUrl: 'Ersätt med URL',
        promptUrl: 'Ange en URL för filen',
        chooseDifferent: 'Välj en annan fil',
        remove: 'Ta bort fil',
      },
      unknownControl: {
        noControl: "Inget reglage för widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Ingen förhandsvisning för widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Rubrik 1',
        headingTwo: 'Rubrik 2',
        headingThree: 'Rubrik 3',
        headingFour: 'Rubrik 4',
        headingFive: 'Rubrik 5',
        headingSix: 'Rubrik 6',
      },
      datetime: {
        now: 'Nu',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Utkast',
      copy: 'Kopiera',
      copyUrl: 'Kopiera URL',
      copyPath: 'Kopiera Sökväg',
      copyName: 'Kopiera Namn',
      copied: 'Kopierad',
    },
    mediaLibrary: {
      onDelete: 'Är du säker på att du vill radera valt mediaobjekt?',
      fileTooLarge:
        'Maximal filstorlek överskriden.\nKonfigurerad att inte tillåta filer större än %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Hämtar...',
      noResults: 'Inga resultat.',
      noAssetsFound: 'Hittade inga mediaobjekt.',
      noImagesFound: 'Hittade inga bilder.',
      private: 'Privat ',
      images: 'Bilder',
      mediaAssets: 'Mediaobjekt',
      search: 'Sök...',
      uploading: 'Laddar upp...',
      upload: 'Ladda upp',
      download: 'Ladda ner',
      deleting: 'Raderar...',
      deleteSelected: 'Radera markerad',
      chooseSelected: 'Välj markerad',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Tillbaka till sida',
    },
    errorBoundary: {
      title: 'Fel',
      details: 'Ett fel har uppstått - vänligen ',
      reportIt: 'öppna ett ärende på GitHub.',
      detailsHeading: 'Detaljer',
      privacyWarning:
        'När ett ärende öppnas bifogas felsökningsdata automatiskt.\nVänligen kontrollera att informationen är korrekt och ta bort känslig data om det skulle finnas sådan.',
      recoveredEntry: {
        heading: 'Återskapade dokument',
        warning: 'Vänligen kopiera materialet någon annanstans innan du navigerar från sidan!',
        copyButtonLabel: 'Kopiera till urklipp',
      },
    },
    settingsDropdown: {
      logOut: 'Logga ut',
    },
    toast: {
      onFailToLoadEntries: 'Kunde inte hämta inlägg: %{details}',
      onFailToLoadDeployPreview: 'Kunde inte ladda förhandsvisning: %{details}',
      onFailToPersist: 'Kunde inte spara inlägg: %{details}',
      onFailToDelete: 'Kunde inte radera inlägg: %{details}',
      onFailToUpdateStatus: 'Kunde inte uppdatera status: %{details}',
      missingRequiredField:
        'Oops, du har missat ett obligatoriskt fält. Vänligen fyll i det innan du sparar.',
      entrySaved: 'Inlägg sparat',
      entryPublished: 'Inlägg publicerat',
      entryUnpublished: 'Inlägg avpublicerat',
      onFailToPublishEntry: 'Kunde inte publicera: %{details}',
      onFailToUnpublishEntry: 'Kunde inte avpublicera inlägg: %{details}',
      entryUpdated: 'Inläggsstatus uppdaterad',
      onDeleteUnpublishedChanges: 'Opublicerade ändringar raderade',
      onFailToAuth: '%{details}',
      onLoggedOut:
        'Du har blivit utloggad, vänligen spara en kopia av eventuella ändringar och logga in på nytt',
      onBackendDown: 'Tjänsten är drabbad av en störning. Se %{details} för mer information',
    },
  },
  workflow: {
    workflow: {
      loading: 'Hämtar inlägg för redaktionellt arbetsflöde',
      workflowHeading: 'Redaktionellt arbetsflöde',
      newPost: 'Nytt inlägg',
      description:
        '%{smart_count} inlägg väntar på granskning, %{readyCount} redo att publiceras. |||| %{smart_count} inlägg väntar på granskning, %{readyCount} redo att publiceras. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} av %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'av %{author}',
      deleteChanges: 'Radera ändringar',
      deleteNewEntry: 'Radera nytt inlägg',
      publishChanges: 'Publicera ändringar',
      publishNewEntry: 'Publicera nytt inlägg',
    },
    workflowList: {
      onDeleteEntry: 'Är du säker på att du vill radera det här inlägget?',
      onPublishingNotReadyEntry:
        'Bara inlägg med statusen "Redo" kan publiceras. Vänligen dra kortet till "Redo"-kolumnen för att möjliggöra publicering',
      onPublishEntry: 'Är du säker på att du vill publicera det här inlägget?',
      draftHeader: 'Utkast',
      inReviewHeader: 'Under granskning',
      readyHeader: 'Redo',
      currentEntries: '%{smart_count} inlägg |||| %{smart_count} inlägg',
    },
  },
};

export default sv;
