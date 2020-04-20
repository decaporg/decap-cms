const hu = {
  app: {
    header: {
      content: 'Tartalom',
      workflow: 'Munkafolyamat',
      media: 'Média',
      quickAdd: 'Gyors hozzáadás',
    },
    app: {
      errorHeader: 'Hiba történt a CMS konfiguráció betöltése közben',
      configErrors: 'Configurációs hibák',
      checkConfigYml: 'Ellenőrizd a config.yml filet.',
      loadingConfig: 'Konfiguráció betöltése...',
      waitingBackend: 'Várakozás hattérrendszerekre...',
    },
    notFoundPage: {
      header: 'Nincs találat',
    },
  },
  collection: {
    sidebar: {
      collections: 'Gyűjtemények',
      searchAll: 'Keresés mindenre',
    },
    collectionTop: {
      viewAs: 'Nézet mint',
      newButton: 'Új %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Bejegyzések betöltése',
      cachingEntries: 'Bejegyzések cacheelése',
      longerLoading: 'Ez még eltarthat néhany percig',
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'választható',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} kötelező mező.',
        regexPattern: '%{fieldLabel} nem egyezik a %{pattern} mintával.',
        processing: '%{fieldLabel} feldolgozás alatt.',
        range: '%{fieldLabel}, %{minValue} és %{maxValue} értékek között kell legyen.',
        min: '%{fieldLabel} legalább %{minValue} kell legyen vagy több.',
        max: '%{fieldLabel} legalabb %{maxValue} vagy kevesebb kell legyen.',
      },
    },
    editor: {
      onLeavePage: 'Biztos hogy el akarod hagyni az oldalt?',
      onUpdatingWithUnsavedChanges:
        'Mentettlen változtatások vannak, kérjük, mentse az állapot frissítése előtt.',
      onPublishingNotReady: 'Változtasd az állapotot "Kész"-re publikálás előtt.',
      onPublishingWithUnsavedChanges:
        'Mentetlen változtatások vannak, kérjük, mentsen a publikálás előtt.',
      onPublishing: 'Publikálod ezt a bejegyzést?',
      onUnpublishing: 'Publikálás visszavonása erre a bejegyzésre?',
      onDeleteWithUnsavedChanges:
        'Töröljük ezt a publikált bejegyzést, a többi mentetlen modositással együtt?',
      onDeletePublishedEntry: 'Töröljük ezt a publikált bejegyzést?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Ezzel törli a bejegyzés összes nem közzétett módosítását, valamint az aktuális munkamenetből nem mentett módosításokat. Még mindig törli?',
      onDeleteUnpublishedChanges:
        'A bejegyzés összes, nem közzétett módosítása törlődik. Még mindig törli?',
      loadingEntry: 'Bejegyzés betöltése...',
      confirmLoadBackup:
        'Helyi biztonsági másolat került helyre ehhez a bejegyzéshez, szeretné használni?',
    },
    editorToolbar: {
      publishing: 'Publikálás...',
      publish: 'Publikáció',
      published: 'Publikálás',
      unpublish: 'Publikálás visszavonása',
      duplicate: 'Duplikált',
      unpublishing: 'Publikálás visszavonása...',
      publishAndCreateNew: 'Publikálás és új létrehozása',
      publishAndDuplicate: 'Publikálás és duplikál',
      deleteUnpublishedChanges: 'Nempublikált változtatások törlése',
      deleteUnpublishedEntry: 'Nempublikált bejegyzés törlése',
      deletePublishedEntry: 'Publikált bejegyzés törlése',
      deleteEntry: 'Bejegyzés törlése',
      saving: 'Mentés...',
      save: 'Mentés',
      deleting: 'Törlés...',
      updating: 'Frissítés...',
      setStatus: 'Állapot beállitása',
      backCollection: ' Írás a %{collectionLabel} gyűjteménybe',
      unsavedChanges: 'Nemmentett változtatások',
      changesSaved: 'Változások elmentve',
      draft: 'Piszkozat',
      inReview: 'Felülvizsgálat alatt',
      ready: 'Kész',
      publishNow: 'Publikálás most',
      deployPreviewPendingButtonLabel: 'Előnézet ellenörzése',
      deployPreviewButtonLabel: 'Előnézet megtekintése',
      deployButtonLabel: 'Élő megtekintése',
    },
    editorWidgets: {
      image: {
        choose: 'Válasszon képet',
        chooseDifferent: 'Válasszon másik képet',
        remove: 'Távolítsa el a képet',
      },
      file: {
        choose: 'Válasszon fájlt',
        chooseDifferent: 'Válasszon másik fájlt',
        remove: 'Távolítsa el a fájlt',
      },
      unknownControl: {
        noControl: "Nincs vezérlés a '%{widget}' widget számára.",
      },
      unknownPreview: {
        noPreview: "Nincs előnézet a '%{widget}' widget számára.",
      },
      headingOptions: {
        headingOne: 'Heading 1',
        headingTwo: 'Heading 2',
        headingThree: 'Heading 3',
        headingFour: 'Heading 4',
        headingFive: 'Heading 5',
        headingSix: 'Heading 6',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Piszkozat',
    },
    mediaLibrary: {
      onDelete: 'Biztos törli a kiválasztott média tartalmat?',
    },
    mediaLibraryModal: {
      loading: 'Betöltés...',
      noResults: 'Nincs találat.',
      noAssetsFound: 'Nem található tartalom.',
      noImagesFound: 'Nem található kép.',
      private: 'Privát ',
      images: 'Képek',
      mediaAssets: 'Média tartalmak',
      search: 'Keresés...',
      uploading: 'Feltöltés...',
      upload: 'Új feltöltés',
      deleting: 'Törlés...',
      deleteSelected: 'Kijelöltek törlése',
      chooseSelected: 'Kijelöl',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Hiba',
      details: 'Hiba történt - kérjük ',
      reportIt: 'jelentse.',
      detailsHeading: 'Részletek',
      recoveredEntry: {
        heading: 'Helyreállitott dokumentum',
        warning: 'Kérjük mentse ezt el (vágólapra) mielőtt elhagyná az oldalt!',
        copyButtonLabel: 'Másolás a vágólapra',
      },
    },
    settingsDropdown: {
      logOut: 'Kijelentkezés',
    },
    toast: {
      onFailToLoadEntries: 'A bejegyzés betöltése nem sikerült: %{details}',
      onFailToLoadDeployPreview: 'Az előnézet betöltése nem sikerült: %{details}',
      onFailToPersist: 'Bejegyzés megtartása sikertelen: %{details}',
      onFailToDelete: 'A bejegyzés törlése sikertelen: %{details}',
      onFailToUpdateStatus: 'Az állapot frissítése nem sikerült: %{details}',
      missingRequiredField: 'Hoppá, kihagytál egy kötelező mezőt. Mentés előtt töltsd ki.',
      entrySaved: 'Bejegyzés elmentve',
      entryPublished: 'Bejegyzés publikálva',
      entryUnpublished: 'Bejegyzés publikálása visszavonva',
      onFailToPublishEntry: 'Bejegyzés publikálása sikertelen: %{details}',
      onFailToUnpublishEntry: 'Bejegyzés publikálásának visszavonása sikertelen: %{details}',
      entryUpdated: 'Bejegyzés állapota frissült',
      onDeleteUnpublishedChanges: 'Unpublished changes deleted',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'A szerkesztési munkafolyamat-bejegyzések betöltése',
      workflowHeading: 'Szerkesztői Folyamat',
      newPost: 'New Post',
      description:
        '%{smart_count} bejegyzés felülvizsgálatra vár, %{readyCount} élesítésre vár. |||| %{smart_count} bejegyzés felülvizsgálatra vár, %{readyCount} élesítésre vár. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date}, írta %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: '%{author}',
      deleteChanges: 'Változtatások törlése',
      deleteNewEntry: 'Új bejegyzés törlése',
      publishChanges: 'Változtatások publikálása',
      publishNewEntry: 'Új bejegyzés publikálása',
    },
    workflowList: {
      onDeleteEntry: 'Biztosan törli ezt a bejegyzést?',
      onPublishingNotReadyEntry:
        'Csak a "Kész" állapotú tételek tehetők közzé. A közzététel engedélyezéséhez húzza a kártyát a „Kész” oszlopba.',
      onPublishEntry: 'Biztosan közzéteszi ezt a bejegyzést?',
      draftHeader: 'Piszkozat',
      inReviewHeader: 'Vizsgálat alatt',
      readyHeader: 'Kész',
      currentEntries: '%{smart_count} bejegyzés |||| %{smart_count} bejegyzések',
    },
  },
};

export default hu;
