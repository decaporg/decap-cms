"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const de = {
  auth: {
    login: 'Login',
    loggingIn: 'Sie werden eingeloggt...',
    loginWithNetlifyIdentity: 'Mit Netlify Identity einloggen',
    loginWithAzure: 'Mit Azure einloggen',
    loginWithBitbucket: 'Mit Bitbucket einloggen',
    loginWithGitHub: 'Mit GitHub einloggen',
    loginWithGitLab: 'Mit GitLab einloggen',
    errors: {
      email: 'Stellen Sie sicher, Ihre E-Mail-Adresse einzugeben.',
      password: 'Bitte geben Sie Ihr Passwort ein.',
      identitySettings: 'Identity Einstellungen konnten nicht abgerufen werden. Stellen Sie bei der Verwendung des Git-Gateway Backends sicher, den Identity Service und das Git Gateway zu aktivieren.'
    }
  },
  app: {
    header: {
      content: 'Inhalt',
      workflow: 'Arbeitsablauf',
      media: 'Medien',
      quickAdd: 'Schnell-Erstellung'
    },
    app: {
      errorHeader: 'Fehler beim Laden der CMS-Konfiguration.',
      configErrors: 'Konfigurationsfehler',
      checkConfigYml: 'Überprüfen Sie die config.yml Konfigurationsdatei.',
      loadingConfig: 'Konfiguration laden...',
      waitingBackend: 'Auf Server warten...'
    },
    notFoundPage: {
      header: 'Nicht gefunden'
    }
  },
  collection: {
    sidebar: {
      collections: 'Inhaltstypen',
      allCollections: 'Allen Inhaltstypen',
      searchAll: 'Alles durchsuchen',
      searchIn: 'Suchen in'
    },
    collectionTop: {
      sortBy: 'Sortieren nach',
      viewAs: 'Anzeigen als',
      newButton: 'Neue(r/s) %{collectionLabel}',
      ascending: 'Aufsteigend',
      descending: 'Absteigend',
      searchResults: 'Suchergebnisse für "%{searchTerm}"',
      searchResultsInCollection: 'Suchergebnisse für "%{searchTerm}" in %{collection}',
      filterBy: 'Filtern nach',
      groupBy: 'Gruppieren nach'
    },
    entries: {
      loadingEntries: 'Beiträge laden',
      cachingEntries: 'Beiträge zwischenspeichern',
      longerLoading: 'Diese Aktion kann einige Minuten in Anspruch nehmen',
      noEntries: 'Keine Beiträge'
    },
    groups: {
      other: 'Andere',
      negateLabel: 'Nicht %{label}'
    },
    defaultFields: {
      author: {
        label: 'Autor'
      },
      updatedOn: {
        label: 'Änderungsdatum'
      }
    }
  },
  editor: {
    editorControl: {
      field: {
        optional: 'optional'
      }
    },
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
        rangeMin: '%{fieldLabel} muss mindestens %{minCount} Element(e) enthalten.',
        rangeMax: '%{fieldLabel} darf maximal %{maxCount} Element(e) enthalten.',
        invalidPath: `'%{path}' ist kein gültiger Pfad`,
        pathExists: `Pfad '%{path}' existiert bereits`
      },
      i18n: {
        writingInLocale: 'Aktuelle Sprache: %{locale}',
        copyFromLocale: 'Aus anderer Sprache übernehmen',
        copyFromLocaleConfirm: 'Wollen Sie wirklich die Daten aus der Sprache %{locale} übernehmen?\nAlle bishergen Inhalte werden überschrieben.'
      }
    },
    editor: {
      onLeavePage: 'Möchten Sie diese Seite wirklich verlassen?',
      onUpdatingWithUnsavedChanges: 'Es sind noch ungespeicherte Änderungen vorhanden. Bitte speichern Sie diese, bevor Sie den Status aktualisieren.',
      onPublishingNotReady: 'Bitte setzten die den Status vor dem Veröffentlichen auf "Abgeschlossen".',
      onPublishingWithUnsavedChanges: 'Es sind noch ungespeicherte Änderungen vorhanden. Bitte speicheren Sie vor dem Veröffentlichen.',
      onPublishing: 'Soll dieser Beitrag wirklich veröffentlicht werden?',
      onUnpublishing: 'Soll die Veröffentlichung dieses Beitrags wirklich zurückgezogen werden?',
      onDeleteWithUnsavedChanges: 'Möchten Sie diesen veröffentlichten Beitrag, sowie Ihre nicht gespeicherten Änderungen löschen?',
      onDeletePublishedEntry: 'Soll dieser veröffentlichte Beitrag wirklich gelöscht werden?',
      onDeleteUnpublishedChangesWithUnsavedChanges: 'Möchten Sie diesen unveröffentlichten Beitrag, sowie Ihre nicht gespeicherten Änderungen löschen?',
      onDeleteUnpublishedChanges: 'Alle unveröffentlichten Änderungen werden gelöscht. Möchten Sie wirklich löschen?',
      loadingEntry: 'Beitrag laden...',
      confirmLoadBackup: 'Für diesen Beitrag ist ein lokales Backup vorhanden. Möchten Sie dieses benutzen?'
    },
    editorInterface: {
      toggleI18n: 'Übersetzungen',
      togglePreview: 'Vorschau',
      toggleScrollSync: 'Synchron scrollen'
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
      statusInfoTooltipDraft: 'Beitrag ist im Entwurfsstatus. Um ihn fertigzustellen und zur Überprüfung freizugeben, setzen Sie den Status auf ‘Zur Überprüfung‘.',
      statusInfoTooltipInReview: 'Beitrag wird überprüft, keine weitere Aktion erforderlich. Sie können weitere Änderungen vornehmen, während die Überprüfung läuft.',
      deleting: 'Löschen...',
      updating: 'Aktualisieren...',
      status: 'Status: %{status}',
      backCollection: 'Zurück zu allen %{collectionLabel}',
      unsavedChanges: 'Ungespeicherte Änderungen',
      changesSaved: 'Änderungen gespeichert',
      draft: 'Entwurf',
      inReview: 'Zur Überprüfung',
      ready: 'Abgeschlossen',
      publishNow: 'Jetzt veröffentlichen',
      deployPreviewPendingButtonLabel: 'Überprüfen ob eine Vorschau vorhanden ist',
      deployPreviewButtonLabel: 'Vorschau anzeigen',
      deployButtonLabel: 'Live ansehen'
    },
    editorWidgets: {
      markdown: {
        bold: 'Fett',
        italic: 'Kursiv',
        code: 'Code',
        link: 'Link',
        linkPrompt: 'Link-URL eingeben',
        headings: 'Überschriften',
        quote: 'Zitat',
        bulletedList: 'Aufzählungsliste',
        numberedList: 'Nummerierte Liste',
        addComponent: 'Komponente hinzufügen',
        richText: 'Rich Text',
        markdown: 'Markdown'
      },
      image: {
        choose: 'Wähle ein Bild',
        chooseUrl: 'Von URL hinzufügen',
        replaceUrl: 'Von URL ersetzen',
        promptUrl: 'Bild-URL eingeben',
        chooseDifferent: 'Wähle ein anderes Bild',
        remove: 'Entferne Bild'
      },
      file: {
        choose: 'Wählen Sie eine Datei',
        chooseUrl: 'Von URL hinzufügen',
        replaceUrl: 'Von URL ersetzen',
        promptUrl: 'Datei-URL eingeben',
        chooseDifferent: 'Wählen Sie eine andere Datei',
        remove: 'Datei löschen'
      },
      unknownControl: {
        noControl: "Kein Bedienelement für Widget '%{widget}'."
      },
      unknownPreview: {
        noPreview: "Keine Vorschau für Widget '%{widget}'."
      },
      headingOptions: {
        headingOne: 'Überschrift 1',
        headingTwo: 'Überschrift 2',
        headingThree: 'Überschrift 3',
        headingFour: 'Überschrift 4',
        headingFive: 'Überschrift 5',
        headingSix: 'Überschrift 6'
      },
      datetime: {
        now: 'Jetzt'
      },
      list: {
        add: '%{item} hinzufügen',
        addType: '%{item} hinzufügen'
      }
    }
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Entwurf',
      copy: 'Kopieren',
      copyUrl: 'URL kopieren',
      copyPath: 'Pfad kopieren',
      copyName: 'Name kopieren',
      copied: 'Kopiert'
    },
    mediaLibrary: {
      onDelete: 'Soll das ausgewählte Medium wirklich gelöscht werden?',
      fileTooLarge: 'Datei zu groß.\nErlaubt sind nur Dateien bis %{size} kB.'
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
      upload: 'Hochladen',
      download: 'Download',
      deleting: 'Löschen...',
      deleteSelected: 'Ausgewähltes Element löschen',
      chooseSelected: 'Ausgewähltes Element verwenden'
    }
  },
  ui: {
    default: {
      goBackToSite: 'Zurück zur Seite'
    },
    errorBoundary: {
      title: 'Fehler',
      details: 'Ein Fehler ist aufgetreten - bitte ',
      reportIt: 'berichte ihn.',
      detailsHeading: 'Details',
      privacyWarning: 'Beim Eröffnen eines Fehlerberichts werden automatisch die Fehlermeldung und Debugdaten eingefügt.\nBitte überprüfen Sie, ob die Informationen korrrekt sind und entfernen Sie ggfs. sensible Daten.',
      recoveredEntry: {
        heading: 'Wiederhergestellter Beitrag',
        warning: 'Bitte sichern Sie sich diese Informationen, bevor Sie die Seite verlassen!',
        copyButtonLabel: 'In Zwischenablage speichern'
      }
    },
    settingsDropdown: {
      logOut: 'Abmelden'
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
      onFailToUnpublishEntry: 'Veröffentlichung des Beitrags konnte nicht rückgängig gemacht werden: %{details}',
      entryUpdated: 'Beitragsstatus aktualisiert',
      onDeleteUnpublishedChanges: 'Unveröffentlichte Änderungen verworfen',
      onFailToAuth: '%{details}',
      onLoggedOut: 'Sie wurden ausgeloggt. Bitte sichern Sie Ihre Daten und melden Sie sich erneut an.',
      onBackendDown: 'Der Server ist aktuell nicht erreichbar. Für weitere Informationen, siehe: %{details}'
    }
  },
  workflow: {
    workflow: {
      loading: 'Arbeitsablauf Beiträge laden',
      workflowHeading: 'Redaktioneller Arbeitsablauf',
      newPost: 'Neuer Beitrag',
      description: '%{smart_count} Beitrag zur Überprüfung bereit, %{readyCount} bereit zur Veröffentlichung. |||| %{smart_count} Beiträge zur Überprüfung bereit, %{readyCount} bereit zur Veröffentlichung. ',
      dateFormat: 'MMMM D'
    },
    workflowCard: {
      lastChange: '%{date} von %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'von %{author}',
      deleteChanges: 'Änderungen verwerfen',
      deleteNewEntry: 'Lösche neuen Beitrag',
      publishChanges: 'Veröffentliche Änderungen',
      publishNewEntry: 'Veröffentliche neuen Beitrag'
    },
    workflowList: {
      onDeleteEntry: 'Soll dieser Beitrag wirklich gelöscht werden?',
      onPublishingNotReadyEntry: 'Nur Beiträge im Status "Abgeschlossen" können veröffentlicht werden. Bitte ziehen Sie den Beitrag in die "Abgeschlossen" Spalte um die Veröffentlichung zu aktivieren.',
      onPublishEntry: 'Soll dieser Beitrag wirklich veröffentlicht werden soll?',
      draftHeader: 'Entwurf',
      inReviewHeader: 'In Prüfung',
      readyHeader: 'Abgeschlossen',
      currentEntries: '%{smart_count} Beitrag |||| %{smart_count} Beiträge'
    }
  }
};
var _default = de;
exports.default = _default;