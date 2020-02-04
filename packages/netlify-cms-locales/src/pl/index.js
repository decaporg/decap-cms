const pl = {
  auth: {
    login: 'Zaloguj się',
    loggingIn: 'Logowanie...',
    errors: {
      email: 'Wprowadź swój adres email',
      password: 'Wprowadź swoje hasło',
    },
  },
  app: {
    header: {
      content: 'Treść',
      workflow: 'Przebieg redakcyjny',
      media: 'Multimedia',
      quickAdd: 'Szybkie dodawanie',
    },
    app: {
      errorHeader: 'Błąd ładowania konfiguracji CMS',
      configErrors: 'Błędy konfiguracji',
      checkConfigYml: 'Sprawdź plik config.yml.',
      loadingConfig: 'Ładowanie konfiguracji...',
      waitingBackend: 'Oczekiwanie na backend...',
    },
    notFoundPage: {
      header: 'Nie znaleziono',
    },
  },
  collection: {
    sidebar: {
      collections: 'Zbiory',
      searchAll: 'Wyszukaj wszystkie',
    },
    collectionTop: {
      viewAs: 'Wyświetl jako',
      newButton: 'Nowy %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Ładowanie pozycji',
      cachingEntries: 'Ładowanie pozycji do pamięci podręcznej',
      longerLoading: 'To może zająć kilka minut',
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'opcjonalne',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} jest wymagane.',
        regexPattern: '%{fieldLabel} nie pasuje do formatu: %{pattern}.',
        processing: '%{fieldLabel} jest przetwarzane.',
        range: '%{fieldLabel} musi być pomiędzy %{minValue} a %{maxValue}.',
        min: '%{fieldLabel} musi być co najmniej %{minValue}.',
        max: '%{fieldLabel} musi być %{maxValue} lub mniej.',
        rangeCount: '%{fieldLabel} musi mieć od %{minCount} do %{maxCount} elementów',
        rangeCountExact: '%{fieldLabel} musi mieć %{count} elementów',
        minCount: '%{fieldLabel} musi mieć przynajmniej %{minCount} elementów',
        maxCount: '%{fieldLabel} może mieć maksymalnie %{maxCount} elementów',
      },
    },
    editor: {
      onLeavePage: 'Czy na pewno chcesz opuścić tę stronę?',
      onUpdatingWithUnsavedChanges:
        'Masz niezapisane zmiany, proszę zapisz je przed aktualizacją statusu.',
      onPublishingNotReady: 'Proszę zaktualizować status do "Gotowe" przed publikacją.',
      onPublishingWithUnsavedChanges: 'Masz niezapisane zmiany, proszę zapisz je przed publikacją.',
      onPublishing: 'Czy na pewno chcesz opublikować tę pozycję?',
      onUnpublishing: 'Czy na pewno chcesz cofnąć publikację tej pozycji?',
      onDeleteWithUnsavedChanges:
        'Czy na pewno chcesz usunąć tę opublikowaną pozycję, a także niezapisane zmiany z bieżącej sesji?',
      onDeletePublishedEntry: 'Czy na pewno chcesz usunąć tę opublikowaną pozycję?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Spowoduje to usunięcie wszystkich nieopublikowanych zmian tej pozycji, a także niezapisanych zmian z bieżącej sesji. Czy nadal chcesz usunąć?',
      onDeleteUnpublishedChanges:
        'Wszystkie nieopublikowane zmiany tej pozycji zostaną usunięte. Czy nadal chcesz usunąć?',
      loadingEntry: 'Ładowanie pozycji...',
      confirmLoadBackup: 'Odzyskano lokalną kopię zapasową tej pozycji, czy chcesz jej użyć?',
    },
    editorToolbar: {
      publishing: 'Publikowanie...',
      publish: 'Opublikuj',
      published: 'Opublikowane',
      duplicate: 'Zduplikuj',
      unpublish: 'Cofnij publikację',
      unpublishing: 'Cofanie publikacji...',
      publishAndCreateNew: 'Opublikuj i dodaj',
      deleteUnpublishedChanges: 'Usuń nieopublikowane zmiany',
      deleteUnpublishedEntry: 'Usuń nieopublikowaną pozycję',
      deletePublishedEntry: 'Usuń opublikowaną pozycję',
      deleteEntry: 'Usuń pozycję',
      saving: 'Zapisywanie...',
      save: 'Zapisz',
      deleting: 'Usuwanie...',
      updating: 'Uaktualnianie...',
      setStatus: 'Ustaw status',
      backCollection: ' Edycja treści w zbiorze %{collectionLabel}',
      unsavedChanges: 'Niezapisane zmiany',
      changesSaved: 'Zmiany zapisane',
      draft: 'Wersja robocza',
      inReview: 'W recenzji',
      ready: 'Gotowe',
      publishNow: 'Opublikuj teraz',
      deployPreviewPendingButtonLabel: 'Sprawdź, czy istnieje podgląd',
      deployPreviewButtonLabel: 'Zobacz podgląd',
      deployButtonLabel: 'Zobacz na żywo',
    },
    editorWidgets: {
      markdown: {
        //richText: 'Edytor wizualny' - I'm not sure about that
        markdown: 'Markdown',
      },
      image: {
        choose: 'Wybierz zdjęcie',
        chooseDifferent: 'Zmień zdjęcie',
        remove: 'Usuń zdjęcie',
      },
      file: {
        choose: 'Wybierz plik',
        chooseDifferent: 'Wybierz inny plik',
        remove: 'Usuń plik',
      },
      unknownControl: {
        noControl: "Brak kontrolki dla widżetu '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Brak podglądu dla widżetu '%{widget}'.",
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Wersja robocza',
    },
    mediaLibrary: {
      onDelete: 'Czy na pewno chcesz usunąć zaznaczone multimedia?',
      fileTooLarge: 'Plik jest za duży.\nUstawiony maksymalny rozmiar pliku: %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Ładowanie...',
      noResults: 'Brak wyników.',
      noAssetsFound: 'Nie znaleziono żadnych zasobów.',
      noImagesFound: 'Nie znaleziono żadnych obrazów.',
      private: 'Prywatne ',
      images: 'Obrazy',
      mediaAssets: 'Zasoby multimedialne',
      search: 'Szukaj...',
      uploading: 'Przesyłanie...',
      uploadNew: 'Prześlij nowe',
      deleting: 'Usuwanie...',
      deleteSelected: 'Usuń zaznaczone',
      chooseSelected: 'Wybierz zaznaczone',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Błąd',
      details: 'Wystąpił błąd - proszę ',
      reportIt: 'zgłoś to.',
      detailsHeading: 'Szczegóły',
      recoveredEntry: {
        heading: 'Odzyskany dokument',
        warning: 'Proszę skopiuj/wklej to gdzieś zanim opuścisz tę stronę!',
        copyButtonLabel: 'Skopiuj do schowka',
      },
    },
    settingsDropdown: {
      logOut: 'Wyloguj się',
    },
    toast: {
      onFailToLoadEntries: 'Nie udało się załadować pozycji: %{details}',
      onFailToLoadDeployPreview: 'Nie udało się załadować podglądu: %{details}',
      onFailToPersist: 'Nie udało się zapisać pozycji: %{details}',
      onFailToDelete: 'Nie udało się usunąć pozycji: %{details}',
      onFailToUpdateStatus: 'Nie udało się zaktualizować statusu: %{details}',
      missingRequiredField: 'Ups, przegapiłeś wymagane pole. Proszę uzupełnij przed zapisaniem.',
      entrySaved: 'Pozycja zapisana',
      entryPublished: 'Pozycja opublikowana',
      entryUnpublished: 'Cofnięto publikację pozycji',
      onFailToPublishEntry: 'Nie udało się opublikować: %{details}',
      onFailToUnpublishEntry: 'Nie udało się cofnąć publikacji pozycji: %{details}',
      entryUpdated: 'Zaktualizowano status pozycji',
      onDeleteUnpublishedChanges: 'Nieopublikowane zmiany zostały usunięte',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Ładowanie pozycji przebiegu redakcyjnego',
      workflowHeading: 'Przebieg redakcyjny',
      newPost: 'Nowa pozycja',
      description:
        '%{smart_count} pozycja oczekuje na recenzję, %{readyCount} oczekuje na publikacje. |||| %{smart_count} pozycje oczekują na recenzję, %{readyCount} oczekuje na publikacje. |||| %{smart_count} pozycji oczekuje na recenzje, %{readyCount} oczekuje na publikacje. ',
    },
    workflowCard: {
      lastChange: '%{date} przez %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'przez %{author}',
      deleteChanges: 'Usuń zmiany',
      deleteNewEntry: 'Usuń nową pozycję',
      publishChanges: 'Opublikuj zmiany',
      publishNewEntry: 'Opublikuj nową pozycję',
    },
    workflowList: {
      onDeleteEntry: 'Czy na pewno chcesz usunąć tę pozycję?',
      onPublishingNotReadyEntry:
        'Tylko pozycje o statusie „Gotowe” mogą być publikowane. Przeciągnij proszę kartę do kolumny „Gotowe do publikacji”, aby umożliwić publikowanie.',
      onPublishEntry: 'Czy na pewno chcesz opublikować tę pozycję?',
      draftHeader: 'Wersje robocze',
      inReviewHeader: 'W recenzji',
      readyHeader: 'Gotowe do publikacji',
      currentEntries:
        '%{smart_count} pozycja |||| %{smart_count} pozycje |||| %{smart_count} pozycji',
    },
  },
};

export default pl;
