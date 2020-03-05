const zh_Hant = {
  auth: {
    login: '登入',
    loggingIn: '正在登入...',
    loginWithNetlifyIdentity: '使用你的 Netlify 帳號來進行登入',
    loginWithBitbucket: '使用你的 Bitbucket 帳號來進行登入',
    loginWithGitHub: '使用你的 GitHub 帳號來進行登入',
    loginWithGitLab: '使用你的 GitLab 帳號來進行登入',
    errors: {
      email: '請確認你已經輸入你的電子郵件。',
      password: '請輸入你的密碼。',
      identitySettings:
        '無法連接認證系統！ ˇ當使用 git-gateway 作為後端資料庫時，請確認您已開啟認證服務及 Git Gateway。',
    },
  },
  app: {
    header: {
      content: '內容',
      workflow: '作業流程',
      media: '媒體',
      quickAdd: '快速新增',
    },
    app: {
      errorHeader: '載入 CMS 設定時發生錯誤',
      configErrors: '設定錯誤',
      checkConfigYml: '請確認你的 config.yml 設定檔的內容是否正確',
      loadingConfig: '正在載入設定...',
      waitingBackend: '正在等待後端資料連接...',
    },
    notFoundPage: {
      header: '找不到頁面',
    },
  },
  collection: {
    sidebar: {
      collections: '集合',
      searchAll: '尋找所有集合',
    },
    collectionTop: {
      viewAs: '瀏覽方式',
      newButton: '新增 %{collectionLabel}',
    },
    entries: {
      loadingEntries: '載入內容',
      cachingEntries: '快取內容',
      longerLoading: '這可能需要幾分鐘的時間',
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: '可选的',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} 是必須的。',
        regexPattern: '%{fieldLabel} 並不符合 %{pattern} 的型態',
        processing: '%{fieldLabel} 正在處理',
        range: '%{fieldLabel} 必須介於 %{minValue} 和 %{maxValue} 之間',
        min: '%{fieldLabel} 必須至少為 %{minValue}',
        max: '%{fieldLabel} 必須小於或等於 %{maxValue}',
      },
    },
    editor: {
      onLeavePage: '您確定要離開這頁嗎？',
      onUpdatingWithUnsavedChanges: '您有未儲存的變更，在更新狀態前請先進行儲存。',
      onPublishingNotReady: '在發布前，請先將狀態設定為：預備發布。',
      onPublishingWithUnsavedChanges: '您有未儲存的變更，在發布前請先進行儲存。',
      onPublishing: '你確定要發表此內容嗎？',
      onUnpublishing: '你確定要取消發表此內容嗎？',
      onDeleteWithUnsavedChanges:
        'Are you sure you want to delete this published entry, as well as your unsaved changes from the current session?',
      onDeletePublishedEntry: 'Are you sure you want to delete this published entry?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'This will delete all unpublished changes to this entry, as well as your unsaved changes from the current session. Do you still want to delete?',
      onDeleteUnpublishedChanges:
        'All unpublished changes to this entry will be deleted. Do you still want to delete?',
      loadingEntry: '載入內容中...',
      confirmLoadBackup: 'A local backup was recovered for this entry, would you like to use it?',
    },
    editorToolbar: {
      publishing: '發布中...',
      publish: '發布',
      published: '已發布',
      unpublish: '取消發布',
      duplicate: '建立新內容',
      unpublishing: '取消發布中...',
      publishAndCreateNew: '發布並建立內容',
      publishAndDuplicate: '發布並複製內容',
      deleteUnpublishedChanges: '刪除未發布的變更',
      deleteUnpublishedEntry: '刪除未發布的內容',
      deletePublishedEntry: '刪除已發布的內容',
      deleteEntry: '刪除內容',
      saving: '儲存中...',
      save: '儲存',
      deleting: '刪除中...',
      updating: '更新中...',
      setStatus: '設定狀態',
      backCollection: '在集合 %{collectionLabel} 新增內容',
      unsavedChanges: '未儲存變更',
      changesSaved: '已儲存變更',
      draft: '草稿',
      inReview: '正在審核',
      ready: '預備發布',
      publishNow: '立即發布',
      deployPreviewPendingButtonLabel: '點擊來進行預覽',
      deployPreviewButtonLabel: '進行預覽',
      deployButtonLabel: '觀看已發布的內容',
    },
    editorWidgets: {
      image: {
        choose: '选择一张图片',
        chooseDifferent: '选择其他图片',
        remove: '移除图片',
      },
      file: {
        choose: '选择一个文件',
        chooseDifferent: '选择其他文件',
        remove: '删除文件',
      },
      unknownControl: {
        noControl: "無法控制元件： '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "無法預覽元件： '%{widget}'.",
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
      draft: '草稿',
    },
    mediaLibrary: {
      onDelete: '你確定要刪除已選擇的媒體嗎？',
    },
    mediaLibraryModal: {
      loading: '載入中...',
      noResults: '沒有結果',
      noAssetsFound: '沒有發現媒體資產。',
      noImagesFound: '沒有發現影像。',
      private: '私人',
      images: '影像',
      mediaAssets: '媒體資產',
      search: '搜尋中...',
      uploading: '上傳中...',
      uploadNew: '上傳新內容',
      deleting: '刪除中...',
      deleteSelected: '刪除已選擇的項目',
      chooseSelected: '選擇已選擇的項目',
    },
  },
  ui: {
    errorBoundary: {
      title: '錯誤',
      details: '發生錯誤！請 ',
      reportIt: '回報錯誤',
      detailsHeading: '細節',
      recoveredEntry: {
        heading: '已恢復的內容',
        warning: '在你離開本頁前，請將此處的內容複製貼上到其他地方來進行備份！',
        copyButtonLabel: '複製到剪貼簿',
      },
    },
    settingsDropdown: {
      logOut: '登出',
    },
    toast: {
      onFailToLoadEntries: '無法載入內容： %{details}',
      onFailToLoadDeployPreview: '無法預覽內容： %{details}',
      onFailToPersist: '無法暫存內容： %{details}',
      onFailToDelete: '無法刪除內容： %{details}',
      onFailToUpdateStatus: '無法更新狀態： %{details}',
      missingRequiredField: '糟了！你漏填了一個必須填入的欄位，在儲存前請先填完所有內容',
      entrySaved: '已儲存內容',
      entryPublished: '已發布內容',
      entryUnpublished: '已取消發布內容',
      onFailToPublishEntry: '無法發布： %{details}',
      onFailToUnpublishEntry: '無法取消發布： %{details}',
      entryUpdated: '內容狀態已更新',
      onDeleteUnpublishedChanges: '已刪除未發布的變更',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: '正在載入編輯流程的內容',
      workflowHeading: '編輯作業流程',
      newPost: '建立新的內容',
      description:
        '%{smart_count} 篇內容正在等待審核， %{readyCount} 篇已經準備進行發布。 |||| %{smart_count} 篇內容正在等待審核， %{readyCount} 篇已經準備進行發布。',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} by %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'by %{author}',
      deleteChanges: '刪除變更',
      deleteNewEntry: '刪除新內容',
      publishChanges: '發布變更',
      publishNewEntry: '發布新內容',
    },
    workflowList: {
      onDeleteEntry: '你確定要刪除這個項目嗎？',
      onPublishingNotReadyEntry:
        '只有狀態為 預備發布 的內容可以被發布，請將本內容的狀態設定為 預備發布 來進行發布前的準備',
      onPublishEntry: '你確定要發表這篇內容嗎？',
      draftHeader: '草稿',
      inReviewHeader: '正在預覽',
      readyHeader: '準備完成',
      currentEntries: '%{smart_count} 篇內容 |||| %{smart_count} 篇內容',
    },
  },
};

export default zh_Hant;
