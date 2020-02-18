const nl = {
  auth: {
    login: 'Inloggen',
    loggingIn: 'Inloggen...',
    loginWithNetlifyIdentity: 'Inloggen met Netlify Identity',
    loginWithBitbucket: 'Inloggen met Bitbucket',
    loginWithGitHub: 'Inloggen met GitHub',
    loginWithGitLab: 'Inloggen met GitLab',
    errors: {
      email: 'Voer uw email in.',
      password: 'Voer uw wachtwoord in.',
      identitySettings:
        'Netlify Identity instellingen niet gevonden. Wanneer u git-gateway als backend gebruikt moet u de Identity service en Git Gateway activeren in uw Netlify instellingen.',
    },
  },
  app: {
    header: {
      content: 'Inhoud',
      workflow: 'Workflow',
      media: 'Media',
      quickAdd: 'Snel toevoegen',
    },
    app: {
      errorHeader: 'Fout bij het laden van de CMS configuratie',
      configErrors: 'configuratiefouten',
      checkConfigYml: 'Controleer je config.yml bestand',
      loadingConfig: 'Configuatie laden...',
      waitingBackend: 'Wachten op server...',
    },
    notFoundPage: {
      header: 'Niet gevonden',
    },
  },
  collection: {
    sidebar: {
      collections: 'Inhoudstypen',
      searchAll: 'Zoeken',
    },
    collectionTop: {
      viewAs: 'Bekijk als',
      newButton: 'Nieuwe %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Items laden',
      cachingEntries: 'Items cachen',
      longerLoading: 'Dit kan een paar minuten duren',
    },
  },
  editor: {
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} is vereist.',
        regexPattern: '%{fieldLabel} komt niet overeen met het patroon: %{pattern}.',
        processing: '%{fieldLabel} wordt verwerkt.',
        range: '%{fieldLabel} moet tussen %{minValue} en %{maxValue} liggen.',
        min: '%{fieldLabel} moet tenminste %{minValue} bevatten.',
        max: '%{fieldLabel} moet hoogstens %{maxValue} bevatten.',
        rangeCount: '%{fieldLabel} moet tussen %{minCount} en %{maxCount} item(s) bevatten.',
        rangeCountExact: '%{fieldLabel} moet exact %{count} item(s) bevatten.',
        minCount: '%{fieldLabel} moet tenminste %{minCount} item(s) bevatten.',
        maxCount: '%{fieldLabel} moet hoogstens %{maxCount} item(s) bevatten.',
      },
    },
    editor: {
      onLeavePage: 'Weet je zeker dat je deze pagina wilt verlaten?',
      onUpdatingWithUnsavedChanges:
        'Er zijn nog niet-opgeslagen wijzigingen. Bewaar ze voordat u de status bijwerkt.',
      onPublishingNotReady: 'Stel de status in op "Voltooid" voordat u publiceert.',
      onPublishingWithUnsavedChanges:
        'Er zijn nog niet-opgeslagen wijzigingen. Bewaar deze voordat u publiceert.',
      onPublishing: 'Weet u zeker dat u dit item wil publiceren?',
      onDeleteWithUnsavedChanges:
        'Weet u zeker dat u dit gepubliceerde item en uw niet-opgeslagen wijzigingen uit de huidige sessie wilt verwijderen?',
      onDeletePublishedEntry: 'Weet u zeker dat u dit gepubliceerde item wilt verwijderen?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Alle niet-gepubliceerde wijzigingen in dit item worden verwijderd, evenals uw niet-opgeslagen wijzigingen uit de huidige sessie. Wilt u nog steeds verwijderen?',
      onDeleteUnpublishedChanges:
        'Alle niet-gepubliceerde wijzigingen in dit item worden verwijderd. Wilt u nog steeds verwijderen?',
      loadingEntry: 'Item laden...',
      confirmLoadBackup: 'Voor dit item is een lokale back-up hersteld, wilt u deze gebruiken?',
    },
    editorToolbar: {
      publishing: 'Publiceren...',
      publish: 'Publiceer',
      published: 'Gepubliceerd',
      unpublish: 'Publicatie terugtrekken',
      unpublished: 'Publicatie teruggetrokken',
      duplicate: 'Dupliceren',
      unpublishing: 'Publicatie ongedaan maken...',
      publishAndCreateNew: 'Publiceer en maak nieuw item aan',
      publishAndDuplicate: 'Publiceer en dupliceer item',
      deleteUnpublishedChanges: 'Verwijder niet-gepubliceerde wijzigingen',
      deleteUnpublishedEntry: 'Niet-gepubliceerd item verwijderen',
      deletePublishedEntry: 'Gepubliceerd item verwijderen',
      deleteEntry: 'Item verwijderen',
      saving: 'Opslaan...',
      save: 'Opslaan',
      deleting: 'Verwijderen...',
      updating: 'Bijwerken...',
      setStatus: 'Stel status in',
      backCollection: ' Terug naar %{collectionLabel}',
      unsavedChanges: 'Niet-opgeslagen wijzigingen',
      changesSaved: 'Wijzigingen opgeslagen',
      draft: 'Concept',
      inReview: 'Wordt beoordeeld',
      ready: 'Klaar',
      publishNow: 'Publiceer nu',
      deployPreviewPendingButtonLabel: 'Controleer of voorvertoning geladen is',
      deployPreviewButtonLabel: 'Bekijk voorvertoning',
      deployButtonLabel: 'Bekijk Live',
    },

    editorWidgets: {
      markdown: {
        richText: 'Rijke tekst',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Kies een afbeelding',
        chooseDifferent: 'Kies een andere afbeelding',
        remove: 'Verwijder afbeelding',
      },
      file: {
        choose: 'Kies een bestand',
        chooseDifferent: 'Kies een ander bestand',
        remove: 'Verwijder bestand',
      },
      unknownControl: {
        noControl: "Geen control voor widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Geen voorvertoning voor widget '%{widget}'.",
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Concept',
    },
    mediaLibrary: {
      onDelete: 'Weet u zeker dat u de geselecteerde media wilt verwijderen?',
      fileTooLarge:
        'Het bestand is te groot.\n De instellingen staan geen bestanden toe groter dan %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Laden...',
      noResults: 'Geen resultaten.',
      noAssetsFound: 'Geen media gevonden.',
      noImagesFound: 'Geen afbeeldingen gevonden.',
      private: 'Privé',
      mediaAssets: 'Media',
      search: 'Zoeken...',
      uploading: 'Uploaden...',
      uploadNew: 'Nieuwe uploaden',
      deleting: 'Verwijderen...',
      deleteSelected: 'Verwijder selectie',
      chooseSelected: 'Gebruik selectie',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Fout',
      details: 'Er is een fout opgetreden - ',
      reportIt: 'maak er alstublieft een melding van.',
      detailsHeading: 'Details',
      recoveredEntry: {
        heading: 'Hersteld document',
        warning: 'Kopieer / plak dit ergens voordat u weggaat!',
        copyButtonLabel: 'Kopieer naar klembord',
      },
    },
    settingsDropdown: {
      logOut: 'Uitloggen',
    },
    toast: {
      onFailToLoadEntries: 'Kan item niet laden: %{details}',
      onFailToLoadDeployPreview: 'Kan voorvertoning niet laden: %{details}',
      onFailToPersist: 'Kan item niet opslaan: %{details}',
      onFailToDelete: 'Kan item niet verwijderen: %{details}',
      onFailToUpdateStatus: 'Kan status niet updaten: %{details}',
      missingRequiredField: 'Oeps, sommige verplichte velden zijn niet ingevuld.',
      entrySaved: 'Item opgeslagen',
      entryPublished: 'Item gepubliceerd',
      onFailToPublishEntry: 'Kan item niet publiceren: %{details}',
      entryUpdated: 'Status van item geüpdatet',
      onDeleteUnpublishedChanges: 'Niet-gepubliceerde wijzigingen verwijderd',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Redactionele Workflow items laden',
      workflowHeading: 'Redactionele Workflow',
      newPost: 'Nieuw bericht',
      description:
        '%{smart_count} item wacht op beoordeling, %{readyCount} klaar om live te gaan. |||| %{smart_count} items wachten op beoordeling, %{readyCount} klaar om live te gaan. ',
    },
    workflowCard: {
      lastChange: '%{date} door %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'door %{author}',
      deleteChanges: 'Verwijder wijzigingen',
      deleteNewEntry: 'Verwijder nieuw item',
      publishChanges: 'Publiceer wijzigingen',
      publishNewEntry: 'Publiceer nieuw item',
    },
    workflowList: {
      onDeleteEntry: 'Weet u zeker dat u dit item wilt verwijderen?',
      onPublishingNotReadyEntry:
        'Alleen items met de status "Gereed" kunnen worden gepubliceerd. Sleep de kaart naar de kolom "Gereed" om publiceren mogelijk te maken.',
      onPublishEntry: 'Weet u zeker dat u dit item wilt publiceren?',
      draftHeader: 'Concepten',
      inReviewHeader: 'Wordt beoordeeld',
      readyHeader: 'Klaar',
      currentEntries: '%{smart_count} item |||| %{smart_count} items',
    },
  },
};

export default nl;
