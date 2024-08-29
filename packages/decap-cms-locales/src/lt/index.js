const lt = {
  auth: {
    login: 'Prisijungti',
    loggingIn: 'Prisijungiama...',
    loginWithNetlifyIdentity: 'Prisijungti su Netlify Identity',
    loginWithAzure: 'Prisijungti su Azure',
    loginWithBitbucket: 'Prisijungti su Bitbucket',
    loginWithGitHub: 'Prisijungti su GitHub',
    loginWithGitLab: 'Prisijungti su GitLab',
    loginWithGitea: 'Prisijungti su Gitea',
    errors: {
      email: 'Įveskite savo elektroninį paštą.',
      password: 'Įveskite savo slaptažodį.',
      identitySettings:
        'Deja, nepavyksta pasiekti Identity paslaugos nustatymus. Kai naudojate git-gateway backend metodą, įjunkite „Identity service“ ir „Git Gateway“.',
    },
  },
  app: {
    header: {
      content: 'Turinys',
      workflow: 'Darbo eiga',
      media: 'Medija',
      quickAdd: 'Sukurti naują',
    },
    app: {
      errorHeader: 'Klaida, neišėjo užkrauti/pasiekti CMS konfigūracijos failą',
      configErrors: 'Konfigūracijos (nustatymų) klaidos',
      checkConfigYml: 'Patikrinkite config.yml balsą.',
      loadingConfig: 'Kraunamas nustatymų (konfigūracijos) failas...',
      waitingBackend: 'Laukiama serverio...',
    },
    notFoundPage: {
      header: 'Nerasta',
    },
  },
  collection: {
    sidebar: {
      collections: 'Kolekcijos',
      allCollections: 'Visos kolekcijos',
      searchAll: 'Ieškoti viską',
      searchIn: 'Ieškoti tik čia',
    },
    collectionTop: {
      sortBy: 'Rikiavimo tvarka',
      viewAs: 'Peržiūrėti kaip',
      newButton: 'Nauja(s) %{collectionLabel}',
      ascending: 'Didėjimo tvarka (A-Z)',
      descending: 'Mažėjimo tvarka (Z-A)',
      searchResults: 'Paieškos rezultatai: „%{searchTerm}“',
      searchResultsInCollection: 'Paieškos rezultatai: „%{searchTerm}“ iš %{collection}',
      filterBy: 'Filtruoti',
      groupBy: 'Grupuoti',
    },
    entries: {
      loadingEntries: 'Kraunamas turinys...',
      cachingEntries: 'Talpinami įrašai...',
      longerLoading: 'Šis procesas gali trukti keletą minučių',
      noEntries: 'Nėra turinio',
    },
    groups: {
      other: 'Kita',
      negateLabel: 'Ne %{label}',
    },
    defaultFields: {
      author: {
        label: 'Autorius',
      },
      updatedOn: {
        label: 'Atnaujinta',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'neprivaloma',
      },
    },
    editorControlPane: {
      widget: {
        required: 'Privaloma užpildyti laukelį %{fieldLabel}.',
        regexPattern:
          '%{fieldLabel} laukelis neatitiko konfigūracijoje nustatytų taisyklių: %{pattern}.',
        processing: 'Apdorojame %{fieldLabel}.',
        range: '%{fieldLabel} turi būti tarp %{minValue} ir %{maxValue}.',
        min: '%{fieldLabel} turi būti bent %{minValue}.',
        max: '%{fieldLabel} turi būti %{maxValue} arba mažiau.',
        rangeCount: '%{fieldLabel} turi būti tarp %{minCount} ir %{maxCount} elementų/-o.',
        rangeCountExact: '%{fieldLabel} turi turėti būtent tik %{count} elementų/-us.',
        rangeMin: '%{fieldLabel} turi būti bent %{minCount} elementų.',
        rangeMax: '%{fieldLabel} turi būti %{maxCount} arba mažiau elementų.',
        invalidPath: `'%{path}' nėra taisyklinga nuoroda/adresas į resursą/-us`,
        pathExists: `Adresas '%{path}' jau egzistuoja`,
      },
      i18n: {
        writingInLocale: 'Rašome %{locale} kalboje',
      },
    },
    editor: {
      onLeavePage: 'Ar tikrai norite uždaryti šį puslapį?',
      onUpdatingWithUnsavedChanges:
        'Turite neišsaugotų pakeitimų! Prašome išsaugoti prieš pakeičiant statusą.',
      onPublishingNotReady: 'Prieš publikuojant, privalote pakeisti statusą į „Paruošta“.',
      onPublishingWithUnsavedChanges:
        'Yra neišsaugotų pakeitimų, prašome išsaugoti juos prieš publikuojant.',
      onPublishing: 'Ae tikrai norite publikuoti šį įrašą?',
      onUnpublishing: 'Tikrai norite panaikinti publikavimo statusą?',
      onDeleteWithUnsavedChanges:
        'Tikrai norite panaikinti publikuotą įrašą ir Jūsų pakeiitmus iš dabartinės sesijos?',
      onDeletePublishedEntry: 'Tikrai norite ištrinti šį publikuotą įrašą?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Tai ištrins visus nepublikuotus pakeitimus įraše, taip pat neišsaugotus pakeitimus per dabartinę sesiją. Vis tiek norite trinti?',
      onDeleteUnpublishedChanges:
        'Visi Jūsų pakeitimai įraše bus panaikinti. Ar tikrai norite trinti jį?',
      loadingEntry: 'Kraunamas įrašas...',
      confirmLoadBackup:
        'Radome Jūsų įrenginyje išsaugota juodraštį šiam įrašui, ar norite jį atgaivinti ir naudoti?',
    },
    editorToolbar: {
      publishing: 'Publikuojama...',
      publish: 'Publikuoti',
      published: 'Jau publikuota',
      unpublish: 'Atšaukti paskelbimą',
      duplicate: 'Daryti dublį',
      unpublishing: 'Nebeskelbiama...',
      publishAndCreateNew: 'Publikuoti šitą, po to kurti kažką naujo',
      publishAndDuplicate: 'Publikuoti šitą, po to kurti šito dublį',
      deleteUnpublishedChanges: 'Ištrinti publikuotus pakeitimus',
      deleteUnpublishedEntry: 'Ištrinti nepaskelbtą įrašą',
      deletePublishedEntry: 'Ištrinti paskelbtą įrašą',
      deleteEntry: 'Panaikinti įrašą',
      saving: 'Išsaugojama...',
      save: 'Išsaugoti',
      deleting: 'Trinama...',
      updating: 'Atnaujinama...',
      status: 'Statusą: %{status}',
      backCollection: ' Rašoma %{collectionLabel} kolekcijoje',
      unsavedChanges: 'Neišsaugoti pakeitimai',
      changesSaved: 'Pakeitimai išsauogti',
      draft: 'Juodraštis',
      inReview: 'Peržiūrima redakcijoje',
      ready: 'Paruošta',
      publishNow: 'Skelbti naują',
      deployPreviewPendingButtonLabel: 'Tikrinti, ar yra demonstracija',
      deployPreviewButtonLabel: 'Žiūrėti demonstraciją (netiesiogiai)',
      deployButtonLabel: 'Žiūrėti tiesiogiai tinklalapyje',
    },
    editorWidgets: {
      markdown: {
        bold: 'Paryškinta',
        italic: 'Pasvariu tekstu (italic)',
        code: 'Kodo šriftas',
        link: 'Nuoroda (adresas)',
        linkPrompt: 'Įveskite adresą čia',
        headings: 'Antraštės',
        quote: 'Citata',
        bulletedList: 'Sąrašas su ženkleliais',
        numberedList: 'Sąrašas su numeriais',
        addComponent: 'Pridėti komponentą',
        richText: 'Normali peržiūra',
        markdown: 'Rodyti be formatavimo (Markdown)',
      },
      image: {
        choose: 'Pasirinkti vaizdą',
        chooseDifferent: 'Pasirinkti skirtingą vaizdą',
        remove: 'Panaikinti vaizdą',
      },
      file: {
        choose: 'Pasirinkti failą',
        chooseDifferent: 'Pasirinkti kitą failą',
        remove: 'Panaikinti failą',
      },
      unknownControl: {
        noControl: "Klaida: valdiklis taisyklingai neveikia. No control for widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Klaida: valdiklis taisyklingai neveikia. No preview for widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Antraštė 1',
        headingTwo: 'Antraštė 2',
        headingThree: 'Antraštė 3',
        headingFour: 'Antraštė 4',
        headingFive: 'Antraštė 5',
        headingSix: 'Antraštė 6',
      },
      datetime: {
        now: 'Dabar',
        clear: 'Išvalyti',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Juodraštis',
    },
    mediaLibrary: {
      onDelete: 'Ar jūs tikrai norite ištrinti pasirinktą mediją?',
      fileTooLarge:
        'Failas per didelis.\nNustatymuose (konfigūracijoje) nurodyta, kad failai negali viršyti %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Kraunama...',
      noResults: 'Nėra rezultatų.',
      noAssetsFound: 'Turinio nerasta.',
      noImagesFound: 'Vaizdų nerasta.',
      private: 'Privatu ',
      images: 'Vaizdai',
      mediaAssets: 'Medijos turinys',
      search: 'Paieška...',
      uploading: 'Keliama...',
      upload: 'Įkelti',
      download: 'Parsiųsti',
      deleting: 'Trinama...',
      deleteSelected: 'Ištrinti parinktus',
      chooseSelected: 'Pasirinkti parinktus',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Grįžti atgal į tinklalapį',
    },
    errorBoundary: {
      title: 'Klaida',
      details: 'Buvo klaida - jeigu galite, prašome ',
      reportIt: 'pranešti apie techninę problemą „GitHub“ puslapyje.',
      detailsHeading: 'Detalės',
      privacyWarning:
        'Opening an issue pre-populates it with the error message and debugging data.\nPlease verify the information is correct and remove sensitive data if exists.',
      recoveredEntry: {
        heading: 'Sugrąžintas dokumentas',
        warning: 'Prašome kopijuoti/įkluoti šitą kažkur prieš uždarant puslapį!',
        copyButtonLabel: 'Nukopijuoti į iškarpinę',
      },
    },
    settingsDropdown: {
      logOut: 'Atsijungti',
    },
    toast: {
      onFailToLoadEntries: 'Nepavyko užkrauti įrašo: %{details}',
      onFailToLoadDeployPreview: 'Nepavyko užkrauti demonstracijos lango: %{details}',
      onFailToPersist: 'Nepavyko išlaikyti įrašo: %{details}',
      onFailToDelete: 'Nepayvko ištrinti: %{details}',
      onFailToUpdateStatus: 'Nepavyko pakeisti statusą: %{details}',
      missingRequiredField:
        'Pasitikrinkite — kažkurio (ar kelių) laukelių neužpildėte. Tai padarius galėsite išsaugoti įrašą.',
      entrySaved: 'Įrašas išsaugotos',
      entryPublished: 'Įrašas publikuotas',
      entryUnpublished: 'Įrašas nepublikuotas',
      onFailToPublishEntry: 'Nepavyko publikuoti: %{details}',
      onFailToUnpublishEntry: 'Nepavyko panaikinti publikavimą: %{details}',
      entryUpdated: 'Įrašo statusas pakeistas',
      onDeleteUnpublishedChanges: 'Nepublikuoti pakeitimai ištrinti',
      onFailToAuth: 'Nepavyko prisijungti: %{details}',
      onLoggedOut:
        'Mes jus atjungėme. Jeigu yra poreikis, sukurkite duomenų atsarginę kopiją. Galite tiesiog iš naujo prisijungti.',
      onBackendDown:
        'Deja, serveris šiuo metu neveikia. Bandykite iš naujo dar sykį arba šiek tiek vėliau. Detalės: %{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Kraunamas turinys',
      workflowHeading: 'Redakcijos darbo eiga',
      newPost: 'Naujas įrašas',
      description:
        '%{smart_count} įrašas laukia Jūsų peržiūrėjimo, %{readyCount} jau gali būti publikuojamas. |||| %{smart_count} elementai laukia Jūsų peržiūrėjimo, %{readyCount} jau gali būti publikuojami. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} pagal %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'oagal %{author}',
      deleteChanges: 'Trinti keitimus',
      deleteNewEntry: 'Trinti naują įrašą',
      publishChanges: 'Publikuoti keitimus',
      publishNewEntry: 'Kurti naują įrašą',
    },
    workflowList: {
      onDeleteEntry: 'Ar tikrai norite ištrinti šį įrašą?',
      onPublishingNotReadyEntry:
        'Tik įrašai su statusu „Paruošta“ gali būti patvirtinti. Prašome pajudinti įrašo kortelę link „Paruošta“ stulpelio, kad galėtumėte publikuoti įrašą.',
      onPublishEntry: 'Ar jūs tikrai norite publikuoti šį įrašą?',
      draftHeader: 'Juodraščiai',
      inReviewHeader: 'Peržiūrima redakcijoje',
      readyHeader: 'Paruošta',
      currentEntries: '%{smart_count} įrašas |||| %{smart_count} įrašai',
    },
  },
};

export default lt;
