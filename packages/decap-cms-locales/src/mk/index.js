const mk = {
  auth: {
    login: 'Најава',
    loggingIn: 'Се најавува...',
    loginWithNetlifyIdentity: 'Најава со Netlify Identity',
    loginWithAzure: 'Најава со Azure',
    loginWithBitbucket: 'Најава со Bitbucket',
    loginWithGitHub: 'Најава со GitHub',
    loginWithGitLab: 'Најава со GitLab',
    loginWithGitea: 'Најава со Gitea',
    errors: {
      email: 'Внесете ја вашата е-пошта.',
      password: 'Внесете ја вашата лозинка.',
      identitySettings:
        'Нема пристап до поставките. Ако користите git-gateway, не заборавајте да ја активирате услугата Identity и Git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Содржина',
      workflow: 'Работен процес',
      media: 'Медиумски ресурси',
      quickAdd: 'Брзо додавање',
    },
    app: {
      errorHeader: 'Грешка при вчитувањето на CMS конфигурацијата',
      configErrors: 'Грешки во конфигурацијата',
      checkConfigYml: 'Проверете ја вашата config.yml датотека.',
      loadingConfig: 'Се вчитува конфигурацијата...',
      waitingBackend: 'Се чека одговор од серверот...',
    },
    notFoundPage: {
      header: 'Не е пронајдено',
    },
  },
  collection: {
    sidebar: {
      collections: 'Колекции',
      allCollections: 'Сите колекции',
      searchAll: 'Пребарај секаде',
      searchIn: 'Пребарај во',
    },
    collectionTop: {
      sortBy: 'Подреди според',
      viewAs: 'Прикажи како',
      newButton: 'Креирај %{collectionLabel}',
      ascending: 'Растечки',
      descending: 'Опаѓачки',
      searchResults: 'Резултати од пребарувањето за "%{searchTerm}"',
      searchResultsInCollection: 'Резултати од пребарувањето за "%{searchTerm}" во %{collection}',
      filterBy: 'Филтрирај по',
      groupBy: 'Групирај по',
    },
    entries: {
      loadingEntries: 'Се вчитуваат записи...',
      cachingEntries: 'Се кешираат записи...',
      longerLoading: 'Ова може да потрае неколку минути',
      noEntries: 'Нема записи',
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
        label: 'Ажурирано на',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'незадолжително',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} е задолжително.',
        regexPattern: '%{fieldLabel} не се совпаѓа со шаблонот: %{pattern}.',
        processing: '%{fieldLabel} се обработува.',
        range: '%{fieldLabel} мора да биде помеѓу %{minValue} и %{maxValue}.',
        min: '%{fieldLabel} мора да биде најмалку %{minValue}.',
        max: '%{fieldLabel} мора да биде %{maxValue} или помалку.',
        rangeCount: '%{fieldLabel} мора да има помеѓу %{minCount} и %{maxCount} елементи.',
        rangeCountExact: '%{fieldLabel} мора да има точно %{count} елементи.',
        rangeMin: '%{fieldLabel} мора да има најмалку %{minCount} елементи.',
        rangeMax: '%{fieldLabel} мора да има %{maxCount} или помалку елементи.',
        invalidPath: `'%{path}' не е валидна патека`,
        pathExists: `Патеката '%{path}' веќе постои`,
      },
      i18n: {
        writingInLocale: 'Пишување на %{locale}',
        copyFromLocale: 'Пополнете од друг јазик',
        copyFromLocaleConfirm:
          'Дали сакате да ги пополните податоците од јазикот %{locale}?\nСите постоечки содржини ќе бидат презапишани.',
      },
    },
    editor: {
      onLeavePage: 'Дали сте сигурни дека сакате да ја напуштите страницата?',
      onUpdatingWithUnsavedChanges:
        'Имате незачувани промени, зачувајте пред ажурирање на статусот.',
      onPublishingNotReady: 'Ажурирајте го статусот на "Спремно" пред објавување.',
      onPublishingWithUnsavedChanges: 'Имате незачувани промени, зачувајте пред објавување.',
      onPublishing: 'Дали сте сигурни дека сакате да го објавите овој запис?',
      onUnpublishing: 'Дали сте сигурни дека сакате да го откажете објавувањето на овој запис?',
      onDeleteWithUnsavedChanges:
        'Дали сте сигурни дека сакате да го избришете овој објавен запис и незачуваните промени од тековната сесија?',
      onDeletePublishedEntry: 'Дали сте сигурни дека сакате да го избришете овој објавен запис?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Ова ќе ги избрише сите необјавени промени во овој запис и незачуваните промени од тековната сесија. Дали сакате да продолжите?',
      onDeleteUnpublishedChanges:
        'Сите необјавени промени ќе бидат избришани. Дали сакате да продолжите?',
      loadingEntry: 'Се вчитува запис...',
      confirmLoadBackup:
        'Се пронајде локална резервна копија за овој запис. Дали сакате да ја користите?',
    },
    editorInterface: {
      toggleI18n: 'Вклучи i18n',
      togglePreview: 'Вклучи преглед',
      toggleScrollSync: 'Синхронизирај скрол',
    },
    editorToolbar: {
      publishing: 'Се објавува...',
      publish: 'Објави',
      published: 'Објавен',
      unpublish: 'Откажи објавување',
      duplicate: 'Дуплирај',
      unpublishing: 'Откажување објава...',
      publishAndCreateNew: 'Објави и креирај нов',
      publishAndDuplicate: 'Објави и дуплирај',
      deleteUnpublishedChanges: 'Избриши необјавени промени',
      deleteUnpublishedEntry: 'Избриши необјавен запис',
      deletePublishedEntry: 'Избриши објавен запис',
      deleteEntry: 'Избриши запис',
      saving: 'Се зачувува...',
      save: 'Зачувај',
      statusInfoTooltipDraft:
        'Статусот на записот е поставен како нацрт. За да го финализирате и поднесете за преглед, поставете го статусот "Во рецензија".',
      statusInfoTooltipInReview:
        'Записот е во рецензија, не се потребни дополнителни акции. Сепак, можете да направите дополнителни промени додека е во рецензија.',
      deleting: 'Се брише...',
      updating: 'Се ажурира...',
      status: 'Статус: %{status}',
      backCollection: ' Запишување во колекцијата %{collectionLabel}',
      unsavedChanges: 'Незачувани промени',
      changesSaved: 'Промените се зачувани',
      draft: 'Нацрт',
      inReview: 'Во рецензија',
      ready: 'Спремно',
      publishNow: 'Објави сега',
      deployPreviewPendingButtonLabel: 'Проверете ја верзијата во рецензија',
      deployPreviewButtonLabel: 'Прикажи рецензија',
      deployButtonLabel: 'Прикажи во живо',
    },
    editorWidgets: {
      markdown: {
        bold: 'Задебелено',
        italic: 'Косо',
        code: 'Код',
        link: 'Линк',
        linkPrompt: 'Внесете URL за линкот',
        headings: 'Наслови',
        quote: 'Цитат',
        bulletedList: 'Список со булети',
        numberedList: 'Нумериран список',
        addComponent: 'Додај компонента',
        richText: 'Форматиран текст',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Избери слика',
        chooseMultiple: 'Избери повеќе слики',
        chooseUrl: 'Вметни од URL',
        replaceUrl: 'Замени со URL',
        promptUrl: 'Внесете URL за сликата',
        chooseDifferent: 'Избери друга слика',
        addMore: 'Додај повеќе слики',
        remove: 'Отстрани слика',
        removeAll: 'Отстрани ги сите слики',
      },
      file: {
        choose: 'Избери датотека',
        chooseUrl: 'Вметни од URL',
        chooseMultiple: 'Избери повеќе датотеки',
        replaceUrl: 'Замени со URL',
        promptUrl: 'Внесете URL за датотеката',
        chooseDifferent: 'Избери друга датотека',
        addMore: 'Додај повеќе датотеки',
        remove: 'Отстрани датотека',
        removeAll: 'Отстрани ги сите датотеки',
      },
      unknownControl: {
        noControl: "Нема контрола за виџетот '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Нема преглед за виџетот '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Наслов 1',
        headingTwo: 'Наслов 2',
        headingThree: 'Наслов 3',
        headingFour: 'Наслов 4',
        headingFive: 'Наслов 5',
        headingSix: 'Наслов 6',
      },
      datetime: {
        now: 'Сега',
        clear: 'Исчисти',
      },
      list: {
        add: 'Додај %{item}',
        addType: 'Додај %{item}',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Нацрт',
      copy: 'Копирај',
      copyUrl: 'Копирај URL',
      copyPath: 'Копирај патека',
      copyName: 'Копирај име',
      copied: 'Копирано',
    },
    mediaLibrary: {
      onDelete: 'Дали сте сигурни дека сакате да го избришете избраниот медиум?',
      fileTooLarge:
        'Датотеката е преголема.\nКонфигурацијата не дозволува датотеки поголеми од %{size} kB.',
    },
    mediaLibraryModal: {
      loading: 'Се вчитува...',
      noResults: 'Нема резултати.',
      noAssetsFound: 'Не се пронајдени ресурси.',
      noImagesFound: 'Не се пронајдени слики.',
      private: 'Приватно',
      images: 'Слики',
      mediaAssets: 'Медиумски ресурси',
      search: 'Пребарај...',
      uploading: 'Се прикачува...',
      upload: 'Прикачи',
      download: 'Преземи',
      deleting: 'Се брише...',
      deleteSelected: 'Избриши ги селектираните',
      chooseSelected: 'Избери од селектираните',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Назад кон сајтот',
    },
    errorBoundary: {
      title: 'Грешка',
      details: 'Се случи грешка - ве молиме ',
      reportIt: 'пријавете проблем на GitHub.',
      detailsHeading: 'Детали',
      privacyWarning:
        'При отворање на тикет, автоматски се пополнува со порака за грешка и податоци за дебагирање.\nПроверете дали податоците се точни и отстранете ги доверливите информации ако ги има.',
      recoveredEntry: {
        heading: 'Повратен документ',
        warning: 'Зачувајте го ова некаде пред да ја напуштите страницата!',
        copyButtonLabel: 'Копирај во клипборд',
      },
    },
    settingsDropdown: {
      logOut: 'Одјави се',
    },
    toast: {
      onFailToLoadEntries: 'Неуспешно вчитување на запис: %{details}',
      onFailToLoadDeployPreview: 'Неуспешно вчитување на преглед: %{details}',
      onFailToPersist: 'Неуспешно зачувување на запис: %{details}',
      onFailToDelete: 'Неуспешно бришење на запис: %{details}',
      onFailToUpdateStatus: 'Неуспешно ажурирање на статусот: %{details}',
      missingRequiredField:
        'Пропуштивте задолжително поле. Ве молиме пополнете го пред да зачувате.',
      entrySaved: 'Записот е зачуван',
      entryPublished: 'Записот е објавен',
      entryUnpublished: 'Записот е необјавен',
      onFailToPublishEntry: 'Неуспешно објавување: %{details}',
      onFailToUnpublishEntry: 'Неуспешно откажување објавување: %{details}',
      entryUpdated: 'Статусот на записот е ажуриран',
      onDeleteUnpublishedChanges: 'Необјавените промени се избришани',
      onFailToAuth: '%{details}',
      onLoggedOut: 'Одјавени сте, зачувајте ги податоците и најавете се повторно.',
      onBackendDown: 'Серверот има прекин. Видете %{details} за повеќе информации.',
    },
  },
  workflow: {
    workflow: {
      loading: 'Се вчитуваат записи за уредувачкиот работен процес',
      workflowHeading: 'Уредувачки работен процес',
      newPost: 'Нова објава',
      description:
        '%{smart_count} запис чека за рецензија, %{readyCount} подготвен за објава. |||| %{smart_count} записи чекаат за рецензија, %{readyCount} подготвени за објава.',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} од %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'од %{author}',
      deleteChanges: 'Избриши промени',
      deleteNewEntry: 'Избриши нов запис',
      publishChanges: 'Објави промени',
      publishNewEntry: 'Објави нов запис',
    },
    workflowList: {
      onDeleteEntry: 'Дали сте сигурни дека сакате да го избришете овој запис?',
      onPublishingNotReadyEntry:
        'Само записи со статус "Спремно" можат да се објават. Повлечете ја картичката во колоната "Спремно" за да го овозможите објавувањето.',
      onPublishEntry: 'Дали сте сигурни дека сакате да го објавите овој запис?',
      draftHeader: 'Нацрти',
      inReviewHeader: 'Во рецензија',
      readyHeader: 'Спремно',
      currentEntries: '%{smart_count} запис |||| %{smart_count} записи',
    },
  },
};

export default mk;
