const ja = {
  app: {
    header: {
      content: 'コンテンツ',
      workflow: 'ワークフロー',
      media: 'メヂア',
      quickAdd: '新規追加',
    },
    app: {
      errorHeader: 'CMS構成の読み込んでいるエラー',
      configErrors: '構成のエラーリスト',
      checkConfigYml: 'config.ymlファイルをチェックしてください。',
      loadingConfig: '構成の読込中',
      waitingBackend: 'バックエンドの待ち中',
    },
    notFoundPage: {
      header: '見つけません',
    },
  },
  collection: {
    sidebar: {
      collections: 'コレクション',
      searchAll: '検索',
    },
    collectionTop: {
      viewAs: '表示モード',
      newButton: '%{collectionLabel}を作成',
    },
    entries: {
      loadingEntries: 'データーを読む込み',
      cachingEntries: 'データーのキャッシュ',
      longerLoading: '少々お待ちください',
    },
  },
  editor: {
    editorControlPane: {
      widget: {
        required: '%{fieldLabel}が必要です。',
        regexPattern: '%{fieldLabel}は%{pattern}と同じではありません。',
        processing: '%{fieldLabel}を処理しています。',
        range: '%{fieldLabel}価値は%{minValue}から%{maxValue}までしなければなりません。',
        min: '%{fieldLabel}価値の最初は%{minValue}です。',
        max: '%{fieldLabel}価値の最大は%{maxValue}です。',
      },
    },
    editor: {
      onLeavePage: 'このページから移転したいですか。',
      onUpdatingWithUnsavedChanges:
        '変更した項目がありますから、ステータスを更新する前に保存してください。',
      onPublishingNotReady: '公開する前に、レディにステータスを更新してください。',
      onPublishingWithUnsavedChanges: '変更した項目がありますから、公開する前に保存してください。',
      onPublishing: 'このデーターを公開したいですか。',
      onUnpublishing: 'このデーターを非公開したいですか。',
      onDeleteWithUnsavedChanges:
        '変更し項目をキャンセルしたいですか。データーを削除したいですか。',
      onDeletePublishedEntry: '公開したデータを削除したいですか。',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'データーの全ての公開しない変更を削除として、保存しない変更も削除したいですか。',
      onDeleteUnpublishedChanges: 'データーの全て公開しない変更は削除させます。削除したいですか。',
      loadingEntry: 'データーの読込中',
      confirmLoadBackup: 'ロカルのバックアップのデーターはリカバリさせます。適用したいですか。',
    },
    editorToolbar: {
      publishing: '公開込中',
      publish: '公開',
      published: '公開した',
      unpublish: '未公開',
      unpublishing: '未公開込中',
      publishAndCreateNew: '公開して新規作成させます',
      deleteUnpublishedChanges: '未公開の変更を削除させます',
      deleteUnpublishedEntry: '未公開のデーターを削除させます',
      deletePublishedEntry: '公開のデーターを削除させます',
      deleteEntry: 'データーを削除',
      saving: '保存中',
      save: '保存',
      deleting: '削除中',
      updating: '更新中',
      setStatus: 'ステータスを変更',
      backCollection: 'コレクションに%{collectionLabel}を書き込みます',
      unsavedChanges: '未保存の変更',
      changesSaved: '保存した',
      draft: 'ドラフト',
      inReview: 'レビュー中',
      ready: 'レディ',
      publishNow: 'すぐ公開',
      deployPreviewPendingButtonLabel: 'プレビューのチェック',
      deployPreviewButtonLabel: 'プレビュー',
      deployButtonLabel: 'ライブを見る',
    },
    editorWidgets: {
      unknownControl: {
        noControl: "'%{widget}'のウェジェットはコントロールがありません。",
      },
      unknownPreview: {
        noPreview: "'%{widget}'のウェジェットはプレビューがありません。",
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'ドラフト',
    },
    mediaLibrary: {
      onDelete: '選択しているメヂアを削除したいですか。',
    },
    mediaLibraryModal: {
      loading: '読込中',
      noResults: '見つけません',
      noAssetsFound: '資産を見つけさせません。',
      noImagesFound: '画像を見つけさせません。',
      private: 'プライベート',
      images: '画像',
      mediaAssets: '資産のメヂア',
      search: '検索中',
      uploading: 'アップロード中',
      uploadNew: 'アップロード',
      deleting: '削除中',
      deleteSelected: '削除',
      chooseSelected: '選択',
    },
  },
  ui: {
    errorBoundary: {
      title: 'エラー',
      details: 'エラーがあります。',
      reportIt: 'これをレポートします',
      detailsHeading: '詳細',
      recoveredEntry: {
        heading: '回収された文書',
        warning: '遷移する前に、好きな所にこれをコピーとしてペーストしてください。',
        copyButtonLabel: 'クリップボードにコーピ',
      },
    },
    settingsDropdown: {
      logOut: 'ログアウト',
    },
    toast: {
      onFailToLoadEntries: '%{details}が読み込めません',
      onFailToLoadDeployPreview: '%{details}のプレビューが読み込めません',
      onFailToPersist: '%{details}が持続できません',
      onFailToDelete: '%{details}が削除できません',
      onFailToUpdateStatus: '%{details}のステータスが更新できません',
      missingRequiredField: '全て必定な項目を入力してください。',
      entrySaved: '保存完了',
      entryPublished: '公開完了',
      entryUnpublished: '未公開完了',
      onFailToPublishEntry: '%{details}が公開できません。',
      onFailToUnpublishEntry: '%{details}が未公開できません。',
      entryUpdated: '更新完了',
      onDeleteUnpublishedChanges: '削除完了',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: '読込中',
      workflowHeading: '編集ワークフロー',
      newPost: '新規作成',
      description:
        '%{smart_count}はレビューを待って、%{readyCount}はライブにレディしておきました。|||| %{smart_count}はレビューで待って、%{readyCount}はライブにレディしておきました。',
    },
    workflowCard: {
      lastChange: '%{date}に%{author}です',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: '作者：%{author}',
      deleteChanges: '削除',
      deleteNewEntry: '削除',
      publishChanges: '公開',
      publishNewEntry: '公開',
    },
    workflowList: {
      onDeleteEntry: 'このデーターを削除したいですか。',
      onPublishingNotReadyEntry:
        'レディデーターだけ公開できるので。公開できる為に、レディ列にカードをドラックしてください。',
      onPublishEntry: 'このデーターを公開したいですか。',
      draftHeader: 'ドラフト',
      inReviewHeader: 'レビュー中',
      readyHeader: 'レディ',
      currentEntries: '%{smart_count}のデーター |||| %{smart_count}のデーター',
    },
  },
};

export default ja;
