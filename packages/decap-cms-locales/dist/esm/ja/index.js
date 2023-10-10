"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const ja = {
  auth: {
    login: 'ログイン',
    loggingIn: 'ログインしています...',
    loginWithNetlifyIdentity: 'Netlify Identity でログインする',
    loginWithAzure: 'Azure でログインする',
    loginWithBitbucket: 'Bitbucket でログインする',
    loginWithGitHub: 'GitHub でログインする',
    loginWithGitLab: 'GitLab でログインする',
    errors: {
      email: 'メールアドレスを確認してください。',
      password: 'パスワードを入力してください。',
      identitySettings: '認証情報にアクセスできませんでした。git-gateway backend を利用している場合は、認証サービスと Git Gateway が有効になっているかを確認してください。'
    }
  },
  app: {
    header: {
      content: 'コンテンツ',
      workflow: 'ワークフロー',
      media: 'メディア',
      quickAdd: '新規作成'
    },
    app: {
      errorHeader: 'CMS設定の読み込みエラー',
      configErrors: '設定エラー',
      checkConfigYml: 'config.ymlを確認してください。',
      loadingConfig: '設定を読み込んでいます...',
      waitingBackend: 'バックエンドの応答を待機しています...'
    },
    notFoundPage: {
      header: 'ページが見つかりません'
    }
  },
  collection: {
    sidebar: {
      collections: 'コレクション',
      allCollections: 'すべてのコレクション',
      searchAll: '検索',
      searchIn: '検索対象'
    },
    collectionTop: {
      sortBy: 'ソート',
      viewAs: '表示モード',
      newButton: '%{collectionLabel}を作成',
      ascending: '昇順',
      descending: '降順',
      searchResults: '「%{searchTerm}」の検索結果',
      searchResultsInCollection: '%{collection}内の「%{searchTerm}」の検索結果',
      filterBy: '絞り込み',
      groupBy: 'グルーピング'
    },
    entries: {
      loadingEntries: 'エントリを読み込み中',
      cachingEntries: 'エントリをキャッシュ中',
      longerLoading: '少々お待ちください',
      noEntries: 'エントリがありません'
    },
    groups: {
      other: 'その他',
      negateLabel: '%{label}以外'
    },
    defaultFields: {
      author: {
        label: '作成者'
      },
      updatedOn: {
        label: '最終更新'
      }
    }
  },
  editor: {
    editorControl: {
      field: {
        optional: '任意'
      }
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel}は必須です。',
        regexPattern: '%{fieldLabel}が入力規則（%{pattern}）と一致しません。',
        processing: '%{fieldLabel}を処理しています。',
        range: '%{fieldLabel}は%{minValue}から%{maxValue}まで入力可能です。',
        min: '%{fieldLabel}の最小値は%{minValue}です。',
        max: '%{fieldLabel}の最大値は%{maxValue}です。',
        rangeCount: '%{fieldLabel}は%{minCount}個から%{maxCount}個まで選択してください。',
        rangeCountExact: '%{fieldLabel}はちょうど%{count}個選択してください。',
        rangeMin: '%{fieldLabel}は%{minCount}個以上選択してください。',
        rangeMax: '%{fieldLabel}は%{maxCount}個以下選択してください。',
        invalidPath: `'%{path}'は有効なパスではありません。`,
        pathExists: `'%{path}'というパスはすでに存在しています。`
      },
      i18n: {
        writingInLocale: '言語: %{locale}'
      }
    },
    editor: {
      onLeavePage: 'このページから遷移しますか？',
      onUpdatingWithUnsavedChanges: '変更した項目があります。ステータスを更新する前に保存してください。',
      onPublishingNotReady: '公開する前に、ステータスを「準備完了」に更新してください。',
      onPublishingWithUnsavedChanges: '変更した項目があります。公開する前に保存してください。',
      onPublishing: 'このエントリを公開しますか？',
      onUnpublishing: 'このエントリを未公開にしますか？',
      onDeleteWithUnsavedChanges: '保存されていない変更も削除されますが、この公開エントリを削除しますか？',
      onDeletePublishedEntry: 'この公開エントリを削除しますか？',
      onDeleteUnpublishedChangesWithUnsavedChanges: '保存されていない変更も削除されますが、このエントリの未公開の変更を削除しますか？',
      onDeleteUnpublishedChanges: '公開されていない変更も削除されますが、このエントリを削除しますか？',
      loadingEntry: 'エントリの読込中...',
      confirmLoadBackup: 'ローカルのバックアップが復旧できました。利用しますか？'
    },
    editorInterface: {
      toggleI18n: '言語を切り替える',
      togglePreview: 'プレビュー表示を切り替える',
      toggleScrollSync: 'スクロール同期を切り替える'
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
      statusInfoTooltipDraft: 'エントリのステータスは下書きに設定されています。最終決定してレビューに提出するには、ステータスを「レビュー中」に設定します。',
      statusInfoTooltipInReview: 'エントリはレビュー中なので、それ以上のアクションは必要ありません。ただし、レビュー中でも追加の変更を行うことができます。',
      deleting: '削除しています...',
      updating: '更新しています...',
      status: 'ステータス: %{status}',
      backCollection: '%{collectionLabel}のエントリを作成中',
      unsavedChanges: '未保存',
      changesSaved: '保存済',
      draft: '下書き',
      inReview: 'レビュー中',
      ready: '準備完了',
      publishNow: '公開する',
      deployPreviewPendingButtonLabel: 'プレビューのチェック',
      deployPreviewButtonLabel: 'プレビューを見る',
      deployButtonLabel: 'ライブで見る'
    },
    editorWidgets: {
      markdown: {
        bold: '太字',
        italic: '斜体',
        code: 'コード',
        link: 'リンク',
        linkPrompt: 'リンクのURLを入力してください',
        headings: '見出し',
        quote: '引用',
        bulletedList: '箇条書き',
        numberedList: '番号付きリスト',
        addComponent: 'コンポーネント追加',
        richText: 'リッチテキスト',
        markdown: 'マークダウン'
      },
      image: {
        choose: '画像を選択',
        chooseUrl: 'URLを入力する',
        replaceUrl: 'URLを変更する',
        promptUrl: '画像のURLを入力してください',
        chooseDifferent: '他の画像を選択',
        remove: '画像を削除'
      },
      file: {
        choose: 'ファイルを選択',
        chooseUrl: 'URLを入力する',
        replaceUrl: 'URLを変更する',
        promptUrl: 'ファイルのURLを入力してください',
        chooseDifferent: '他のファイルを選択',
        remove: 'ファイルを削除'
      },
      unknownControl: {
        noControl: "'%{widget}'はウィジェットとして利用できません。"
      },
      unknownPreview: {
        noPreview: "'%{widget}'のウィジェットにはプレビューがありません。"
      },
      headingOptions: {
        headingOne: '見出し 1',
        headingTwo: '見出し 2',
        headingThree: '見出し 3',
        headingFour: '見出し 4',
        headingFive: '見出し 5',
        headingSix: '見出し 6'
      },
      datetime: {
        now: '現時刻'
      }
    }
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: '下書き',
      copy: 'コピー',
      copyUrl: 'URLをコピー',
      copyPath: 'パスをコピー',
      copyName: '名前をコピー',
      copied: 'コピーしました'
    },
    mediaLibrary: {
      onDelete: '選択しているデータを削除しますか？',
      fileTooLarge: 'ファイルサイズが大きすぎます。\n%{size} kB 以下にしてください。'
    },
    mediaLibraryModal: {
      loading: '読込中...',
      noResults: 'データがありません。',
      noAssetsFound: 'データがありません。',
      noImagesFound: 'データがありません。',
      private: 'プライベート',
      images: '画像',
      mediaAssets: 'メディア',
      search: '検索',
      uploading: 'アップロード中...',
      upload: 'アップロードする',
      download: 'ダウンロードする',
      deleting: '削除中...',
      deleteSelected: '削除する',
      chooseSelected: '選択する'
    }
  },
  ui: {
    default: {
      goBackToSite: 'サイトに戻る'
    },
    errorBoundary: {
      title: 'エラー',
      details: 'エラーが発生しました。',
      reportIt: 'レポートする',
      detailsHeading: '詳細',
      privacyWarning: 'エラーメッセージとデバッグのデータがレポートする前に表示されます。\n情報が正しいことを確認し、機密データが存在する場合は削除してください。',
      recoveredEntry: {
        heading: '復旧したエントリ',
        warning: '必要あれば、このページから遷移する前にコピーしてください。',
        copyButtonLabel: 'コピーする'
      }
    },
    settingsDropdown: {
      logOut: 'ログアウト'
    },
    toast: {
      onFailToLoadEntries: 'エントリの読み込みに失敗しました。%{details}',
      onFailToLoadDeployPreview: 'プレビューの読み込みに失敗しました。%{details}',
      onFailToPersist: 'エントリの保存に失敗しました。%{details}',
      onFailToDelete: 'エントリの削除に失敗しました。%{details}',
      onFailToUpdateStatus: 'エントリのステータス更新に失敗しました。%{details}',
      missingRequiredField: 'すべての必須項目を入力してください。',
      entrySaved: '保存しました。',
      entryPublished: '公開しました。',
      entryUnpublished: '未公開にしました。',
      onFailToPublishEntry: 'エントリの公開に失敗しました。%{details}',
      onFailToUnpublishEntry: 'エントリを未公開にするのに失敗しました。%{details}',
      entryUpdated: 'エントリのステータスを更新しました。',
      onDeleteUnpublishedChanges: '未公開の変更を削除しました。',
      onFailToAuth: '%{details}',
      onLoggedOut: 'ログアウトされています。データをバックアップし、再度ログインしてください。',
      onBackendDown: 'バックエンドのシステムが停止しています。%{details}'
    }
  },
  workflow: {
    workflow: {
      loading: 'ワークフロー内のエントリを読込中',
      workflowHeading: 'ワークフロー',
      newPost: '新規作成',
      description: '%{smart_count}件がレビュー中、%{readyCount}件が準備完了です。',
      dateFormat: 'M月D日'
    },
    workflowCard: {
      lastChange: '%{author}が%{date}に更新',
      lastChangeNoAuthor: '最終更新日：%{date}',
      lastChangeNoDate: '最終更新者：%{author}',
      deleteChanges: '変更を削除',
      deleteNewEntry: 'エントリを削除',
      publishChanges: '変更を公開',
      publishNewEntry: 'エントリを公開'
    },
    workflowList: {
      onDeleteEntry: 'このエントリを削除しますか？',
      onPublishingNotReadyEntry: '「準備完了」のエントリのみを公開できます。「準備完了」列にカードを移動し、ステータスを更新してください。',
      onPublishEntry: 'このエントリを公開しますか？',
      draftHeader: '下書き',
      inReviewHeader: 'レビュー中',
      readyHeader: '準備完了',
      currentEntries: '%{smart_count}件のエントリ'
    }
  }
};
var _default = ja;
exports.default = _default;