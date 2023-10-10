"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const nn_no = {
  auth: {
    login: 'Logg inn',
    loggingIn: 'Loggar inn..',
    loginWithNetlifyIdentity: 'Logg på med Netlify Identity',
    loginWithBitbucket: 'Logg på med Bitbucket',
    loginWithGitHub: 'Logg på med GitHub',
    loginWithGitLab: 'Logg på med GitLab',
    errors: {
      email: 'Du må skriva inn e-posten din.',
      password: 'Du må skriva inn passordet ditt.',
      identitySettings: 'Fann ingen innstillingar for Identity. Om du ynskjer å nytte git-gateway må du hugse å skru på Identity service og Git Gateway'
    }
  },
  app: {
    header: {
      content: 'Innhald',
      workflow: 'Arbeidsflyt',
      media: 'Media',
      quickAdd: 'Hurtiginnlegg'
    },
    app: {
      errorHeader: 'Noko gjekk gale under lastinga av CMS konfigurasjonen',
      configErrors: 'Konfigurasjonsfeil',
      checkConfigYml: 'Sjå over config.yml fila.',
      loadingConfig: 'Lastar konfigurasjon...',
      waitingBackend: 'Ventar på backend...'
    },
    notFoundPage: {
      header: 'Ikkje funnen'
    }
  },
  collection: {
    sidebar: {
      collections: 'Samlingar',
      searchAll: 'Søk i alle'
    },
    collectionTop: {
      sortBy: 'Sorter etter',
      viewAs: 'Vis som',
      newButton: 'Ny %{collectionLabel}',
      ascending: 'Stigande',
      descending: 'Synkande'
    },
    entries: {
      loadingEntries: 'Laster innlegg...',
      cachingEntries: 'Mellomlagrar innlegg...',
      longerLoading: 'Dette kan ta fleire minutt',
      noEntries: 'Ingen innlegg'
    },
    defaultFields: {
      author: {
        label: 'Forfatter'
      },
      updatedOn: {
        label: 'Oppdatert'
      }
    }
  },
  editor: {
    editorControl: {
      field: {
        optional: 'valfritt'
      }
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} krevast.',
        regexPattern: '%{fieldLabel} samsvarar ikkje med mønsteret: %{pattern}.',
        processing: '%{fieldLabel} vart prosessert.',
        range: '%{fieldLabel} må vera mellom %{minValue} og %{maxValue}.',
        min: '%{fieldLabel} må minst vera %{minValue}.',
        max: '%{fieldLabel} må vera %{maxValue} eller mindre.',
        rangeCount: '%{fieldLabel} må ha mellom %{minCount} og %{maxCount} element.',
        rangeCountExact: '%{fieldLabel} må ha nøyaktig %{count} element.',
        rangeMin: '%{fieldLabel} må minst ha %{minCount} element.',
        rangeMax: '%{fieldLabel} må ha %{maxCount} eller færre element.'
      }
    },
    editor: {
      onLeavePage: 'Er du sikker på at du vil navigere bort frå denne sida?',
      onUpdatingWithUnsavedChanges: 'Du må lagra endringane dine før du endrar status',
      onPublishingNotReady: 'Du må endre status til "Klar" før du publiserer',
      onPublishingWithUnsavedChanges: 'Du må laga endringane dine før du kan publisere.',
      onPublishing: 'Er du sikker på at vil publisere?',
      onUnpublishing: 'Er du sikker på at du vil avpublisere innlegget?',
      onDeleteWithUnsavedChanges: 'Er du sikkert på at du vil slette eit publisert innlegg med tilhøyrande ulagra endringar?',
      onDeletePublishedEntry: 'Er du sikker på at du vil slette dette publiserte innlegget?',
      onDeleteUnpublishedChangesWithUnsavedChanges: 'Handlinga slettar endringar som ikkje er publisert eller lagra. Vil du halde fram?',
      onDeleteUnpublishedChanges: 'Alle endringar som ikkje er publisert vil gå tapt. Vil du halde fram?',
      loadingEntry: 'Lastar innlegg...',
      confirmLoadBackup: 'Ynskjer du å gjennopprette tidlegare endringar som ikkje har verta lagra?'
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
      deleteUnpublishedChanges: 'Slett upubliserte endringar',
      deleteUnpublishedEntry: 'Slett upublisert innlegg',
      deletePublishedEntry: 'Slett publisert innlegg',
      deleteEntry: 'Slettar innlegg',
      saving: 'Lagrar...',
      save: 'Lagre',
      deleting: 'Slettar...',
      updating: 'Oppdaterer...',
      status: 'Status: %{status}',
      backCollection: ' Skriv i samlinga %{collectionLabel}',
      unsavedChanges: 'Ulagra endringar',
      changesSaved: 'Endringar lagret',
      draft: 'Kladd',
      inReview: 'Til godkjenning',
      ready: 'Klar',
      publishNow: 'Publiser no',
      deployPreviewPendingButtonLabel: 'Kontroller førehandsvisning',
      deployPreviewButtonLabel: 'Sjå førehandsvisning',
      deployButtonLabel: 'Sjå i produksjon'
    },
    editorWidgets: {
      markdown: {
        richText: 'Rik-tekst',
        markdown: 'Markdown'
      },
      image: {
        choose: 'Vel bilete',
        chooseDifferent: 'Vel eit anna bilete',
        remove: 'Fjern bilete'
      },
      file: {
        choose: 'Vel fil',
        chooseDifferent: 'Vel ei anna fil',
        remove: 'Fjern fil'
      },
      unknownControl: {
        noControl: "Ingen konfigurasjon for widget '%{widget}'."
      },
      unknownPreview: {
        noPreview: "Ingen førehandsvisning tilgjengeleg for '%{widget}'."
      },
      headingOptions: {
        headingOne: 'Overskrift 1',
        headingTwo: 'Overskrift 2',
        headingThree: 'Overskrift 3',
        headingFour: 'Overskrift 4',
        headingFive: 'Overskrift 5',
        headingSix: 'Overskrift 6'
      },
      datetime: {
        now: 'No'
      }
    }
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Kladd'
    },
    mediaLibrary: {
      onDelete: 'Er du sikker på at du vil slette markert element?',
      fileTooLarge: 'Fila er for stor.\nMaksimal konfiguert filstorleik er %{size} kB.'
    },
    mediaLibraryModal: {
      loading: 'Lastar...',
      noResults: 'Ingen resultat.',
      noAssetsFound: 'Ingen elementer funne.',
      noImagesFound: 'Ingen bilete funne.',
      private: 'Privat ',
      images: 'Bileter',
      mediaAssets: 'Mediebibliotek',
      search: 'Søk...',
      uploading: 'Lastar opp...',
      upload: 'Last opp',
      download: 'Last ned',
      deleting: 'Slettar...',
      deleteSelected: 'Slett markert',
      chooseSelected: 'Vel markert'
    }
  },
  ui: {
    default: {
      goBackToSite: 'Attende til sida'
    },
    errorBoundary: {
      title: 'Feil',
      details: 'Ein feil har oppstått. Det er fint om du ',
      reportIt: 'opnar eit issue på GitHub.',
      detailsHeading: 'Detaljer',
      privacyWarning: 'Når du opnar eit issue vart feil og feilsøkingsdata automatisk fylt ut. Hugs å sjå over at alt ser greitt ut, og ikkje inneheld sensitive data.',
      recoveredEntry: {
        heading: 'Gjenopprettet dokument',
        warning: 'Det kan vere lurt å ta kopi av innhaldet før du navigerer bort frå denne sida!',
        copyButtonLabel: 'Kopier til utklippstavle'
      }
    },
    settingsDropdown: {
      logOut: 'Logg ut'
    },
    toast: {
      onFailToLoadEntries: 'Kunne ikkje laste innlegg: %{details}',
      onFailToLoadDeployPreview: 'Kunne ikkje laste førehandsvisning: %{details}',
      onFailToPersist: 'Kunne ikkje lagre: %{details}',
      onFailToDelete: 'Kunne ikkje slette: %{details}',
      onFailToUpdateStatus: 'Kunne ikkje laste opp: %{details}',
      missingRequiredField: 'Oisann, gløymte du noko? Alle påkrevde felt må fyllast ut før du kan halde fram',
      entrySaved: 'Innlegg lagra',
      entryPublished: 'Innlegg publisert',
      entryUnpublished: 'Innlegg avpublisert',
      onFailToPublishEntry: 'Kunne ikkje publisere: %{details}',
      onFailToUnpublishEntry: 'Kunne ikkje avpublisere: %{details}',
      entryUpdated: 'Innleggsstatus oppdatert',
      onDeleteUnpublishedChanges: 'Avpubliserte endringar sletta',
      onFailToAuth: '%{details}'
    }
  },
  workflow: {
    workflow: {
      loading: 'Lastar innlegg for redaksjonell arbeidsflyt',
      workflowHeading: 'Redaksjonell arbeidsflyt',
      newPost: 'Nytt innlegg',
      description: '%{smart_count} innlegg treng gjennomgong, og %{readyCount} er klar til publisering. |||| %{smart_count} innlegg treng gjennomgong, og %{readyCount} er klar til publisering ',
      dateFormat: 'MMMM D'
    },
    workflowCard: {
      lastChange: '%{date} av %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'av %{author}',
      deleteChanges: 'Slett endringar',
      deleteNewEntry: 'Slett nytt innlegg',
      publishChanges: 'Publiser endringar',
      publishNewEntry: 'Publiser nytt innlegg'
    },
    workflowList: {
      onDeleteEntry: 'Er du sikker på du vil slette innlegget?',
      onPublishingNotReadyEntry: 'Du kan berre publisere innlegg i "Klar" kolonna. Dra kortet til riktig stad for å halde fram.',
      onPublishEntry: 'Er du sikker på du vil publisere innlegget?',
      draftHeader: 'Kladd',
      inReviewHeader: 'Gjennomgås',
      readyHeader: 'Klar',
      currentEntries: '%{smart_count} innlegg |||| %{smart_count} innlegg'
    }
  }
};
var _default = nn_no;
exports.default = _default;