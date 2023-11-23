const hr = {
  auth: {
    login: 'Prijava',
    loggingIn: 'Prijava u tijeku...',
    loginWithNetlifyIdentity: 'Prijava sa Netlify računom',
    loginWithAzure: 'Prijava za Azure računom',
    loginWithBitbucket: 'Prijava sa Bitbucket računom',
    loginWithGitHub: 'Prijava sa GitHub računom',
    loginWithGitLab: 'Prijava sa GitLab računom',
    loginWithGitea: 'Prijava sa Gitea računom',
    errors: {
      email: 'Unesite email.',
      password: 'Molimo unisite lozinku.',
      identitySettings:
        'Nemoguće pristupiti postavkama identita. Kod korištenja git-gateway backenda morate uključiti "Identity service" te "Git Gateway"',
    },
  },
  app: {
    header: {
      content: 'Sadržaj',
      workflow: 'Tijek rada',
      media: 'Mediji',
      quickAdd: 'Dodaj',
    },
    app: {
      errorHeader: 'Greška pri učitavanju CMS konfiguracije',
      configErrors: 'Greška u konfiguraciji',
      checkConfigYml: 'Provjeri config.yml datoteku.',
      loadingConfig: 'Učitavanje konfiguracije...',
      waitingBackend: 'Čekanje na backend...',
    },
    notFoundPage: {
      header: 'Stranica nije pronađena',
    },
  },
  collection: {
    sidebar: {
      collections: 'Zbirke',
      allCollections: 'Sve zbirke',
      searchAll: 'Pretraži sve',
      searchIn: 'Pretraži u',
    },
    collectionTop: {
      sortBy: 'Sortiraj',
      viewAs: 'Pogledaj kao',
      newButton: 'Nova %{collectionLabel}',
      ascending: 'Uzlazno',
      descending: 'Silzano',
      searchResults: 'Rezulatati pretraživanja za "%{searchTerm}"',
      searchResultsInCollection: 'Rezulatati pretraživanja za "%{searchTerm}" u %{collection}',
      filterBy: 'Filtriraj po',
      groupBy: 'Grupiraj po',
    },
    entries: {
      loadingEntries: 'Učitavanje unosa...',
      cachingEntries: 'Predmemoriranje unosa...',
      longerLoading: 'Ovo bi moglo potrajati par minuta',
      noEntries: 'Nema unosa',
    },
    groups: {
      other: 'Ostalo',
      negateLabel: 'Nije %{label}',
    },
    defaultFields: {
      author: {
        label: 'Autor',
      },
      updatedOn: {
        label: 'Ažurirano na',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'opcionalno',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} je obvezan.',
        regexPattern: '%{fieldLabel} se ne podudara sa uzorkom: %{pattern}.',
        processing: '%{fieldLabel} se procesira.',
        range: '%{fieldLabel} mora biti između %{minValue} i %{maxValue}.',
        min: '%{fieldLabel} mora biti najmanje %{minValue}.',
        max: '%{fieldLabel} mora biti %{maxValue} ili manje.',
        rangeCount: '%{fieldLabel} mora imati između %{minCount} i %{maxCount} predmeta.',
        rangeCountExact: '%{fieldLabel} mora imati točno %{count} predmeta.',
        rangeMin: '%{fieldLabel} mora imati najmanje %{minCount} predmet(a).',
        rangeMax: '%{fieldLabel} mora imate %{maxCount} ili manje predmeta.',
        invalidPath: `'%{path}' nije valjana putanja`,
        pathExists: `Putanja '%{path}' već postoji`,
      },
      i18n: {
        writingInLocale: 'Pisanje na %{locale}',
      },
    },
    editor: {
      onLeavePage: 'Jeste li sigurni da želite napustiti stranicu?',
      onUpdatingWithUnsavedChanges:
        'Imate nespremljene promjene, molimo spremite prije ažuriranja statusa.',
      onPublishingNotReady: 'Molimo ažurirajte status na "Spremno" prije objavljivanja.',
      onPublishingWithUnsavedChanges:
        'Imate nespremljene promjene, molimo spremite prije objavljivanja.',
      onPublishing: 'Jeste li sigurni da želite objaviti ovaj unos?',
      onUnpublishing: 'Jeste li sigurni da želite maknuti objavu za ovaj unos?',
      onDeleteWithUnsavedChanges:
        'Jeste li sigurni da želite obrisati objavljeni unos, te nespremljene promjene u trenutnoj sesiji?',
      onDeletePublishedEntry: 'Jeste li sigurni da želite obrisati ovaj objavljeni unos?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Obrisat ćete sve neobjavljene promjene na ovom unosu, te sve nespremljene promjene u trenutnoj sesiji. Želite li i dalje obrisati?',
      onDeleteUnpublishedChanges:
        'Sve nespremljene promjene na ovom unosu će biti obrisane. Želite li i dalje obrisati?',
      loadingEntry: 'Učitavanje unosa...',
      confirmLoadBackup: 'Lokalna kopija je dohvaćena za ovaj unos, želite li ju koristiti?',
    },
    editorToolbar: {
      publishing: 'Objavljivanje...',
      publish: 'Objavi',
      published: 'Objavljeno',
      unpublish: 'Obriši iz objava',
      duplicate: 'Dupliciraj',
      unpublishing: 'Brisanje iz objava...',
      publishAndCreateNew: 'Objavi i kreiraj novo',
      publishAndDuplicate: 'Objavi i dupliciraj',
      deleteUnpublishedChanges: 'Obriši neobjavljene promjene',
      deleteUnpublishedEntry: 'Obriši neobjavljene unose',
      deletePublishedEntry: 'Obriši objavljeni unos',
      deleteEntry: 'Obriši unos',
      saving: 'Spremanje...',
      save: 'Spremi',
      deleting: 'Brisanje...',
      updating: 'Ažuriranje...',
      status: 'Status: %{status}',
      backCollection: 'Pisanje u %{collectionLabel} zbirci',
      unsavedChanges: 'Nespremljene promjene',
      changesSaved: 'Promjene spremljene',
      draft: 'Skica',
      inReview: 'Osvrt',
      ready: 'Spremno',
      publishNow: 'Objavi sad',
      deployPreviewPendingButtonLabel: 'Provjeri za osvrt',
      deployPreviewButtonLabel: 'Pogledaj osvrt',
      deployButtonLabel: 'Pogledaj na produkciji',
    },
    editorWidgets: {
      markdown: {
        bold: 'Podebljano',
        italic: 'Kurziv',
        code: 'Kod',
        link: 'Link',
        linkPrompt: 'Unesi URL linka',
        headings: 'Naslovi',
        quote: 'Citat',
        bulletedList: 'Nabrajan popis',
        numberedList: 'Numeriran popis',
        addComponent: 'Dodaj komponentu',
        richText: 'Bogati tekst',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Odaberi sliku',
        chooseDifferent: 'Odaberi drugu sliku',
        remove: 'Izbriši sliku',
      },
      file: {
        choose: 'Odaberi datoteku',
        chooseDifferent: 'Odaberi drugu datoteku',
        remove: 'Obriši datoteku',
      },
      unknownControl: {
        noControl: "Kontrola nije pronađena za widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Prikaz nije pronađen za widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Naslov 1',
        headingTwo: 'Naslov 2',
        headingThree: 'Naslov 3',
        headingFour: 'Naslov 4',
        headingFive: 'Naslov 5',
        headingSix: 'Naslov 6',
      },
      datetime: {
        now: 'Sad',
        clear: 'Očisti',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Skica',
    },
    mediaLibrary: {
      onDelete: 'Jeste li sigurni da želite obrisati odabrane medijske datoteke?',
      fileTooLarge:
        'Datoteka prevelika.\nKonfigurirano da ne podržava datoteke veće od %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Učitavanje...',
      noResults: 'Nema rezultata.',
      noAssetsFound: 'Sredstva nisu pronađena.',
      noImagesFound: 'Slike nisu pronađene.',
      private: 'Privatno ',
      images: 'Slike',
      mediaAssets: 'Medijska sredstva',
      search: 'Pretraži...',
      uploading: 'Učitavanje...',
      upload: 'Učitaj',
      download: 'Preuzmi',
      deleting: 'Brisanje...',
      deleteSelected: 'Obriši označeno',
      chooseSelected: 'Odaberi označeno',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Povratak na stranicu',
    },
    errorBoundary: {
      title: 'Greška',
      details: 'Dogodila se greška - molimo ',
      reportIt: 'otvori issue (problem) na GitHubu.',
      detailsHeading: 'Detalji',
      privacyWarning:
        'Otvaranje issue-a (problema) populira ga sa porukom od greške i debug podacima.\nProvjerite jesu li infomacije točne i obrišite osjetljive podatke ako postoje.',
      recoveredEntry: {
        heading: 'Obnovljen dokument',
        warning: 'Molimo kopiraj/zalijepi ovo negdje prije odlaska dalje!',
        copyButtonLabel: 'Kopiraj u međuspremnik',
      },
    },
    settingsDropdown: {
      logOut: 'Odjava',
    },
    toast: {
      onFailToLoadEntries: 'Neuspjelo dohvaćanje unosa: %{details}',
      onFailToLoadDeployPreview: 'Neuspjelo dohvaćanje pregleda: %{details}',
      onFailToPersist: 'Neuspjelo spremanje unosa: %{details}',
      onFailToDelete: 'Neuspjelo brisanje unosa: %{details}',
      onFailToUpdateStatus: 'Neuspjelo ažuriranje statusa: %{details}',
      missingRequiredField: 'Uups, preskočili ste obvezno polje. Molimo popunite prije spremanja.',
      entrySaved: 'Unos spremljen',
      entryPublished: 'Unos objavljen',
      entryUnpublished: 'Unos obrisan',
      onFailToPublishEntry: 'Neuspjelo objavljivanje unosa: %{details}',
      onFailToUnpublishEntry: 'Neuspjelo brisanje unosa: %{details}',
      entryUpdated: 'Status unosa ažuriran',
      onDeleteUnpublishedChanges: 'Otkrivene neobjavljene objave',
      onFailToAuth: '%{details}',
      onLoggedOut: 'Odjavljeni ste, molimo spremite sve podatke i prijavite se ponovno',
      onBackendDown: 'Backend servis ima prekid rada. Pogledaj %{details} za više informacija',
    },
  },
  workflow: {
    workflow: {
      loading: 'Učitavanje unosa uredničkog tijeka rada',
      workflowHeading: 'Urednički tijek rada',
      newPost: 'Nova objava',
      description:
        '%{smart_count} unos čeka pregled, %{readyCount} unos spreman za produkciju. |||| %{smart_count} unosa čeka pregled, %{readyCount} unosa spremno za produkciju. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} od strane %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'od strane %{author}',
      deleteChanges: 'Obriši promjene',
      deleteNewEntry: 'Obriši novi unos',
      publishChanges: 'Objavi promjene',
      publishNewEntry: 'Objavi novi unos',
    },
    workflowList: {
      onDeleteEntry: 'Jeste li sigurni da želite obrisati unos?',
      onPublishingNotReadyEntry:
        'Samo promjene sa statusom "Spremno" mogu biti objavljene. Molimo povucite karticu u kolumnu "Spremno" prije objavljivanja.',
      onPublishEntry: 'Jeste li sigurni da želite objaviti unos?',
      draftHeader: 'Skice',
      inReviewHeader: 'U osvrtu',
      readyHeader: 'Spremno',
      currentEntries: '%{smart_count} unos |||| %{smart_count} unosa',
    },
  },
};

export default hr;
