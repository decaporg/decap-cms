const bg = {
  auth: {
    login: 'Вход',
    loggingIn: 'Влизане...',
    loginWithNetlifyIdentity: 'Вход с Netlify Identity',
    loginWithAzure: 'Вход с Azure',
    loginWithBitbucket: 'Вход с Bitbucket',
    loginWithGitHub: 'Вход с GitHub',
    loginWithGitLab: 'Вход с GitLab',
    loginWithGitea: 'Вход с Gitea',
    errors: {
      email: 'Въведете вашия имейл.',
      password: 'Въведете паролата.',
      identitySettings:
        'Няма достъп до настройките. Ако използвате git-gateway, не забравяйте да активирате услугата Identity и Git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Съдържание',
      workflow: 'Работен процес',
      media: 'Мултимедийни файлове',
      quickAdd: 'Бързо добавяне',
    },
    app: {
      errorHeader: 'Грешка при зареждането на конфигурацията на CMS',
      configErrors: 'Грешки в конфигурацията',
      checkConfigYml: 'Проверете вашия файл config.yml.',
      loadingConfig: 'Зареждане на конфигурация ...',
      waitingBackend: 'В очакване на отговор от бекенда ...',
    },
    notFoundPage: {
      header: 'Не е намерен',
    },
  },
  collection: {
    sidebar: {
      collections: 'Колекции',
      allCollections: 'Всички колекции',
      searchAll: 'Търсете навсякъде',
      searchIn: 'Търсене в',
    },
    collectionTop: {
      sortBy: 'Сортирай по',
      viewAs: 'Виж като',
      newButton: 'Създай %{collectionLabel}',
      ascending: 'Възходящ',
      descending: 'Низходящ',
      searchResults: 'Ресултати от търсенето за "%{searchTerm}"',
      searchResultsInCollection: 'Ресултати от търсенето за "%{searchTerm}" в %{collection}',
      filterBy: 'Филтрирай по',
      groupBy: 'Групирай по',
    },
    entries: {
      loadingEntries: 'Зареждане на записи...',
      cachingEntries: 'Кеширане на записи...',
      longerLoading: 'Това може да отнеме няколко минути',
      noEntries: 'Няма записи',
    },
    groups: {
      other: 'Други',
      negateLabel: 'Не %{label}',
    },
    defaultFields: {
      author: {
        label: 'Автор',
      },
      updatedOn: {
        label: 'Обновено',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'незадължителен',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} е задължително.',
        regexPattern: '%{fieldLabel} не съответства на модела: %{pattern}.',
        processing: '%{fieldLabel} се обработва.',
        min: '%{fieldLabel} трябва да бъде поне %{minValue}.',
        range: '%{fieldLabel} трябва да бъде между %{minValue} и %{maxValue}.',
        max: '%{fieldLabel} трябва да бъде %{maxValue} или по-малко.',
        rangeCount: '%{fieldLabel} трябва да има между %{minCount} и %{maxCount} елемент(и).',
        rangeCountExact: '%{fieldLabel} трябва да има точно %{count} елемент(и).',
        minCount: '%{fieldLabel} трябва да бъде поне %{minCount} елемент(и).',
        maxCount: '%{fieldLabel} трябва да бъде %{maxCount} или по-малко елемент(и).',
        invalidPath: `'%{path}' не е валиден път`,
        pathExists: `Пътят '%{path}' вече съществува`,
      },
      i18n: {
        writingInLocale: 'Писане на %{locale}',
      },
    },
    editor: {
      onLeavePage: 'Наистина ли искате да напуснете тази страница?',
      onUpdatingWithUnsavedChanges:
        'Имате незапазени промени, моля, запазете преди актуализиране на състоянието.',
      onPublishingNotReady: 'Моля, актуализирайте състоянието на „Готово“, преди да публикувате',
      onPublishingWithUnsavedChanges: 'Имате незапазени промени, моля, запазете преди публикуване.',
      onPublishing: 'Наистина ли искате да публикувате този запис?',
      onUnpublishing: 'Наистина ли искате да прекратите публикуването на този запис?',
      onDeleteWithUnsavedChanges:
        'Наистина ли искате да изтриете този публикуван запис, както и незаписаните промени от текущата сесия?',
      onDeletePublishedEntry: 'Наистина ли искате да изтриете този публикуван запис?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Това ще изтрие всички непубликувани промени в този запис, както и незаписаните ви промени от текущата сесия. Все още ли искате да изтриете?',
      onDeleteUnpublishedChanges:
        'Всички непубликувани промени в този запис ще бъдат изтрити. Все още ли искате да изтриете?',
      loadingEntry: 'Зареждане на запис...',
      confirmLoadBackup:
        'За този запис беше възстановен локален архив, бихте ли искали да го използвате?',
    },
    editorInterface: {
      toggleI18n: 'Превключване i18n',
      togglePreview: 'Превключване на визуализация',
      toggleScrollSync: 'Синхронизирай превъртане',
    },
    editorToolbar: {
      publishing: 'Публикуване...',
      publish: 'Публикувай',
      published: 'Публикуван',
      unpublish: 'Непубликувай',
      duplicate: 'Дублирай',
      unpublishing: 'Непубликуване...',
      publishAndCreateNew: 'Публикувай и създай нов',
      publishAndDuplicate: 'Публикувай и дублирай',
      deleteUnpublishedChanges: 'Изтриване на непубликувани промени',
      deleteUnpublishedEntry: 'Изтрий непубликувани записи',
      deletePublishedEntry: 'Изтрий публикувани записи',
      deleteEntry: 'Изтрий запис',
      saving: 'Запазване...',
      save: 'Запази',
      deleting: 'Изтриване...',
      updating: 'Актуализиране...',
      status: 'Cъстояние: %{status}',
      backCollection: 'Записване в %{collectionLabel} колекция',
      unsavedChanges: 'Незапазени Промени',
      changesSaved: 'Запазени промени',
      draft: 'Чернова',
      inReview: 'В ревю',
      ready: 'Готово',
      publishNow: 'Публикувай сега',
      deployPreviewPendingButtonLabel: 'Проверете  визуализацията',
      deployPreviewButtonLabel: 'Визуализация',
      deployButtonLabel: 'Изглед',
    },
    editorWidgets: {
      markdown: {
        bold: 'Удебелен',
        italic: 'Курсив',
        code: 'Код',
        link: 'Връзка',
        linkPrompt: 'Моля, въведете URL на връзката',
        headings: 'Заглавия',
        quote: 'Цитат',
        bulletedList: 'Маркиран Списък',
        numberedList: 'Номериран Списък',
        addComponent: 'Добави Компонент',
        richText: 'Форматиране на текст',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Избери изображение',
        chooseUrl: 'Вмъкване от URL',
        replaceUrl: 'Замяна с URL',
        promptUrl: 'Въведете URL адреса на изображението',
        chooseDifferent: 'Избери различно изображение',
        remove: 'Премахни изображение',
      },
      file: {
        choose: 'Избери файл file',
        chooseUrl: 'Вмъкване от URL',
        replaceUrl: 'Замяна с URL',
        promptUrl: 'Въведете URL адреса на файла',
        chooseDifferent: 'Избери различен файл',
        remove: 'Премахни файл',
      },
      unknownControl: {
        noControl: "Няма контрол за приспособлението '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Няма визуализация за приспособлението '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Heading 1',
        headingTwo: 'Heading 2',
        headingThree: 'Heading 3',
        headingFour: 'Heading 4',
        headingFive: 'Heading 5',
        headingSix: 'Heading 6',
      },
      datetime: {
        now: 'Сега',
        clear: 'Изчисти',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Чернова',
      copy: 'Копирай',
      copyUrl: 'Копирай URL',
      copyPath: 'Копитай път',
      copyName: 'Копитай име',
      copied: 'Копирано',
    },
    mediaLibrary: {
      onDelete: 'Наистина ли искате да изтриете избрания медиен файл?',
      fileTooLarge:
        'Файлът е твърде голям.\nНастройките не позволяват запазване на файлове по-големи от %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Зареждане...',
      noResults: 'Няма резултати.',
      noAssetsFound: 'Няма намерени ресурси.',
      noImagesFound: 'Няма намерени изображения.',
      private: 'Частен ',
      images: 'Изображения',
      mediaAssets: 'Медийни ресурси',
      search: 'Търсене...',
      uploading: 'Качване...',
      upload: 'Качи',
      download: 'Изтегли',
      deleting: 'Изтриване...',
      deleteSelected: 'Изтрай избрани',
      chooseSelected: 'Избери избрани',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Обратно към сайта',
    },
    errorBoundary: {
      title: 'Грешка',
      details: 'Възникна грешка - моля ',
      reportIt: 'докладвайте в GitHub.',
      detailsHeading: 'Детайли',
      privacyWarning:
        'При отваряне на билет той автоматично се попълва предварително със съобщение за грешка и информация за отстраняване на грешки.\nМоля, проверете дали данните са верни и не съдържат поверителна информация.',
      recoveredEntry: {
        heading: 'Възстановен документ',
        warning: 'Моля, копирайте това съобщение някъде, преди да напуснете страницата!',
        copyButtonLabel: 'Копиране в клипборда',
      },
    },
    settingsDropdown: {
      logOut: 'Изход',
    },
    toast: {
      onFailToLoadEntries: 'Неуспешно зареждане на записа: %{details}',
      onFailToLoadDeployPreview: 'Неуспешно зареждане на визуализация: %{details}',
      onFailToPersist: 'Неуспешно запазване на записа: %{details}',
      onFailToDelete: 'Неуспешно изтриване на записа: %{details}',
      onFailToUpdateStatus: 'Неуспешно актуализиране на състоянието: %{details}',
      missingRequiredField:
        'Извинете, пропуснахте задължително поле. Моля, попълнете преди запазване.',
      entrySaved: 'Записът е запазен',
      entryPublished: 'Записът е публикуван',
      entryUnpublished: 'Записът е непубликуван',
      onFailToPublishEntry: 'Неуспешно публикуване на запис: %{details}',
      onFailToUnpublishEntry: 'Неуспешно премахване на публикацията на записа: %{details}',
      entryUpdated: 'Статусът на записа е актуализиран',
      onDeleteUnpublishedChanges: 'Непубликуваните промени са изтрити',
      onFailToAuth: '%{details}',
      onLoggedOut: 'Излезли сте. Моля, запазете всички данни и влезте отново',
      onBackendDown: 'Има прекъсване в работата на бекенда. Виж детайлите %{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Зареждане на редакционни записи',
      workflowHeading: 'Редакционен работен процес',
      newPost: 'Нова публикация',
      description:
        'Броят на записите, които очакват проверка -% {smart_count}, готови за публикуване -% {readyCount}. |||| Броят на записите, които очакват проверка -% {smart_count}, готови за публикуване -% {readyCount}. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date}, %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: '%{author}',
      deleteChanges: 'Изтриване на промените',
      deleteNewEntry: 'Изтриване на нов запис',
      pubChanges: 'Публикуване на промени',
      objavNewEntry: 'Публикуване на нов запис',
    },
    workflowList: {
      onDeleteEntry: 'Наистина ли искате да изтриете този запис?',
      onPublishingNotReadyEntry:
        'Могат да се публикуват само елементи със статус "Готов". Плъзенете картата в колоната "Готов" за да активирате публикуването.',
      onPublishEntry: 'Наистина ли искате да публикувате този запис?',
      draftHeader: 'Чернови',
      inReviewHeader: 'В Ревю',
      readyHeader: 'Готов',
      currentEntries: '%{smart_count} запис |||| %{smart_count} записи',
    },
  },
};

export default bg;
