const ru = {
  app: {
    header: {
      content: 'Записи',
      workflow: 'Документооборот',
      media: 'Медиафайлы',
      quickAdd: 'Быстрое добавление',
    },
    app: {
      errorHeader: 'Ошибка загрузки конфигурации CMS',
      configErrors: 'Ошибки конфигурации',
      checkConfigYml: 'Проверьте свой config.yml файл.',
      loadingConfig: 'Загрузка конфигурации…',
      waitingBackend: 'Ожидание ответа от бэкенда…',
    },
    notFoundPage: {
      header: 'Не найден',
    },
  },
  collection: {
    sidebar: {
      collections: 'Коллекции',
      searchAll: 'Искать повсюду',
    },
    collectionTop: {
      viewAs: 'Вид',
      newButton: 'Создать %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Загрузка записей…',
      cachingEntries: 'Кэширование записей…',
      longerLoading: 'Это может занять несколько минут',
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'необязательный',
      },
    },
    editorControlPane: {
      widget: {
        required: 'Необходимо указать значение поля %{fieldLabel}.',
        regexPattern: 'Значение поля %{fieldLabel} не соответствует шаблону: %{pattern}.',
        processing: 'Значение поля %{fieldLabel} обрабатывается…',
        range: 'Значение поля %{fieldLabel} должно быть между %{minValue} и %{maxValue}.',
        min: 'Значение поля %{fieldLabel} должно быть не менее %{minValue}.',
        max: 'Значение поля %{fieldLabel} должно быть %{maxValue} или менее.',
      },
    },
    editor: {
      onLeavePage: 'Вы уверены, что хотите покинуть эту страницу?',
      onUpdatingWithUnsavedChanges:
        'У вас есть несохраненные изменения, сохраните их перед обновлением статуса.',
      onPublishingNotReady: 'Пожалуйста, измените статус на «Готов» перед публикацией.',
      onPublishingWithUnsavedChanges:
        'У вас есть несохраненные изменения, сохраните их перед публикацией.',
      onPublishing: 'Вы уверены, что хотите опубликовать эту запись?',
      onUnpublishing: 'Вы уверены, что хотите отменить публикацию этой записи?',
      onDeleteWithUnsavedChanges:
        'Вы уверены, что хотите удалить эту опубликованную запись, а также несохраненные изменения из текущего сеанса?',
      onDeletePublishedEntry: 'Вы уверены, что хотите удалить эту опубликованную запись?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Это удалит все неопубликованные изменения в этой записи, а также ваши несохраненные изменения из текущего сеанса. Вы все еще хотите удалить?',
      onDeleteUnpublishedChanges:
        'Все неопубликованные изменения в этой записи будут удалены. Вы все еще хотите удалить?',
      loadingEntry: 'Загрузка записи…',
      confirmLoadBackup:
        'Для этой записи была восстановлена локальная резервная копия, хотите ли вы ее использовать?',
    },
    editorToolbar: {
      publishing: 'Публикация…',
      publish: 'Опубликовать',
      published: 'Опубликовано',
      unpublish: 'Отменить публикацию',
      unpublishing: 'Отмена публикации…',
      publishAndCreateNew: 'Опубликовать и создать новую',
      deleteUnpublishedChanges: 'Удалить неопубликованные изменения',
      deleteUnpublishedEntry: 'Удалить неопубликованную запись',
      deletePublishedEntry: 'Удалить опубликованную запись',
      deleteEntry: 'Удалить запись',
      saving: 'Сохранение…',
      save: 'Сохранить',
      deleting: 'Удаление…',
      updating: 'Обновление…',
      setStatus: 'Установить статус',
      backCollection: 'Запись в коллекцию %{collectionLabel}',
      unsavedChanges: 'Несохраненные изменения',
      changesSaved: 'Изменения сохранены',
      draft: 'Черновик',
      inReview: 'На рассмотрении',
      ready: 'Одобрен',
      publishNow: 'Опубликовать сейчас',
      deployPreviewPendingButtonLabel: 'Проверить предварительный просмотр',
      deployPreviewButtonLabel: 'Предварительный просмотр',
      deployButtonLabel: 'Просмотр',
    },
    editorWidgets: {
      image: {
        choose: 'Выберите изображение',
        chooseDifferent: 'Выберите другое изображение',
        remove: 'Удалить изображение',
      },
      file: {
        choose: 'Выберите файл',
        chooseDifferent: 'Выберите другой файл',
        remove: 'Удалить файл',
      },
      unknownControl: {
        noControl: "Нет контрола для виджета '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Нет превью для виджета '%{widget}'.",
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
      draft: 'Черновик',
    },
    mediaLibrary: {
      onDelete: 'Вы уверены, что хотите удалить выбранный медиафайл?',
    },
    mediaLibraryModal: {
      loading: 'Загрузка медифайлов…',
      noResults: 'Нет результатов.',
      noAssetsFound: 'Ресурсы не найдены.',
      noImagesFound: 'Изображения не найдены.',
      private: 'Приватные ',
      images: 'Изображения',
      mediaAssets: 'Медиаресурсы',
      search: 'Идёт поиск…',
      uploading: 'Загрузка…',
      uploadNew: 'Загрузить новый',
      deleting: 'Удаление…',
      deleteSelected: 'Удалить помеченные',
      chooseSelected: 'Выбрать помеченные',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Ошибка',
      details: 'Произошла ошибка. Пожалуйста, ',
      reportIt: 'сообщите о ней.',
      detailsHeading: 'Подробности',
      recoveredEntry: {
        heading: 'Восстановленный документ',
        warning: 'Пожалуйста, скопируйте это сообщение куда-нибудь, прежде чем уйти со страницы!',
        copyButtonLabel: 'Скопировать в буфер обмена',
      },
    },
    settingsDropdown: {
      logOut: 'Выйти',
    },
    toast: {
      onFailToLoadEntries: 'Не удалось загрузить запись: %{details}',
      onFailToLoadDeployPreview: 'Не удалось загрузить превью: %{details}',
      onFailToPersist: 'Не удалось сохранить запись: %{details}',
      onFailToDelete: 'Не удалось удалить запись: %{details}',
      onFailToUpdateStatus: 'Не удалось обновить статус: %{details}',
      missingRequiredField:
        'К сожалению, вы пропустили обязательное поле. Пожалуйста, заполните перед сохранением.',
      entrySaved: 'Запись сохранена',
      entryPublished: 'Запись опубликована',
      entryUnpublished: 'Публикация записи отменена',
      onFailToPublishEntry: 'Не удалось опубликовать запись: %{details}',
      onFailToUnpublishEntry: 'Не удалось отменить публикацию записи: %{details}',
      entryUpdated: 'Статус записи обновлен',
      onDeleteUnpublishedChanges: 'Неопубликованные изменения удалены',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Загрузка записей редакционного документооборота',
      workflowHeading: 'Редакционный документооборот',
      newPost: 'Новая запись',
      description:
        'Число записей, ожидающих проверки — %{smart_count}, готовых к публикации — %{readyCount}. |||| Число записей, ожидающих проверки — %{smart_count}, готовых к публикации — %{readyCount}. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date}, %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: '%{author}',
      deleteChanges: 'Удалить изменения',
      deleteNewEntry: 'Удалить новую запись',
      publishChanges: 'Опубликовать изменения',
      publishNewEntry: 'Опубликовать новую запись',
    },
    workflowList: {
      onDeleteEntry: 'Вы уверены, что хотите удалить эту запись?',
      onPublishingNotReadyEntry:
        'Только элементы со статусом «Готов» могут быть опубликованы. Перетащите карточку в столбец «Одобренные», чтобы разрешить публикацию.',
      onPublishEntry: 'Вы уверены, что хотите опубликовать эту запись?',
      draftHeader: 'Черновики',
      inReviewHeader: 'На рассмотрении',
      readyHeader: 'Одобренные',
      currentEntries: '%{smart_count} entry |||| %{smart_count} entries',
    },
  },
};

export default ru;
