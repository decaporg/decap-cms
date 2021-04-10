const tr = {
  auth: {
    login: 'Giriş',
    loggingIn: 'Giriş yapılıyor..',
    loginWithNetlifyIdentity: 'Netlify Identity ile Giriş',
    loginWithAzure: 'Azure ile Giriş',
    loginWithBitbucket: 'Bitbucket ile Giriş',
    loginWithGitHub: 'GitHub ile Giriş',
    loginWithGitLab: 'GitLab ile Giriş',
    errors: {
      email: 'E-postanızı girdiğinizden emin olun.',
      password: 'Şifrenizi lütfen giriniz.',
      identitySettings:
        'Identity ayarlarına erişilemiyor. Git-gateway arka ucunu kullanırken Identity servisi ve Git Gateway etkin olduğundan emin olun.',
    },
  },
  app: {
    header: {
      content: 'İçerikler',
      workflow: 'İş Akışı',
      media: 'Medya',
      quickAdd: 'Hızlı ekle',
    },
    app: {
      errorHeader: 'CMS yapılandırması yüklenirken hata oluştu',
      configErrors: 'Yapılandırma Hataları',
      checkConfigYml: 'config.yml dosyanızı kontrol edin.',
      loadingConfig: 'Yapılandırma yükleniyor...',
      waitingBackend: 'Arka uç bekleniyor...',
    },
    notFoundPage: {
      header: 'Bulunamadı',
    },
  },
  collection: {
    sidebar: {
      collections: 'Koleksiyonlar',
      searchAll: 'Tümünü ara',
    },
    collectionTop: {
      viewAs: 'Görüntüle',
      newButton: 'Yeni %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Girdiler yükleniyor',
      cachingEntries: 'Girdi önbelleği',
      longerLoading: 'Bu birkaç dakika sürebilir',
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'seçmeli',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} zorunlu',
        regexPattern: '%{fieldLabel} eşleşmeyen kalıp: %{pattern}.',
        processing: '%{fieldLabel} işleniyor.',
        range: '%{fieldLabel} - %{minValue} ve %{maxValue} arasında olmalı.',
        min: '%{fieldLabel} en az %{minValue} olmalı.',
        max: '%{fieldLabel}, %{maxValue} veya daha az olmalı.',
        rangeCount: '%{fieldLabel}, %{minCount} ve %{maxCount} öğeleri arasında olmalı.',
        rangeCountExact: '%{fieldLabel}, %{count} öğe olmalıdır.',
        rangeMin: '%{fieldLabel}, en az %{minCount} öğe olmalıdır.',
        rangeMax: '%{fieldLabel}, %{maxCount} veya daha az öğe olmalıdır.',
      },
    },
    editor: {
      onLeavePage: 'Bu sayfadan ayrılmak istediğinize emin misiniz?',
      onUpdatingWithUnsavedChanges:
        'Kaydedilmemiş değişiklikleriniz var, lütfen içeriği güncellemeden önce kaydedin.',
      onPublishingNotReady: 'Lütfen yayınlamadan önce içeriği "Hazır" olarak güncelleyin.',
      onPublishingWithUnsavedChanges:
        'Kaydedilmemiş değişiklikleriniz var, lütfen yayınlamadan önce kaydedin.',
      onPublishing: 'Bu girdi yayınlamak istediğinize emin misiniz?',
      onUnpublishing: 'Bu girdi yayından kaldırmak istediğinizden emin misiniz?',
      onDeleteWithUnsavedChanges:
        'Bu oturumda kaydedilmiş değişikliklerin yanı sıra geçerli oturumdaki kaydedilmemiş değişikliklerinizi silmek istediğinize emin misiniz?',
      onDeletePublishedEntry: 'Bu yayınlanmış girdiyi silmek istediğinize emin misiniz?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Bu girdide yayınlanmamış tüm değişiklikleri ve geçerli oturumdaki kaydedilmemiş değişikliklerinizi siler. Hala silmek istiyor musun?',
      onDeleteUnpublishedChanges:
        'Bu girdide yayınlanmamış tüm değişiklikler silinecek. Hala silmek istiyor musun?',
      loadingEntry: 'Girdiler yükleniyor...',
      confirmLoadBackup: 'Bu girdi için yerel bir yedekleme kurtarıldı, kullanmak ister misiniz?',
    },
    editorToolbar: {
      publishing: 'Yayınlanıyor...',
      publish: 'Yayınla',
      published: 'Yayınlanan',
      unpublish: 'Yayından Kaldır',
      duplicate: 'Yayını Kopyala',
      unpublishing: 'Yayından kaldırılıyor...',
      publishAndCreateNew: 'Yayınla ve yeni oluştur',
      publishAndDuplicate: 'Yayınla ve kopya oluştur',
      deleteUnpublishedChanges: 'Yayımlanmamış değişiklikleri sil',
      deleteUnpublishedEntry: 'Yayımlanmamış girdiyi sil',
      deletePublishedEntry: 'Yayınlanan girdiyi sil',
      deleteEntry: 'Girdiyi sil',
      saving: 'Kaydediliyor...',
      save: 'Kayıt Et',
      deleting: 'Siliniyor...',
      updating: 'Güncelleniyor...',
      setStatus: 'Durumu ayarla',
      backCollection: '%{collectionLabel} koleksiyonunda yazılı',
      unsavedChanges: 'Kaydedilmemiş Değişiklikler',
      changesSaved: 'Değişiklikler kaydedildi',
      draft: 'Taslak',
      inReview: 'İncelemede',
      ready: 'Hazır',
      publishNow: 'Şimdi yayınla',
      deployPreviewPendingButtonLabel: 'Önizlemeyi Denetle',
      deployPreviewButtonLabel: 'Önizlemeyi Görüntüle',
      deployButtonLabel: 'Canlı Görüntüle',
    },
    editorWidgets: {
      markdown: {
        richText: 'Zengin Metin',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Bir resim seçin',
        chooseDifferent: 'Farklı bir resim seçin',
        remove: 'Resmi kaldır',
      },
      file: {
        choose: 'Bir dosya seçin',
        chooseDifferent: 'Farklı bir dosya seçin',
        remove: 'Dosyayı kaldır',
      },
      unknownControl: {
        noControl: "'%{widget}' Widget için kontrol yok.",
      },
      unknownPreview: {
        noPreview: "'%{widget}' Widget için önizleme yok.",
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
      draft: 'Taslak',
    },
    mediaLibrary: {
      onDelete: 'Seçilen medyayı silmek istediğinize emin misiniz?',
    },
    mediaLibraryModal: {
      loading: 'Yükleniyor...',
      noResults: 'Sonuç yok.',
      noAssetsFound: 'Hiçbir dosya bulunamadı.',
      noImagesFound: 'Resim bulunamadı.',
      private: 'Özel ',
      images: 'Görüntüler',
      mediaAssets: 'Medya dosyaları',
      search: 'Ara...',
      uploading: 'Yükleniyor...',
      upload: 'Yeni yükle',
      deleting: 'Siliniyor...',
      deleteSelected: 'Silme seçildi',
      chooseSelected: 'Seç',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Hata',
      details: 'Bir hata oluştu - lütfen ',
      reportIt: 'onu rapor et.',
      detailsHeading: 'Ayrıntılar',
      recoveredEntry: {
        heading: 'Kurtarılan belge',
        warning: 'Lütfen gitmeden önce bunu bir yere kopyalayın / yapıştırın!',
        copyButtonLabel: 'Panoya kopyala',
      },
    },
    settingsDropdown: {
      logOut: 'Çıkış Yap',
    },
    toast: {
      onFailToLoadEntries: 'Girdi yüklenemedi: %{details}',
      onFailToLoadDeployPreview: 'Önizleme yüklenemedi: %{details}',
      onFailToPersist: 'Girdi devam ettirilemedi: %{details}',
      onFailToDelete: 'Girdi silinemedi: %{details}',
      onFailToUpdateStatus: 'Durum güncellenemedi: %{details}',
      missingRequiredField: 'Gerekli bir alan eksik. Lütfen kaydetmeden önce tamamlayın.',
      entrySaved: 'Girdi kaydedildi',
      entryPublished: 'Girdi yayınlandı',
      entryUnpublished: 'Girdi yayınlanmamış',
      onFailToPublishEntry: 'Yayınlanamadı: %{details}',
      onFailToUnpublishEntry: 'Girdi yayından kaldırılamadı: %{details}',
      entryUpdated: 'Girdi durumu güncellendi',
      onDeleteUnpublishedChanges: 'Yayımlanmamış değişiklikler silindi',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'İş Akışı Girdileri Yükleniyor',
      workflowHeading: 'Editoryal İş Akışı',
      newPost: 'Yeni Mesaj',
      description:
        '%{smart_count} girdi incelemeyi bekliyor, %{readyCount} yayına hazır. |||| %{smart_count} girdi incelemeyi bekliyor, %{readyCount} yayınlanmaya hazır. ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} tarafından %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: '%{author} tarafından',
      deleteChanges: 'Değişiklikleri sil',
      deleteNewEntry: 'Yeni girdiyi sil',
      publishChanges: 'Değişiklikleri yayınla',
      publishNewEntry: 'Yeni girdi yayınla',
    },
    workflowList: {
      onDeleteEntry: 'Bu girdiyi silmek istediğinize emin misiniz?',
      onPublishingNotReadyEntry:
        'Yalnızca "Hazır" durumu olan öğeler yayınlanabilir. Lütfen yayınlamayı etkinleştirmek için kartı "Hazır" sütununa sürükleyin.',
      onPublishEntry: 'Bu girdiyi yayınlamak istediğinize emin misiniz?',
      draftHeader: 'Taslaklar',
      inReviewHeader: 'İncelemede',
      readyHeader: 'Hazır',
      currentEntries: '%{smart_count} girdi |||| %{smart_count} girdiler',
    },
  },
};

export default tr;
