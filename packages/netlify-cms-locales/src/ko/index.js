const ko = {
  auth: {
    login: '로그인',
    loggingIn: '로그인 중...',
    loginWithNetlifyIdentity: 'Netlify Identity 로 로그인',
    loginWithBitbucket: 'Bitbucket 으로 로그인',
    loginWithGitHub: 'GitHub 로 로그인',
    loginWithGitLab: 'GitLab 으로 로그인',
    errors: {
      email: '반드시 이메일을 입력해 주세요.',
      password: '암호를 입력해 주세요.',
      identitySettings:
        '설정에 접근할 수 없습니다. git-gateway 백엔드 사용시 Identity service와 Git Gateway를 활성화 해야 합니다.',
    },
  },
  app: {
    header: {
      content: '콘텐츠',
      workflow: '워크플로우',
      media: '미디어',
      quickAdd: '빠른 추가',
    },
    app: {
      errorHeader: 'CMS 구성을 불러오는 중 오류가 발생했습니다.',
      configErrors: '구성 오류',
      checkConfigYml: 'config.yml 파일을 확인하세요.',
      loadingConfig: '구성 불러오는 중...',
      waitingBackend: '백엔드 기다리는 중...',
    },
    notFoundPage: {
      header: '찾을 수 없음',
    },
  },
  collection: {
    sidebar: {
      collections: '컬렉션',
      allCollections: '모든 컬렉션',
      searchAll: '모든 컬렉션에서 검색',
      searchIn: '다음 컬렉션에서 검색',
    },
    collectionTop: {
      sortBy: '정렬 기준',
      viewAs: '다음으로 보기',
      newButton: '새 %{collectionLabel} 항목',
      ascending: '오름차순',
      descending: '내림차순',
      searchResults: '"%{searchTerm}"에 대한 검색결과',
      searchResultsInCollection: '%{collection} 컬랙션에서 "%{searchTerm}"에 대한 검색결과',
      filterBy: '필터 기준',
    },
    entries: {
      loadingEntries: '항목 불러오는 중...',
      cachingEntries: '항목 캐시 중...',
      longerLoading: '몇 분 정도 걸릴 수 있습니다.',
      noEntries: '항목 없음',
    },
    defaultFields: {
      author: {
        label: '저자',
      },
      updatedOn: {
        label: '업데이트 시각',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: '선택사항',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} 은(는) 필수입니다.',
        regexPattern: '%{fieldLabel} 이(가) %{pattern} 패턴과 일치하지 않습니다.',
        processing: '%{fieldLabel} 은(는) 처리중 입니다.',
        range: '%{fieldLabel} 은(는) 반드시 %{minValue} 에서 %{maxValue} 사이여야 합니다.',
        min: '%{fieldLabel} 은(는) 적어도 %{minValue} 이상 이여야 합니다.',
        max: '%{fieldLabel} 은(는) 최대 %{maxValue} 여야 합니다.',
        rangeCount: '%{fieldLabel} 개수는 %{minCount} 개 에서 %{maxCount} 개 사이여야 합니다.',
        rangeCountExact: '%{fieldLabel} 개수는 정확히 %{count} 개 여야 합니다.',
        rangeMin: '%{fieldLabel} 개수는 적어도 %{minCount} 개 이상 이여야 합니다.',
        rangeMax: '%{fieldLabel} 개수는 최대 %{maxCount} 개 여야 합니다.',
        invalidPath: `'%{path}' 은(는) 올바른 경로가 아닙니다.`,
        pathExists: `'%{path}' 경로가 이미 존재합니다.`,
      },
    },
    editor: {
      onLeavePage: '이 페이지를 떠나시겠습니까?',
      onUpdatingWithUnsavedChanges:
        '저장하지 않은 변경사항이 있습니다. 상태 업데이트 전 먼저 저장하세요.',
      onPublishingNotReady: '게시 하기 앞서 상태를 "준비됨" 으로 업데이트 하세요.',
      onPublishingWithUnsavedChanges:
        '저장하지 않은 변경사항이 있습니다, 게시하기 전 먼저 저장하세요.',
      onPublishing: '이 항목을 게시하시곘습니까?',
      onUnpublishing: '이 항목을 게시 철회 하시겠습니까?',
      onDeleteWithUnsavedChanges:
        '현재 세션에서의 저장되지 않은 변경사항과 이 게시된 항목을 삭제하시겠습니까?',
      onDeletePublishedEntry: '이 게시된 항목을 삭제하시겠습니까?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        '이 항목의 게시되지 않은 모든 변경사항과 현재 세션의 저장되지 않은 변경사항이 삭제됩니다. 정말로 삭제하시겠습니까?',
      onDeleteUnpublishedChanges:
        '이 항목에 대해 게시되지 않은 변경사항이 삭제됩니다. 정말로 삭제하시겠습니까?',
      loadingEntry: '항목 불러오는 중...',
      confirmLoadBackup:
        '이 항목에 대한 로컬 백업이 복구되었습니다, 복구된 것으로 사용하시겠습니까?',
    },
    editorToolbar: {
      publishing: '게시 중...',
      publish: '게시',
      published: '게시됨',
      unpublish: '게시 철회',
      duplicate: '복제',
      unpublishing: '게시 철회 중...',
      publishAndCreateNew: '게시하고 새로 만들기',
      publishAndDuplicate: '게시하고 복제',
      deleteUnpublishedChanges: '게시 안된 변경사항 삭제',
      deleteUnpublishedEntry: '게시 안된 항목 삭제',
      deletePublishedEntry: '게시된 항목 삭제',
      deleteEntry: '항목 삭제',
      saving: '저장 중...',
      save: '저장',
      deleting: '삭제 중...',
      updating: '업데이트 중...',
      setStatus: '상태 설정',
      backCollection: '%{collectionLabel} 컬랙션에 작성하는 중',
      unsavedChanges: '변경사항 저장되지 않음',
      changesSaved: '변경사항 저장됨',
      draft: '초안',
      inReview: '검토중',
      ready: '준비됨',
      publishNow: '지금 게시',
      deployPreviewPendingButtonLabel: '미리보기 확인',
      deployPreviewButtonLabel: '미리보기 보기',
      deployButtonLabel: '라이브 보기',
    },
    editorWidgets: {
      markdown: {
        richText: '리치 텍스트',
        markdown: '마크다운',
      },
      image: {
        choose: '이미지 선택',
        chooseDifferent: '다른 이미지 선택',
        remove: '이미지 삭제',
      },
      file: {
        choose: '파일 선택',
        chooseDifferent: '다른 파일 선택',
        remove: '파일 삭제',
      },
      unknownControl: {
        noControl: "'%{widget}' 위젝에 대한 컨트롤이 없습니다.",
      },
      unknownPreview: {
        noPreview: "'%{widget}' 위젯에 대한 미리보기가 없습니다.",
      },
      headingOptions: {
        headingOne: '제목 1',
        headingTwo: '제목 2',
        headingThree: '제목 3',
        headingFour: '제목 4',
        headingFive: '제목 5',
        headingSix: '제목 6',
      },
      datetime: {
        now: '현재시각',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: '초안',
    },
    mediaLibrary: {
      onDelete: '선택하신 미디어를 삭제하시겠습니까?',
      fileTooLarge:
        '파일이 너무 큽니다.\n%{size} kB 보다 큰 파일을 허용하지 않도록 구성되어 있습니다.',
    },
    mediaLibraryModal: {
      loading: '불러오는 중...',
      noResults: '일치 항목 없음.',
      noAssetsFound: '발견된 에셋 없음.',
      noImagesFound: '발견된 이미지 없음.',
      private: '개인 ',
      images: '이미지',
      mediaAssets: '미디어 에셋',
      search: '검색...',
      uploading: '업로드 중...',
      upload: '업로드',
      download: '다운로드',
      deleting: '삭제 중...',
      deleteSelected: '선택항목 삭제',
      chooseSelected: '선택한 것으로 결정',
    },
  },
  ui: {
    default: {
      goBackToSite: '사이트로 돌아가기',
    },
    errorBoundary: {
      title: '오류',
      details: '오류가 발생했습니다.',
      reportIt: 'GitHub에서 이슈를 열어 보고해 주세요.',
      detailsHeading: '자세한 내용',
      privacyWarning:
        '이슈를 열면 사전에 오류 메시지와 디버깅 데이터로 채워집니다.\n정보가 올바른지 확인하시고 민감한 정보가 있다면 지워주세요.',
      recoveredEntry: {
        heading: '복구된 문서',
        warning: '다른 곳으로 가시기 전에 이 내용을 꼭 복사해두세요!',
        copyButtonLabel: '클립보드로 복사',
      },
    },
    settingsDropdown: {
      logOut: '로그아웃',
    },
    toast: {
      onFailToLoadEntries: '항목 불러오기 실패: %{details}',
      onFailToLoadDeployPreview: '미리보기 불러오기 실패: %{details}',
      onFailToPersist: '항목 저장 실패: %{details}',
      onFailToDelete: '항목 삭제 실패: %{details}',
      onFailToUpdateStatus: '상태 업데이트 실패: %{details}',
      missingRequiredField: '이런! 필수 필드를 놓치셨습니다. 저장하기 전에 먼저 채우세요.',
      entrySaved: '항목 저장됨',
      entryPublished: '항목 게시됨',
      entryUnpublished: '항목 게시 철회됨',
      onFailToPublishEntry: '게시 실패: %{details}',
      onFailToUnpublishEntry: '항목 게시 철회 실해: %{details}',
      entryUpdated: '항목 상태 업데이트됨',
      onDeleteUnpublishedChanges: '게시되지 않은 변경사항 삭제됨',
      onFailToAuth: '%{details}',
      onLoggedOut: '로그아웃 하셨습니다, 데티어를 백업하시고 다시 로그인 하세요.',
      onBackendDown:
        '백엔드 서비스가 장애를 겪고 있습니다. 자세한 사항은 %{details} 을(를) 참고하세요.',
    },
  },
  workflow: {
    workflow: {
      loading: '편집 워크플로우의 항목을 불러오는 중',
      workflowHeading: '편집 워크플로우',
      newPost: '새 게시물',
      description:
        '%{smart_count}개 항목 검토 대기중, %{readyCount}개 항목 게시 준비 완료됨. |||| %{smart_count}개 항목 검토 대기중, %{readyCount}개 항목 게시 준비 완료됨. ',
      dateFormat: 'M월 D일',
    },
    workflowCard: {
      lastChange: '%{date} by %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'by %{author}',
      deleteChanges: '변경사항 삭제',
      deleteNewEntry: '새 항목 삭제',
      publishChanges: '변경사항 게시',
      publishNewEntry: '새 항목 게시',
    },
    workflowList: {
      onDeleteEntry: 'Are you sure you want to delete this entry?',
      onPublishingNotReadyEntry:
        '"준비됨" 상태의 항목만 게시할 수 있습니다. 게시를 활성화 하려면 카드를 "준비됨" 열에 끌어 놓으세요.',
      onPublishEntry: '이 항목을 게시하시곘습니까?',
      draftHeader: '초안',
      inReviewHeader: '검토 진행중',
      readyHeader: '준비됨',
      currentEntries: '%{smart_count}개 항목 |||| %{smart_count}개 항목',
    },
  },
};

export default ko;
