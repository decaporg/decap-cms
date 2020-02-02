const de = {
  auth: {
    login: 'Login',
    loggingIn: 'Sie werden eingeloggt...',
    loginWithNetlifyIdentity: 'Mit Netlify Identity einloggen',
    errors: {
      email: 'Stellen Sie sicher, Ihre E-Mail-Adresse einzugeben.',
      password: 'Bitte geben Sie Ihr Passwort ein.',
      identitySettings:
        'Identity Einstellungen konnten nicht abgerufen werden. Stellen Sie bei der Verwendung des Git-Gateway Backends sicher, den Identity Service und das Git Gateway zu aktivieren.',
    },
  },
  app: {
    header: {
      content: 'Inhalt',
      workflow: 'Arbeitsablauf',
      media: 'Medien',
      quickAdd: 'Schnell-Erstellung',
    },
    app: {
      errorHeader: 'Fehler beim Laden der CMS-Konfiguration.',
      configErrors: 'Konfigurationsfehler',
      checkConfigYml: 'Überprüfen Sie die config.yml Konfigurationsdatei.',
      loadingConfig: 'Konfiguration laden...',
      waitingBackend: 'Auf Server warten...',
    },
    notFoundPage: {
      header: 'Nicht gefunden',
    },
  },
  collection: {
    sidebar: {
      collections: 'Inhaltstypen',
      searchAll: 'Alles durchsuchen',
    },
    collectionTop: {
      viewAs: 'Anzeigen als',
      newButton: 'Neue(r) %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Beiträge laden',
      cachingEntries: 'Beiträge zwischenspeichern',
      longerLoading: 'Diese Aktion kann einige Minuten in Anspruch nehmen',
    },
  },
  editor: {
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} ist erforderlich.',
        regexPattern: '%{fieldLabel} entspricht nicht dem Muster: %{pattern}.',
        processing: '%{fieldLabel} wird verarbeitet.',
        range: '%{fieldLabel} muss zwischen %{minValue} und %{maxValue} liegen.',
        min: '%{fieldLabel} muss größer als %{minValue} sein.',
        max: '%{fieldLabel} darf nicht größer als %{maxValue} sein.',
        rangeCount: '%{fieldLabel} muss %{minCount} bis %{maxCount} Element(e) enthalten.',
        rangeCountExact: '%{fieldLabel} muss exakt %{count} Element(e) enthalten.',
        minCount: '%{fieldLabel} muss mindestens %{minCount} Element(e) enthalten.',
        maxCount: '%{fieldLabel} darf maximal %{maxCount} Element(e) enthalten.',
      },
    },
    editor: {
      onLeavePage: 'Möchten Sie diese Seite wirklich verlassen?',
      onUpdatingWithUnsavedChanges:
        'Es sind noch ungespeicherte Änderungen vorhanden. Bitte speichern Sie diese, bevor Sie den Status aktualisieren.',
      onPublishingNotReady:
        'Bitte setzten die den Status vor dem Veröffentlichen auf "Abgeschlossen".',
      onPublishingWithUnsavedChanges:
        'Es sind noch ungespeicherte Änderungen vorhanden. Bitte speicheren Sie vor dem Veröffentlichen.',
      onPublishing: 'Soll dieser Beitrag wirklich veröffentlicht werden?',
      onUnpublishing: 'Soll die Veröffentlichung dieses Beitrags wirklich zurückgezogen werden?',
      onDeleteWithUnsavedChanges:
        'Möchten Sie diesen veröffentlichten Beitrag, sowie Ihre nicht gespeicherten Änderungen löschen?',
      onDeletePublishedEntry: 'Soll dieser veröffentlichte Beitrag wirklich gelöscht werden?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Möchten Sie diesen unveröffentlichten Beitrag, sowie Ihre nicht gespeicherten Änderungen löschen?',
      onDeleteUnpublishedChanges:
        'Alle unveröffentlichten Änderungen werden gelöscht. Möchten Sie wirklich löschen?',
      loadingEntry: 'Beitrag laden...',
      confirmLoadBackup:
        'Für diesen Beitrag ist ein lokales Backup vorhanden. Möchten Sie dieses benutzen?',
    },
    editorToolbar: {
      publishing: 'Veröffentlichen...',
      publish: 'Veröffentlichen',
      published: 'Veröffentlicht',
      unpublish: 'Veröffentlichung zurückziehen',
      duplicate: 'Duplizieren',
      unpublishing: 'Veröffentlichung wird zurückgezogen...',
      publishAndCreateNew: 'Veröffentlichen und neuen Beitrag erstellen',
      publishAndDuplicate: 'Veröffentlichen und Beitrag duplizieren',
      deleteUnpublishedChanges: 'Unveröffentlichte Änderungen verwerfen',
      deleteUnpublishedEntry: 'Lösche unveröffentlichten Beitrag',
      deletePublishedEntry: 'Lösche veröffentlichten Beitrag',
      deleteEntry: 'Lösche Beitrag',
      saving: 'Speichern...',
      save: 'Speichern',
      deleting: 'Löschen...',
      updating: 'Aktualisieren...',
      setStatus: 'Status setzen',
      backCollection: 'Zurück zu allen %{collectionLabel}',
      unsavedChanges: 'Ungespeicherte Änderungen',
      changesSaved: 'Änderungen gespeichert',
      draft: 'Entwurf',
      inReview: 'Zur Überprüfung',
      ready: 'Abgeschlossen',
      publishNow: 'Jetzt veröffentlichen',
      deployPreviewPendingButtonLabel: 'Überprüfen ob eine Vorschau vorhanden ist',
      deployPreviewButtonLabel: 'Vorschau anzeigen',
      deployButtonLabel: 'Live ansehen',
    },
    editorWidgets: {
      unknownControl: {
        noControl: "Kein Bedienelement für Widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Keine Vorschau für Widget '%{widget}'.",
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Entwurf',
    },
    mediaLibrary: {
      onDelete: 'Soll das ausgewählte Medium wirklich gelöscht werden?',
      fileTooLarge: 'Datei zu groß.\nErlaubt sind nur Dateien bis %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Laden...',
      noResults: 'Keine Egebnisse.',
      noAssetsFound: 'Keine Medien gefunden.',
      noImagesFound: 'Keine Bilder gefunden.',
      private: 'Privat ',
      images: 'Bilder',
      mediaAssets: 'Medien',
      search: 'Suchen...',
      uploading: 'Hochladen...',
      uploadNew: 'Hochladen',
      deleting: 'Löschen...',
      deleteSelected: 'Ausgewähltes Element löschen',
      chooseSelected: 'Ausgewähltes Element verwenden',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Fehler',
      details: 'Ein Fehler ist aufgetreten - bitte ',
      reportIt: 'berichte ihn.',
      detailsHeading: 'Details',
      recoveredEntry: {
        heading: 'Widerhergestellter Beitrag',
        warning: 'Bitte speichern Sie sich das bevor Sie die Seite verlassen!',
        copyButtonLabel: 'In Zwischenablage speichern',
      },
    },
    settingsDropdown: {
      logOut: 'Abmelden',
    },
    toast: {
      onFailToLoadEntries: 'Beitrag konnte nicht geladen werden: %{details}',
      onFailToLoadDeployPreview: 'Vorschau konnte nicht geladen werden: %{details}',
      onFailToPersist: 'Beitrag speichern fehlgeschlagen: %{details}',
      onFailToDelete: 'Beitrag löschen fehlgeschlagen: %{details}',
      onFailToUpdateStatus: 'Status aktualisieren fehlgeschlagen: %{details}',
      missingRequiredField: 'Oops, einige zwingend erforderliche Felder sind nicht ausgefüllt.',
      entrySaved: 'Beitrag gespeichert',
      entryPublished: 'Beitrag veröffentlicht',
      entryUnpublished: 'Beitrag nicht mehr öffentlich',
      onFailToPublishEntry: 'Veröffentlichen fehlgeschlagen: %{details}',
      onFailToUnpublishEntry:
        'Veröffentlichung des Beitrags konnte nicht rückgängig gemacht werden: %{details}',
      entryUpdated: 'Beitragsstatus aktualisiert',
      onDeleteUnpublishedChanges: 'Unveröffentlichte Änderungen verworfen',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Arbeitsablauf Beiträge laden',
      workflowHeading: 'Redaktioneller Arbeitsablauf',
      newPost: 'Neuer Beitrag',
      description:
        '%{smart_count} Beitrag zur Überprüfung bereit, %{readyCount} bereit zur Veröffentlichung. |||| %{smart_count} Beiträge zur Überprüfung bereit, %{readyCount} bereit zur Veröffentlichung. ',
    },
    workflowCard: {
      lastChange: '%{date} von %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'von %{author}',
      deleteChanges: 'Änderungen verwerfen',
      deleteNewEntry: 'Lösche neuen Beitrag',
      publishChanges: 'Veröffentliche Änderungen',
      publishNewEntry: 'Veröffentliche neuen Beitrag',
    },
    workflowList: {
      onDeleteEntry: 'Soll dieser Beitrag wirklich gelöscht werden?',
      onPublishingNotReadyEntry:
        'Nur Beiträge im Status "Abgeschlossen" können veröffentlicht werden. Bitte ziehen Sie den Beitrag in die "Abgeschlossen" Spalte um die Veröffentlichung zu aktivieren.',
      onPublishEntry: 'Soll dieser Beitrag wirklich veröffentlicht werden soll?',
      draftHeader: 'Entwurf',
      inReviewHeader: 'In Prüfung',
      readyHeader: 'Abgeschlossen',
      currentEntries: '%{smart_count} Beitrag |||| %{smart_count} Beiträge',
    },
  },
};

export default de;
