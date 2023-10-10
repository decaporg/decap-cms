"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const fr = {
  auth: {
    login: 'Se connecter',
    loggingIn: 'Connexion en cours...',
    loginWithNetlifyIdentity: 'Se connecter avec Netlify Identity',
    loginWithAzure: 'Se connecter avec Azure',
    loginWithBitbucket: 'Se connecter avec Bitbucket',
    loginWithGitHub: 'Se connecter avec GitHub',
    loginWithGitLab: 'Se connecter avec GitLab',
    errors: {
      email: "Assurez-vous d'avoir entré votre email.",
      password: 'Merci de saisir votre mot de passe.',
      identitySettings: "Impsosible d'accéder aux paramètres d'identité. Si vous utilisez le backend git-gateway, merci de vous assurer que vous avez bien activé le service Identity et la passerelle Git."
    }
  },
  app: {
    header: {
      content: 'Contenus',
      workflow: 'Flux',
      media: 'Media',
      quickAdd: 'Ajout rapide'
    },
    app: {
      errorHeader: 'Erreur au chargement de la configuration du CMS',
      configErrors: 'Erreurs de configuration',
      checkConfigYml: 'Vérifiez votre fichier config.yml.',
      loadingConfig: 'Chargement de la configuration...',
      waitingBackend: 'En attente du serveur...'
    },
    notFoundPage: {
      header: 'Introuvable'
    }
  },
  collection: {
    sidebar: {
      collections: 'Collections',
      allCollections: 'Toutes les collections',
      searchAll: 'Tout rechercher',
      searchIn: 'Rechercher dans'
    },
    collectionTop: {
      sortBy: 'Trier par',
      viewAs: 'Voir comme',
      newButton: 'Créer une entrée de type %{collectionLabel}',
      ascending: 'Croissant',
      descending: 'Décroissant',
      searchResults: 'Résultats de la recherche pour "%{searchTerm}"',
      searchResultsInCollection: 'Résultats de la recherche pour "%{searchTerm}" dans %{collection}',
      filterBy: 'Filtrer par',
      groupBy: 'Grouper par'
    },
    entries: {
      loadingEntries: 'Chargement des entrées',
      cachingEntries: 'Mise en cache des entrées',
      longerLoading: 'Cela peut prendre quelques minutes',
      noEntries: 'Aucune entrée'
    },
    groups: {
      other: 'Autre',
      negateLabel: 'Non %{label}'
    },
    defaultFields: {
      author: {
        label: 'Auteur'
      },
      updatedOn: {
        label: 'Mis à jour le'
      }
    }
  },
  editor: {
    editorControl: {
      field: {
        optional: 'optionnel'
      }
    },
    editorControlPane: {
      widget: {
        required: 'Le champ %{fieldLabel} est requis.',
        regexPattern: 'Le champ %{fieldLabel} ne correspond pas au schéma: %{pattern}.',
        processing: 'Le champ %{fieldLabel} est en cours de traitement.',
        range: 'Le champ %{fieldLabel} doit être compris entre %{minValue} et %{maxValue}.',
        min: 'Le champ %{fieldLabel} doit avoir une valeur de %{minValue} ou plus.',
        max: 'Le champ %{fieldLabel} doit avoir une valeur de %{maxValue} ou moins.',
        rangeCount: '%{fieldLabel} doit avoir entre %{minCount} et %{maxCount} élément(s).',
        rangeCountExact: '%{fieldLabel} doit avoir exactement %{count} éléments(s).',
        rangeMin: '%{fieldLabel} doit avoir au moins %{minCount} éléments(s).',
        rangeMax: '%{fieldLabel} doit avoir %{maxCount} éléments(s) ou moins.',
        invalidPath: `'%{path}' n'est pas un chemin valide`,
        pathExists: `Le chemin '%{path}' existe déjà`
      },
      i18n: {
        writingInLocale: 'Écrire en %{locale}'
      }
    },
    editor: {
      onLeavePage: 'Voulez-vous vraiment quitter cette page ?',
      onUpdatingWithUnsavedChanges: 'Veuillez enregistrer vos modifications avant de mettre à jour le statut.',
      onPublishingNotReady: 'Veuillez mettre à jour le statut à "Prêt" avant de publier.',
      onPublishingWithUnsavedChanges: 'Veuillez enregistrer vos modifications avant de publier.',
      onPublishing: 'Voulez-vous vraiment publier cette entrée ?',
      onUnpublishing: 'Voulez-vous vraiment dépublier cette entrée ?',
      onDeleteWithUnsavedChanges: 'Voulez-vous vraiment supprimer cette entrée publiée ainsi que vos modifications non enregistrées de cette session ?',
      onDeletePublishedEntry: 'Voulez-vous vraiment supprimer cette entrée publiée ?',
      onDeleteUnpublishedChangesWithUnsavedChanges: 'Ceci supprimera toutes les modifications non publiées de cette entrée ainsi que vos modifications non enregistrées de cette session. Voulez-vous toujours supprimer ?',
      onDeleteUnpublishedChanges: 'Toutes les modifications non publiées de cette entrée seront supprimées. Voulez-vous toujours supprimer ?',
      loadingEntry: "Chargement de l'entrée...",
      confirmLoadBackup: "Une sauvegarde locale a été trouvée pour cette entrée. Voulez-vous l'utiliser ?"
    },
    editorInterface: {
      toggleI18n: 'Édition multilingue',
      togglePreview: 'Aperçu',
      toggleScrollSync: 'Défilement synchronisé'
    },
    editorToolbar: {
      publishing: 'Publication...',
      publish: 'Publier',
      published: 'Publiée',
      unpublish: 'Dépublier',
      duplicate: 'Dupliquer',
      unpublishing: 'Dépublication...',
      publishAndCreateNew: 'Publier et créer une nouvelle entrée',
      publishAndDuplicate: 'Publier et dupliquer',
      deleteUnpublishedChanges: 'Supprimer les modications non publiées',
      deleteUnpublishedEntry: "Supprimer l'entrée non publiée",
      deletePublishedEntry: "Supprimer l'entrée publiée",
      deleteEntry: "Supprimer l'entrée",
      saving: 'Enregistrement...',
      save: 'Enregistrer',
      deleting: 'Suppression...',
      updating: 'Mise à jour...',
      status: 'Statut: %{status}',
      backCollection: ' Écriture dans la collection %{collectionLabel}',
      unsavedChanges: 'Modifications non enregistrées',
      changesSaved: 'Modifications enregistrées',
      draft: 'Brouillon',
      inReview: 'En cours de révision',
      ready: 'Prêt',
      publishNow: 'Publier maintenant',
      deployPreviewPendingButtonLabel: "Vérifier l'aperçu",
      deployPreviewButtonLabel: "Voir l'aperçu",
      deployButtonLabel: 'Voir en direct'
    },
    editorWidgets: {
      markdown: {
        bold: 'Gras',
        italic: 'Italique',
        code: 'Code',
        link: 'Lien',
        linkPrompt: "Entrer l'adresse web du lien",
        headings: 'Titres',
        quote: 'Citation',
        bulletedList: 'Liste à puces',
        numberedList: 'Liste numérotée',
        addComponent: 'Ajouter un composant',
        richText: 'Texte enrichi',
        markdown: 'Markdown'
      },
      image: {
        choose: 'Choisir une image',
        chooseUrl: 'Insérer depuis une adresse web',
        replaceUrl: 'Remplacer depuis une adresse web',
        promptUrl: "Entrer l'adresse web de l'image",
        chooseDifferent: 'Choisir une image différente',
        remove: "Supprimer l'image"
      },
      file: {
        choose: 'Choisir un fichier',
        chooseUrl: 'Insérer depuis une adresse web',
        replaceUrl: 'Remplacer depuis une adresse web',
        promptUrl: "Entrer l'adresse web du fichier",
        chooseDifferent: 'Choisir un fichier différent',
        remove: 'Effacer le fichier'
      },
      unknownControl: {
        noControl: "Pas de contrôle pour le gadget '%{widget}'."
      },
      unknownPreview: {
        noPreview: "Pas d'aperçu pour le gadget '%{widget}'."
      },
      headingOptions: {
        headingOne: 'Titre 1',
        headingTwo: 'Titre 2',
        headingThree: 'Titre 3',
        headingFour: 'Titre 4',
        headingFive: 'Titre 5',
        headingSix: 'Titre 6'
      },
      datetime: {
        now: 'Maintenant'
      },
      list: {
        add: 'Ajouter %{item}',
        addType: 'Ajouter une entrée de type %{item}'
      }
    }
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Brouillon',
      copy: 'Copier',
      copyUrl: "Copier l'adresse web",
      copyPath: "Copier le chemin d'accès",
      copyName: 'Copier le nom',
      copied: 'Copié'
    },
    mediaLibrary: {
      onDelete: 'Voulez-vous vraiment supprimer la ressource sélectionné ?',
      fileTooLarge: "Le fichier est trop volumineux.\nL'instance est configurée pour bloquer les envois de plus de %{size} kB."
    },
    mediaLibraryModal: {
      loading: 'Chargement...',
      noResults: 'Aucun résultat.',
      noAssetsFound: 'Aucune ressource trouvée.',
      noImagesFound: 'Aucune image trouvée.',
      private: 'Privé ',
      images: 'Images',
      mediaAssets: 'Ressources',
      search: 'Recherche...',
      uploading: 'Téléversement...',
      upload: 'Téléverser une nouvelle ressource',
      download: 'Télécharger',
      deleting: 'Suppression...',
      deleteSelected: 'Supprimer les éléments sélectionnés',
      chooseSelected: 'Choisir les éléments sélectionnés'
    }
  },
  ui: {
    default: {
      goBackToSite: 'Retourner sur le site'
    },
    errorBoundary: {
      title: 'Erreur',
      details: 'Une erreur est survenue, veuillez ',
      reportIt: 'la signaler sur GitHub.',
      detailsHeading: 'Détails',
      privacyWarning: "Ouvrir une issue la préremplie avec le message d'erreur et des données de déboggage.\nMerci de vérifier l'exactitude des informations et de supprimer toute donnée sensible si nécessaire.",
      recoveredEntry: {
        heading: 'Document récupéré',
        warning: 'Veuillez copier/coller ceci quelque part avant de naviguer ailleurs!',
        copyButtonLabel: 'Copier dans le presse-papier'
      }
    },
    settingsDropdown: {
      logOut: 'Déconnexion'
    },
    toast: {
      onFailToLoadEntries: "Échec du chargement de l'entrée : %{details}",
      onFailToLoadDeployPreview: "Échec du chargement de l'aperçu : %{details}",
      onFailToPersist: "Échec de l'enregistrement de l'entrée : %{details}",
      onFailToDelete: "Échec de la suppression de l'entrée : %{details}",
      onFailToUpdateStatus: 'Échec de la mise à jour du statut : %{details}',
      missingRequiredField: 'Oops, il manque un champ requis. Veuillez le renseigner avant de soumettre.',
      entrySaved: 'Entrée enregistrée',
      entryPublished: 'Entrée publiée',
      entryUnpublished: 'Entrée dépubliée',
      onFailToPublishEntry: 'Échec de la publication : %{details}',
      onFailToUnpublishEntry: "Impossible de dépublier l'entrée : %{details}",
      entryUpdated: "Statut de l'entrée mis à jour",
      onDeleteUnpublishedChanges: 'Modifications non publiées supprimées',
      onFailToAuth: '%{details}',
      onLoggedOut: 'Vous avez été déconnecté, merci de sauvegarder les données et vous reconnecter',
      onBackendDown: "Le serveur est actuellement hors-service. Pour plus d'informations : %{details}"
    }
  },
  workflow: {
    workflow: {
      loading: 'Chargement des entrées du flux éditorial',
      workflowHeading: 'Flux éditorial',
      newPost: 'Nouvel article',
      description: '%{smart_count} entrée(s) en attente de revue, %{readyCount} prête(s) à être publiée(s). |||| %{smart_count} entrée(s) en attente de revue, %{readyCount} prête(s) à être publiée(s). ',
      dateFormat: 'MMMM D'
    },
    workflowCard: {
      lastChange: '%{date} par %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'par %{author}',
      deleteChanges: 'Supprimer les mofications',
      deleteNewEntry: 'Supprimer la nouvelle entrée',
      publishChanges: 'Publier les modifications',
      publishNewEntry: 'Publier la nouvelle entrée'
    },
    workflowList: {
      onDeleteEntry: 'Voulez-vous vraiment supprimer cette entrée ?',
      onPublishingNotReadyEntry: 'Seuls les éléments ayant le statut "Prêt" peuvent être publiés. Veuillez glisser/déposer la carte dans la colonne "Prêt" pour activer la publication',
      onPublishEntry: 'Voulez-vous vraiment publier cette entrée ?',
      draftHeader: 'Brouillons',
      inReviewHeader: 'En cours de révision',
      readyHeader: 'Prêt',
      currentEntries: '%{smart_count} entrée |||| %{smart_count} entrées'
    }
  }
};
var _default = fr;
exports.default = _default;