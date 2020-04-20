const uk = {
  app: {
    header: {
      content: 'Зміст',
      workflow: 'Робочий процес',
      media: 'Медіа',
      quickAdd: 'Додати',
    },
    app: {
      errorHeader: 'Помилка завантаження конфігурації',
      configErrors: 'Помилка конфігурації',
      checkConfigYml: 'Перевірте config.yml файл.',
      loadingConfig: 'Завантаження конфігурації...',
      waitingBackend: 'Очікування серверу...',
    },
    notFoundPage: {
      header: 'Сторінку не знайдено ',
    },
  },
  collection: {
    sidebar: {
      collections: 'Колекції',
      searchAll: 'Пошук',
    },
    collectionTop: {
      viewAs: 'Змінити вигляд',
      newButton: 'Створити %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Завантаження записів',
      cachingEntries: 'Кешування записів',
      longerLoading: 'Це може зайняти декілька хвилинок',
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'необов’язково',
      },
    },
    editorControlPane: {
      widget: {
        required: "%{fieldLabel} є обов'язковим.",
        regexPattern: '%{fieldLabel} не задовільняє умові: %{pattern}.',
        processing: 'обробляється %{fieldLabel}.',
        range: 'значення %{fieldLabel} повинне бути від %{minValue} до %{maxValue}.',
        min: 'значення %{fieldLabel} має бути від %{minValue}.',
        max: 'значення %{fieldLabel} має бути %{maxValue} та менше.',
      },
    },
    editor: {
      onLeavePage: 'Ви дійсно бажаєте залишити сторінку?',
      onUpdatingWithUnsavedChanges:
        'Присутні незбережені зміни, будь ласка збережіть перед зміною статусу.',
      onPublishingNotReady: 'Будь ласка, встановіть статус "Готово" перед публікацією.',
      onPublishingWithUnsavedChanges:
        'Присутні незбережені зміни, будь ласка збережіть їх перед публікацією.',
      onPublishing: 'Ви дійсно бажаєте опублікувати запис?',
      onDeleteWithUnsavedChanges:
        'Ви дійсно бажаєте видалити опублікований запис, як і всі незбережені зміни під час поточної сесії?',
      onDeletePublishedEntry: 'Ви дійсно бажаєте видалити опублікований запис?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Видаляться всі неопубліковані зміни до цього запису, а також всі незбережені зміни під час поточної сесії. Бажаєте продовжити?',
      onDeleteUnpublishedChanges:
        'Всі незбережені зміни до цього запису буде видалено. Бажаєте продовжити?',
      loadingEntry: 'Завантаження...',
      confirmLoadBackup: 'Відновлено резервну копію, бажаєте її використати?',
    },
    editorToolbar: {
      publishing: 'Публікація...',
      publish: 'Опублікувати',
      published: 'Опубліковано',
      publishAndCreateNew: 'Опублікувати і створити нову',
      deleteUnpublishedChanges: 'Видалити неопубліковані зміни',
      deleteUnpublishedEntry: 'Видалити неопубліковану сторінку',
      deletePublishedEntry: 'Видалити опубліковану сторінку',
      deleteEntry: 'Видалити',
      saving: 'Збереження...',
      save: 'Зберегти',
      deleting: 'Видалення...',
      updating: 'Оновлення...',
      setStatus: 'Змінити стан',
      backCollection: ' Робота над %{collectionLabel} колекцією',
      unsavedChanges: 'Незбережені зміни',
      changesSaved: 'Зміни збережено',
      draft: 'В роботі',
      inReview: 'На розгляді',
      ready: 'Готово',
      publishNow: 'Опублікувати',
      deployPreviewPendingButtonLabel: 'Перевірити оновлення',
      deployPreviewButtonLabel: 'Попередній перегляд',
      deployButtonLabel: 'Переглянути наживо',
    },
    editorWidgets: {
      image: {
        choose: 'Виберіть зображення',
        chooseDifferent: 'Виберіть інше зображення',
        remove: 'Видалити зображення',
      },
      file: {
        choose: 'Виберіть файл',
        chooseDifferent: 'Виберіть інший файл',
        remove: 'Видалити файл',
      },
      unknownControl: {
        noControl: "Відсутній модуль для '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Відсутній перегляд для '%{widget}'.",
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
      draft: 'В роботі',
    },
    mediaLibrary: {
      onDelete: 'Ви дійсно бажаєте видалити обрані матеріали?',
    },
    mediaLibraryModal: {
      loading: 'Завантаження...',
      noResults: 'Результати відсутні.',
      noAssetsFound: 'Матеріали відсутні.',
      noImagesFound: 'Зображення відсутні.',
      private: 'Private ',
      images: 'Зображення',
      mediaAssets: 'Медіа матеріали',
      search: 'Пошук...',
      uploading: 'Завантаження...',
      upload: 'Завантажити',
      deleting: 'Видалення...',
      deleteSelected: 'Видалити обране',
      chooseSelected: 'Додати обране',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Помилка',
      details: 'Відбулась помилка - будь ласка ',
      reportIt: 'надішліть нам деталі.',
      detailsHeading: 'Деталі',
      recoveredEntry: {
        heading: 'Відновлено документ',
        warning: 'Будь ласка, збережіть це десь перед тим як піти!',
        copyButtonLabel: 'Скопіювати в буфер',
      },
    },
    settingsDropdown: {
      logOut: 'Вихід',
    },
    toast: {
      onFailToLoadEntries: 'Помилка завантаження: %{details}',
      onFailToLoadDeployPreview: 'Помилка завантаження перегляду: %{details}',
      onFailToPersist: 'Помилка перезапису: %{details}',
      onFailToDelete: 'Помилка видалення: %{details}',
      onFailToUpdateStatus: 'Помилка оновлення статусу: %{details}',
      missingRequiredField:
        "Йой, здається пропущено обов'язкове поле. Будь ласка, заповніть перед збереженням.",
      entrySaved: 'Збережено',
      entryPublished: 'Опубліковано',
      onFailToPublishEntry: 'Помилка публікації: %{details}',
      entryUpdated: 'Статус оновлено',
      onDeleteUnpublishedChanges: 'Видалено неопубліковані зміни',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Завантаження редакційних матеріалів',
      workflowHeading: 'Редакція',
      newPost: 'Новий запис',
      description: '%{smart_count} записів очікують розгляду, %{readyCount} готові до публікації. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} від %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'від %{author}',
      deleteChanges: 'Видалити зміни',
      deleteNewEntry: 'Видалити новий запис',
      publishChanges: 'Опублікувати всі зміни',
      publishNewEntry: 'Опублікувати новий запис',
    },
    workflowList: {
      onDeleteEntry: 'Ви дійсно бажаєте видалити запис?',
      onPublishingNotReadyEntry:
        'Тільки елементи з статусом "Готово" можуть бути опубліковані. Будь ласка перемістіть картку в колонку "Готово" для публікації.',
      onPublishEntry: 'Дійсно бажаєте опублікувати запис?',
      draftHeader: 'В роботі',
      inReviewHeader: 'На розгляді',
      readyHeader: 'Готово',
      currentEntries: '%{smart_count} запис |||| %{smart_count} записів',
    },
  },
};

export default uk;
