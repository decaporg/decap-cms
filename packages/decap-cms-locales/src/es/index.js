const es = {
  auth: {
    login: 'Iniciar sesión',
    loggingIn: 'Iniciando sesión...',
    loginWithNetlifyIdentity: 'Iniciar sesión con Netlify Identity',
    loginWithBitbucket: 'Iniciar sesión con Bitbucket',
    loginWithGitHub: 'Iniciar sesión con GitHub',
    loginWithGitLab: 'Iniciar sesión con GitLab',
    errors: {
      email: 'Asegúrate de introducir tu correo electrónico.',
      password: 'Por favor introduce tu contraseña.',
      identitySettings:
        'No se pudo acceder a la configuración de Identity. Cuando uses el backend git-gateway asegurate de habilitar el servicio Identity y Git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Contenido',
      workflow: 'Flujo Editorial',
      media: 'Medios',
      quickAdd: 'Añadir rápido',
    },
    app: {
      errorHeader: 'Error al cargar la configuración del CMS',
      configErrors: 'Errores de configuración',
      checkConfigYml: 'Compruebe el archivo config.yml.',
      loadingConfig: 'Cargando configuración....',
      waitingBackend: 'Esperando al servidor...',
    },
    notFoundPage: {
      header: 'No encontrado',
    },
  },
  collection: {
    sidebar: {
      collections: 'Colecciones',
      searchAll: 'Buscar todas',
    },
    collectionTop: {
      sortBy: 'Ordenar por',
      viewAs: 'Ver como',
      newButton: 'Nuevo %{collectionLabel}',
      ascending: 'Ascendente',
      descending: 'Descendente',
    },
    entries: {
      loadingEntries: 'Cargando entradas',
      cachingEntries: 'Almacenando entradas en caché',
      longerLoading: 'Esto puede tardar varios minutos',
      noEntries: 'Ninguna entrada',
    },
    defaultFields: {
      author: {
        label: 'Autor',
      },
      updatedOn: {
        label: 'Actualizado en',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'opcional',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} es obligatorio.',
        regexPattern: '%{fieldLabel} no coincide con el patrón: %{pattern}.',
        processing: '%{fieldLabel} está procesando.',
        range: '%{fieldLabel} debe estar entre %{minValue} y %{maxValue}.',
        min: '%{fieldLabel} debe ser por lo menos %{minValue}.',
        max: '%{fieldLabel} debe ser %{maxValue} o menos.',
        rangeCount: '%{fieldLabel} debe tener entre %{minCount} y %{maxCount} elemento(s).',
        rangeCountExact: '%{fieldLabel} debe tener exactamente %{count} elemento(s).',
        rangeMin: '%{fieldLabel} debe ser por lo menos %{minCount} elemento(s).',
        rangeMax: '%{fieldLabel} debe ser %{maxCount} o menos elemento(s).',
      },
    },
    editor: {
      onLeavePage: '¿Estás seguro de que quieres dejar esta página?',
      onUpdatingWithUnsavedChanges:
        'Tiene cambios no guardados, por favor, guárdelos antes de actualizar el estado.',
      onPublishingNotReady: 'Por favor, actualice el estado a "Ready" antes de publicar.',
      onPublishingWithUnsavedChanges:
        'Tiene cambios no guardados, por favor guárdelos antes de publicarlos.',
      onPublishing: '¿Estás seguro de que quieres publicar esta entrada?',
      onUnpublishing: '¿Estás seguro de que quieres retirar esta entrada?',
      onDeleteWithUnsavedChanges:
        '¿Está seguro de que desea eliminar esta entrada publicada, así como los cambios no guardados de la sesión actual?',
      onDeletePublishedEntry: '¿Estás seguro de que quieres borrar esta entrada publicada?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Esto eliminará todos los cambios no publicados de esta entrada, así como los cambios no guardados de la sesión actual. ¿Todavía quieres borrar?',
      onDeleteUnpublishedChanges:
        'Todos los cambios no publicados en esta entrada serán eliminados. ¿Todavía quieres borrar?',
      loadingEntry: 'Cargando entrada...',
      confirmLoadBackup:
        'Se recuperó una copia de seguridad local para esta entrada, ¿le gustaría utilizarla?',
    },
    editorToolbar: {
      publishing: 'Publicando...',
      publish: 'Publicar',
      published: 'Publicado',
      unpublish: 'Retirar',
      duplicate: 'Duplicar',
      unpublishing: 'Retirando...',
      publishAndCreateNew: 'Publicar y crear nuevo',
      publishAndDuplicate: 'Publicar y duplicar',
      deleteUnpublishedChanges: 'Eliminar cambios no publicados',
      deleteUnpublishedEntry: 'Eliminar entrada no publicada',
      deletePublishedEntry: 'Eliminar entrada publicada',
      deleteEntry: 'Eliminar entrada',
      saving: 'Guardando...',
      save: 'Guardar',
      deleting: 'Eliminando...',
      updating: 'Actualizando...',
      status: 'Estado: %{status}',
      backCollection: ' Escribiendo en la colección %{collectionLabel}',
      unsavedChanges: 'Cambios no guardados',
      changesSaved: 'Cambios guardados',
      draft: 'Borrador',
      inReview: 'En revisión',
      ready: 'Listo',
      publishNow: 'Publicar ahora',
      deployPreviewPendingButtonLabel: 'Comprobar Vista Previa',
      deployPreviewButtonLabel: 'Ver Vista Previa',
      deployButtonLabel: 'Ver publicación',
    },
    editorWidgets: {
      markdown: {
        richText: 'Texto enriquecido',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Elige una imagen',
        chooseDifferent: 'Elige una imagen diferente',
        remove: 'Quita la imagen',
      },
      file: {
        choose: 'Escoge un archivo',
        chooseDifferent: 'Elige un archivo diferente',
        remove: 'Remover archivo',
      },
      unknownControl: {
        noControl: "No existe un control para el widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "No existe una vista previa para el widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Encabezado 1',
        headingTwo: 'Encabezado 2',
        headingThree: 'Encabezado 3',
        headingFour: 'Encabezado 4',
        headingFive: 'Encabezado 5',
        headingSix: 'Encabezado 6',
      },
      datetime: {
        now: 'Ahora',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Borrador',
    },
    mediaLibrary: {
      onDelete: '¿Está seguro de que desea eliminar el archivo seleccionado?',
      fileTooLarge:
        'Archivo muy pesado.\nConfigurado para no permitir archivos más pesados que %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Cargando...',
      noResults: 'Sin resultados.',
      noAssetsFound: 'Archivos no encontrados.',
      noImagesFound: 'Imágenes no encontradas.',
      private: 'Privado ',
      images: 'Imágenes',
      mediaAssets: 'Archivos multimedia',
      search: 'Buscar...',
      uploading: 'Subiendo...',
      upload: 'Subir nuevo',
      download: 'Descargar',
      deleting: 'Eliminando...',
      deleteSelected: 'Eliminar selección',
      chooseSelected: 'Confirmar selección',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Regresar al sitio',
    },
    errorBoundary: {
      title: 'Error',
      details: 'Se ha producido un error - por favor ',
      reportIt: 'infórmenos de ello.',
      detailsHeading: 'Detalles',
      privacyWarning:
        'Abrir un reporte lo rellena previamente con el mensaje de error y los datos de depuración.\nPor favor verifica que la información es correcta y elimina cualquier dato sensible.',
      recoveredEntry: {
        heading: 'Documento recuperado',
        warning: '¡Por favor, copie/pegue esto en algún lugar antes de ir a otra página!',
        copyButtonLabel: 'Copiar al portapapeles',
      },
    },
    settingsDropdown: {
      logOut: 'Cerrar sesión',
    },
    toast: {
      onFailToLoadEntries: 'No se ha podido cargar la entrada: %{details}',
      onFailToLoadDeployPreview: 'No se ha podido cargar la vista previa: %{details}',
      onFailToPersist: 'No se ha podido guardar la entrada: %{details}',
      onFailToDelete: 'No se ha podido borrar la entrada: %{details}',
      onFailToUpdateStatus: 'No se ha podido actualizar el estado: %{details}',
      missingRequiredField:
        'Oops, no ha rellenado un campo obligatorio. Por favor, rellénelo antes de guardar.',
      entrySaved: 'Entrada guardada',
      entryPublished: 'Entrada publicada',
      entryUnpublished: 'Entrada retirada',
      onFailToPublishEntry: 'No se ha podido publicar: %{details}',
      onFailToUnpublishEntry: 'No se ha podido retirar la entrada: %{details}',
      entryUpdated: 'Estado de entrada actualizado',
      onDeleteUnpublishedChanges: 'Cambios no publicados eliminados',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Cargando Entradas del Flujo Editorial',
      workflowHeading: 'Flujo Editorial',
      newPost: 'Nuevo artículo',
      description:
        '%{smart_count} entrada esperando revisión, %{readyCount} lista para publicar |||| %{smart_count} entradas esperando revisión, %{readyCount} listas para publicar. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} por %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'por %{author}',
      deleteChanges: 'Eliminar cambios',
      deleteNewEntry: 'Eliminar nueva entrada',
      publishChanges: 'Publicar cambios',
      publishNewEntry: 'Publicar nueva entrada',
    },
    workflowList: {
      onDeleteEntry: '¿Está seguro de que quiere borrar esta entrada?',
      onPublishingNotReadyEntry:
        'Sólo se pueden publicar los elementos con el estado "Listo". Por favor, arrastre la tarjeta hasta la columna "Listo" para permitir la publicación.',
      onPublishEntry: '¿Estás seguro de que quieres publicar esta entrada?',
      draftHeader: 'Borradores',
      inReviewHeader: 'En revisión',
      readyHeader: 'Listo',
      currentEntries: '%{smart_count} entrada |||| %{smart_count} entradas',
    },
  },
};

export default es;
