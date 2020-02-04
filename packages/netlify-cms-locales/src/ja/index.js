const ja = {
  auth: {
    login: 'ログイン',
    loggingIn: 'ログインしています...',
    loginWithNetlifyIdentity: 'Netlify Identity でログインする',
    errors: {
      email: 'メールアドレスを確認してください。',
      password: 'パスワードを入力してください。',
      identitySettings:
        '認証情報にアクセスできませんでした。git-gateway backend を利用している場合は、認証サービスと Git Gateway が有効になっているかを確認してください。',
    },
  },
  app: {
    header: {
      content: 'コンテンツ',
      workflow: 'ワークフロー',
      media: 'データ',
      quickAdd: '新規作成',
    },
    app: {
      errorHeader: 'CMS設定の読み込みエラー',
      configErrors: '設定エラー',
      checkConfigYml: 'config.ymlを確認してください。',
      loadingConfig: '設定を読み込んでいます...',
      waitingBackend: 'バックエンドの応答を待機しています...',
    },
    notFoundPage: {
      header: 'ページが見つかりません',
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
      loadingEntries: 'エントリを読み込み中',
      cachingEntries: 'エントリをキャッシュ中',
      longerLoading: '少々お待ちください',
    },
  },
  editor: {
    editorControlPane: {
      widget: {
        required: '%{fieldLabel}は必須です。',
        regexPattern: '%{fieldLabel}が入力規則（%{pattern}）と一致しません。',
        processing: '%{fieldLabel}を処理しています。',
        range: '%{fieldLabel}は%{minValue}から%{maxValue}まで入力可能です。',
        min: '%{fieldLabel}の最小値は%{minValue}です。',
        max: '%{fieldLabel}の最大値は%{maxValue}です。',
      },
    },
    editor: {
      onLeavePage: 'このページから遷移しますか？',
      onUpdatingWithUnsavedChanges:
        '変更した項目があります。ステータスを更新する前に保存してください。',
      onPublishingNotReady: '公開する前に、ステータスを「準備完了」に更新してください。',
      onPublishingWithUnsavedChanges: '変更した項目があります。公開する前に保存してください。',
      onPublishing: 'このエントリを公開しますか？',
      onUnpublishing: 'このエントリを未公開にしますか？',
      onDeleteWithUnsavedChanges:
        '保存されていない変更も削除されますが、この公開エントリを削除しますか？',
      onDeletePublishedEntry: 'この公開エントリを削除しますか？',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        '保存されていない変更も削除されますが、このエントリの未公開の変更を削除しますか？',
      onDeleteUnpublishedChanges:
        '公開されていない変更も削除されますが、このエントリを削除しますか？',
      loadingEntry: 'エントリの読込中...',
      confirmLoadBackup: 'ローカルのバックアップが復旧できました。利用しますか？',
    },
    editorToolbar: {
      publishing: '公開しています...',
      publish: '公開',
      published: '公開済',
      unpublish: '未公開',
      duplicate: '複製',
      unpublishing: '未公開にしています...',
      publishAndCreateNew: '公開して新規作成',
      publishAndDuplicate: '公開して複製する',
      deleteUnpublishedChanges: '未公開の変更を削除',
      deleteUnpublishedEntry: '未公開エントリを削除',
      deletePublishedEntry: '公開エントリを削除',
      deleteEntry: 'エントリを削除',
      saving: '保存中...',
      save: '保存',
      deleting: '削除しています...',
      updating: '更新しています...',
      setStatus: 'ステータスを変更する',
      backCollection: '%{collectionLabel}のエントリを作成中',
      unsavedChanges: '未保存',
      changesSaved: '保存済',
      draft: '下書き',
      inReview: 'レビュー中',
      ready: '準備完了',
      publishNow: '公開する',
      deployPreviewPendingButtonLabel: 'プレビューのチェック',
      deployPreviewButtonLabel: 'プレビューを見る',
      deployButtonLabel: 'ライブで見る',
    },
    editorWidgets: {
      markdown: {
        richText: 'リッチテキスト',
        markdown: 'マークダウン',
      },
      image: {
        choose: '画像を選択',
        chooseDifferent: '他の画像を選択',
        remove: '画像を削除',
      },
      file: {
        choose: 'ファイルを選択',
        chooseDifferent: '他のファイルを選択',
        remove: 'ファイルを削除',
      },
      unknownControl: {
        noControl: "'%{widget}'はウィジェットとして利用できません。",
      },
      unknownPreview: {
        noPreview: "'%{widget}'のウィジェットにはプレビューがありません。",
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: '下書き',
    },
    mediaLibrary: {
      onDelete: '選択しているデータを削除しますか？',
    },
    mediaLibraryModal: {
      loading: '読込中...',
      noResults: 'データがありません。',
      noAssetsFound: 'データがありません。',
      noImagesFound: 'データがありません。',
      private: 'プライベート',
      images: '画像',
      mediaAssets: 'データ',
      search: '検索',
      uploading: 'アップロード中...',
      uploadNew: 'アップロードする',
      deleting: '削除中...',
      deleteSelected: '削除する',
      chooseSelected: '選択する',
    },
  },
  ui: {
    errorBoundary: {
      title: 'エラー',
      details: 'エラーが発生しました。',
      reportIt: 'レポートする',
      detailsHeading: '詳細',
      recoveredEntry: {
        heading: '復旧したエントリ',
        warning: '必要あれば、このページから遷移する前にコピーしてください。',
        copyButtonLabel: 'クリップボードにコピー',
      },
    },
    settingsDropdown: {
      logOut: 'ログアウト',
    },
    toast: {
      onFailToLoadEntries: 'エントリの読み込みに失敗しました。%{details}',
      onFailToLoadDeployPreview: 'プレビューの読み込みに失敗しました。%{details}',
      onFailToPersist: 'エントリの保存に失敗しました。%{details}',
      onFailToDelete: 'エントリの削除に失敗しました。%{details}',
      onFailToUpdateStatus: 'エントリのステータス更新に失敗しました。%{details}',
      missingRequiredField: '全ての必須項目を入力してください。',
      entrySaved: '保存しました。',
      entryPublished: '公開しました。',
      entryUnpublished: '未公開にしました。',
      onFailToPublishEntry: 'エントリの公開に失敗しました。%{details}',
      onFailToUnpublishEntry: 'エントリを未公開にするのに失敗しました。%{details}',
      entryUpdated: 'エントリのステータスを更新しました。',
      onDeleteUnpublishedChanges: '未公開の変更を削除しました。',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'ワークフロー内のエントリを読込中',
      workflowHeading: 'ワークフロー',
      newPost: '新規作成',
      description: '%{smart_count}件がレビュー中、%{readyCount}件が準備完了です。',
    },
    workflowCard: {
      lastChange: '%{author}が%{date}に更新',
      lastChangeNoAuthor: '最終更新日：%{date}',
      lastChangeNoDate: '最終更新者：%{author}',
      deleteChanges: '変更を削除',
      deleteNewEntry: 'エントリを削除',
      publishChanges: '変更を公開',
      publishNewEntry: 'エントリを公開',
    },
    workflowList: {
      onDeleteEntry: 'このエントリを削除しますか？',
      onPublishingNotReadyEntry:
        '「準備完了」のエントリのみを公開できます。「準備完了」列にカードを移動し、ステータスを更新してください。',
      onPublishEntry: 'このエントリを公開しますか？',
      draftHeader: '下書き',
      inReviewHeader: 'レビュー中',
      readyHeader: '準備完了',
      currentEntries: '%{smart_count}件のエントリ',
    },
  },
};

export default ja;
