const cs = {
  auth: {
    login: 'Přihlásit',
    loggingIn: 'Přihlašování…',
    loginWithNetlifyIdentity: 'Přihlásit pomocí Netlify Identity',
    loginWithBitbucket: 'Přihlásit pomocí Bitbucket',
    loginWithGitHub: 'Přihlásit pomocí GitHub',
    loginWithGitLab: 'Přihlásit pomocí GitLab',
    errors: {
      email: 'Vyplňte e-mailovou adresu.',
      password: 'Vyplňte heslo.',
      identitySettings:
        'Nastavení identity nenalezeno. Používáte-li git-gateway server nezapomeňte aktivovat službu Identity a Git Gateway' +
        '.',
    },
  },
  app: {
    header: {
      content: 'Obsah',
      workflow: 'Workflow',
      media: 'Média',
      quickAdd: 'Přidat',
    },
    app: {
      errorHeader: 'Chyba při načítání CMS konfigurace',
      configErrors: 'Chyba konfigurace',
      checkConfigYml: 'Zkontrolujte soubor config.yml.',
      loadingConfig: 'Načítání konfigurace…',
      waitingBackend: 'Čekání na server…',
    },
    notFoundPage: {
      header: 'Nenalezeno',
    },
  },
  collection: {
    sidebar: {
      collections: 'Kolekce',
      searchAll: 'Hledat',
    },
    collectionTop: {
      viewAs: 'Zobrazit jako',
      newButton: 'Nový %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Načítání záznamů',
      cachingEntries: 'Úkládání záznamů do mezipaměti',
      longerLoading: 'Načítání může trvat několik minut',
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'volitelný',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} je povinný.',
        regexPattern: '%{fieldLabel} nesouhlasí s předepsaným vzorem: %{pattern}.',
        processing: '%{fieldLabel} se zpracovává.',
        range: '%{fieldLabel} musí být mezi %{minValue} a %{maxValue}.',
        min: '%{fieldLabel} musí být alespoň %{minValue}.',
        max: '%{fieldLabel} musí být %{maxValue} nebo méně.',
      },
    },
    editor: {
      onLeavePage: 'Chcete opravdu opustit tuto stránku?',
      onUpdatingWithUnsavedChanges: 'Máte neuložené změny. Uložte je prosím před změnou statusu.',
      onPublishingNotReady: 'Změňte stav na „Připraveno“ před publikováním.',
      onPublishingWithUnsavedChanges: 'Máte neuložené změny, prosím uložte je před publikováním.',
      onPublishing: 'Chcete opravdu publikovat tento záznam?',
      onUnpublishing: 'Chcete opravdu zrušit publikování tohoto záznamu?',
      onDeleteWithUnsavedChanges:
        'Chcete opravdu vymazat tuto publikovanou položku a všechny neuložené změny z této relace?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Tato akce vymaže všechny nepublikované změny v tomto záznamu a také všechny neuložené změny z této relace. Chcete záznam skutečně vymazat?',
      onDeleteUnpublishedChanges:
        'Všechny nepublivkoané změny v tomto záznamu budou vymazány. Chcete ho skuteně vymazat?',
      loadingEntry: 'Načítání záznamu…',
      confirmLoadBackup: 'Lokální kopie tohoto záznamu byla nalezena, chcete ji použít?',
    },
    editorToolbar: {
      publishing: 'Publikování…',
      publish: 'Publikovat',
      published: 'Publikovaný',
      unpublish: 'Zrušit publikování',
      duplicate: 'Duplikovat',
      unpublishing: 'Rušení publikování…',
      publishAndCreateNew: 'Publikovat a vytvořit nový',
      publishAndDuplicate: 'Publikovat a duplikovat',
      deleteUnpublishedChanges: 'Vymazat nepublikované změny',
      deleteUnpublishedEntry: 'Vymazat nepublikovaný záznam',
      deletePublishedEntry: 'Vymazat publikovaný záznam',
      deleteEntry: 'Vymazat záznam',
      saving: 'Ukládání…',
      save: 'Uložit',
      deleting: 'Vymazávání…',
      updating: 'Aktualizace…',
      setStatus: 'Změnit status',
      backCollection: ' Píšete v kolekci %{collectionLabel}',
      unsavedChanges: 'Neuložené změny',
      changesSaved: 'Změny uloženy',
      draft: 'Koncept',
      inReview: 'V revizi',
      ready: 'Připraveno',
      publishNow: 'Publikovat teď',
      deployPreviewPendingButtonLabel: 'Zkontrolovat náhled',
      deployPreviewButtonLabel: 'Zobrazit náhled',
      deployButtonLabel: 'Zobrazit na webu',
    },
    editorWidgets: {
      image: {
        choose: 'vyberte obrázek',
        chooseDifferent: 'vyberte jiný obrázek',
        remove: 'odstranit obrázek',
      },
      file: {
        choose: 'vyberte soubor',
        chooseDifferent: 'vyberte jiný soubor',
        remove: 'odebrat soubor',
      },
      unknownControl: {
        noControl: "Žádné ovládání pro widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Žádný náhled pro widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Nadpis 1',
        headingTwo: 'Nadpis 2',
        headingThree: 'Nadpis 3',
        headingFour: 'Nadpis 4',
        headingFive: 'Nadpis 5',
        headingSix: 'Nadpis 6',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Koncept',
    },
    mediaLibrary: {
      onDelete: 'Chcete skutečně vymazat označená média?',
      fileTooLarge: 'Soubor je příliš velký.\nSoubor musí být menší než %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Načítání…',
      noResults: 'Nic nenalezeno.',
      noAssetsFound: 'Média nenalezena.',
      noImagesFound: 'Obrázky nenalezeny.',
      private: 'Soukromé ',
      images: 'Obrázky',
      mediaAssets: 'Média',
      search: 'Hledat…',
      uploading: 'Nahrávání…',
      upload: 'Nahrát nový',
      deleting: 'Vymazávání…',
      deleteSelected: 'Smazat označené',
      chooseSelected: 'Vybrat označené',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Chyba',
      details: 'Nastala chyba – prosím ',
      reportIt: 'nahlašte ji.',
      detailsHeading: 'Detaily',
      recoveredEntry: {
        heading: 'Nalezený dokument',
        warning: 'Prosím zkopírujte dokument do schránky před tím než odejte z této stránky!',
        copyButtonLabel: 'Zkopírovat do schránky',
      },
    },
    settingsDropdown: {
      logOut: 'Odhlásit',
    },
    toast: {
      onFailToLoadEntries: 'Chyba při načítání záznamu: %{details}',
      onFailToLoadDeployPreview: 'Chyba při načítání náhledu: %{details}',
      onFailToPersist: 'Chyba při ukládání záznamu: %{details}',
      onFailToDelete: 'Chyba při vymazávání záznamu: %{details}',
      onFailToUpdateStatus: 'Chyba při změně stavu záznamu: %{details}',
      missingRequiredField: 'Vynechali jste povinné pole. Prosím vyplňte ho.',
      entrySaved: 'Záznam uložen',
      entryPublished: 'Záznam publikován',
      entryUnpublished: 'Publikování záznamu zrušeno',
      onFailToPublishEntry: 'Chyba při publikování záznamu: %{details}',
      onFailToUnpublishEntry: 'Chyba při rušení publikování záznamu: %{details}',
      entryUpdated: 'Stav záznamu byl změněn',
      onDeleteUnpublishedChanges: 'Nepublikované změny byly smazány',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Načítání workflow záznamů',
      workflowHeading: 'Schvalovací Workflow',
      newPost: 'Nový post',
      description:
        '%{smart_count} záznam čeká na schválení, %{readyCount} připraven k publikaci. |||| %{smart_count} čeká na schválení, %{readyCount} připraveno k publikaci. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} (%{author})',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: '%{author}',
      deleteChanges: 'Vymazat změny',
      deleteNewEntry: 'Vymazat nový záznam',
      publishChanges: 'Publikovat změny',
      publishNewEntry: 'Publikovat nový záznam',
    },
    workflowList: {
      onDeleteEntry: 'Opravdu chcete smazat tento záznam?',
      onPublishingNotReadyEntry:
        'Pouze položky se statusem "Připraveno" mohou být publikováno. Pro umožnění publikace musíte přetáhnout kartu do sloupce "Připraveno"',
      onPublishEntry: 'Opravdu chcete publikovat tento záznam?',
      draftHeader: 'Koncepty',
      inReviewHeader: 'V revizi',
      readyHeader: 'Připraveno',
      currentEntries: '%{smart_count} záznam |||| %{smart_count} záznamů',
    },
  },
};

export default cs;
