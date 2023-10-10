"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
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
      password: 'Lütfen şifrenizi girin.',
      identitySettings: "Identity ayarlarına erişilemiyor. Git-gateway sunucusunu kullanmak için Identity servisi ve Git Gateway'in etkin olduğundan emin olun."
    }
  },
  app: {
    header: {
      content: 'İçerikler',
      workflow: 'İş Akışı',
      media: 'Medya',
      quickAdd: 'Hızlı ekle'
    },
    app: {
      errorHeader: 'CMS yapılandırması yüklenirken hata oluştu',
      configErrors: 'Yapılandırma Hataları',
      checkConfigYml: 'config.yml dosyanızı kontrol edin.',
      loadingConfig: 'Yapılandırma yükleniyor...',
      waitingBackend: 'Arka uç bekleniyor...'
    },
    notFoundPage: {
      header: 'Bulunamadı'
    }
  },
  collection: {
    sidebar: {
      collections: 'Koleksiyonlar',
      allCollections: 'Bütün Koleksiyonlar',
      searchAll: 'Tümünü ara',
      searchIn: 'İçinde ara'
    },
    collectionTop: {
      sortBy: 'Sırala ...',
      viewAs: 'Görüntüle',
      newButton: 'Yeni %{collectionLabel}',
      ascending: 'Artan',
      descending: 'Azalan',
      searchResults: '"%{searchTerm}" için Arama Sonuçları',
      searchResultsInCollection: '%{collection} koleksiyonunda, "%{searchTerm}" için Arama Sonuçları',
      filterBy: 'Filtrele',
      groupBy: 'Grupla'
    },
    entries: {
      loadingEntries: 'Girdiler yükleniyor...',
      cachingEntries: 'Girdi önbelleği...',
      longerLoading: 'Bu birkaç dakika sürebilir',
      noEntries: 'Hiç Girdi Yok'
    },
    groups: {
      other: 'Diğer',
      negateLabel: '%{label} hariç'
    },
    defaultFields: {
      author: {
        label: 'Yazar'
      },
      updatedOn: {
        label: 'Güncellenme Tarihi'
      }
    }
  },
  editor: {
    editorControl: {
      field: {
        optional: 'isteğe bağlı'
      }
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} gerekli.',
        regexPattern: '%{fieldLabel} eşleşmeyen kalıp: %{pattern}.',
        processing: '%{fieldLabel} işleniyor.',
        range: '%{fieldLabel} %{minValue} ve %{maxValue} arasında olmalı.',
        min: '%{fieldLabel} en az %{minValue} olmalı.',
        max: '%{fieldLabel}, %{maxValue} veya daha az olmalı.',
        rangeCount: '%{fieldLabel}, %{minCount} ve %{maxCount} öğeleri arasında olmalı.',
        rangeCountExact: '%{fieldLabel}, %{count} öğe olmalıdır.',
        rangeMin: '%{fieldLabel}, en az %{minCount} öğe olmalıdır.',
        rangeMax: '%{fieldLabel}, %{maxCount} veya daha az öğe olmalıdır.',
        invalidPath: `'%{path}' geçerli bir yol değil`,
        pathExists: `'%{path}' yolu zaten var`
      },
      i18n: {
        writingInLocale: '%{locale} için yazılıyor',
        copyFromLocale: 'Başka bir dilden doldurun',
        copyFromLocaleConfirm: 'Verileri %{locale} dilinden mi doldurmak istiyorsun?\nVarolan bütün verilerin üzerine yazılacak.'
      }
    },
    editor: {
      onLeavePage: 'Bu sayfadan ayrılmak istediğinize emin misiniz?',
      onUpdatingWithUnsavedChanges: 'Kaydedilmemiş değişiklikleriniz var, lütfen içeriği güncellemeden önce kaydedin.',
      onPublishingNotReady: 'Lütfen yayınlamadan önce içeriği "Hazır" olarak güncelleyin.',
      onPublishingWithUnsavedChanges: 'Kaydedilmemiş değişiklikleriniz var, lütfen yayınlamadan önce kaydedin.',
      onPublishing: 'Bu girdiyi yayınlamak istediğinize emin misiniz?',
      onUnpublishing: 'Bu girdiyi yayından kaldırmak istediğinizden emin misiniz?',
      onDeleteWithUnsavedChanges: 'Bu oturumda kaydedilmiş değişikliklerin yanı sıra geçerli oturumdaki kaydedilmemiş değişikliklerinizi silmek istediğinize emin misiniz?',
      onDeletePublishedEntry: 'Bu yayınlanmış girdiyi silmek istediğinize emin misiniz?',
      onDeleteUnpublishedChangesWithUnsavedChanges: 'Bu girdide yayınlanmamış tüm değişiklikleri ve geçerli oturumdaki kaydedilmemiş değişikliklerinizi siler. Hala silmek istiyor musun?',
      onDeleteUnpublishedChanges: 'Bu girdide yayınlanmamış tüm değişiklikler silinecek. Hala silmek istiyor musun?',
      loadingEntry: 'Girdiler yükleniyor...',
      confirmLoadBackup: 'Bu girdi için yerel bir yedekleme kurtarıldı, kullanmak ister misiniz?'
    },
    editorInterface: {
      toggleI18n: 'i18n değiştir',
      togglePreview: 'Önizlemeyi değiştir',
      toggleScrollSync: 'Kaydırmayı senkronize et'
    },
    editorToolbar: {
      publishing: 'Yayınlanıyor...',
      publish: 'Yayınla',
      published: 'Yayınlanan',
      unpublish: 'Yayından Kaldır',
      duplicate: 'Kopyala',
      unpublishing: 'Yayından kaldırılıyor...',
      publishAndCreateNew: 'Yayınla ve yeni oluştur',
      publishAndDuplicate: 'Yayınla ve kopya oluştur',
      deleteUnpublishedChanges: 'Yayımlanmamış değişiklikleri sil',
      deleteUnpublishedEntry: 'Yayımlanmamış girdiyi sil',
      deletePublishedEntry: 'Yayınlanan girdiyi sil',
      deleteEntry: 'Girdiyi sil',
      saving: 'Kaydediliyor...',
      save: 'Kaydet',
      statusInfoTooltipDraft: 'Giriş durumu taslak olarak ayarlandı. Girişi bitirmek ve incelemeye göndermek için giriş durumunu ‘İncelemede’ olarak ayarlayın',
      statusInfoTooltipInReview: 'Giriş gözden geçiriliyor, başka bir işlem yapılmasına gerek yok. Ancak, incelenirken yine de ek değişiklikler yapabilirsiniz.',
      deleting: 'Siliniyor...',
      updating: 'Güncelleniyor...',
      status: 'Durumu: %{status}',
      backCollection: ' %{collectionLabel} koleksiyonunda yazılı',
      unsavedChanges: 'Kaydedilmemiş Değişiklikler',
      changesSaved: 'Değişiklikler kaydedildi',
      draft: 'Taslak',
      inReview: 'İncelemede',
      ready: 'Hazır',
      publishNow: 'Şimdi yayımla',
      deployPreviewPendingButtonLabel: 'Önizlemeyi Denetle',
      deployPreviewButtonLabel: 'Önizlemeyi Görüntüle',
      deployButtonLabel: 'Canlı Görüntüle'
    },
    editorWidgets: {
      markdown: {
        bold: 'Kalın',
        italic: 'İtalik',
        code: 'Kod',
        link: 'Bağlantı',
        linkPrompt: "Bağlantının URL'sini girin",
        headings: 'Başlıklar',
        quote: 'Alıntı',
        bulletedList: 'Maddeli Liste',
        numberedList: 'Numaralı Liste',
        addComponent: 'Bileşen Ekle',
        richText: 'Zengin Metin',
        markdown: 'Markdown'
      },
      image: {
        choose: 'Bir resim seçin',
        chooseUrl: "URL'den ekle",
        replaceUrl: 'URL ile değiştir',
        promptUrl: "Resmin URL'sini girin",
        chooseDifferent: 'Farklı bir resim seçin',
        remove: 'Resmi kaldır'
      },
      file: {
        choose: 'Bir dosya seçin',
        chooseUrl: "URL'den ekle",
        replaceUrl: 'URL ile değiştir',
        promptUrl: "Dosyanın URL'sini girin",
        chooseDifferent: 'Farklı bir dosya seçin',
        remove: 'Dosyayı kaldır'
      },
      unknownControl: {
        noControl: "'%{widget}' bileşeni için kontrol yok."
      },
      unknownPreview: {
        noPreview: "'%{widget}' bileşeni için önizleme yok."
      },
      headingOptions: {
        headingOne: 'Başlık 1',
        headingTwo: 'Başlık 2',
        headingThree: 'Başlık 3',
        headingFour: 'Başlık 4',
        headingFive: 'Başlık 5',
        headingSix: 'Başlık 6'
      },
      datetime: {
        now: 'Şimdi'
      },
      list: {
        add: '%{item} Ekle',
        addType: '%{item} Ekle'
      }
    }
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Taslak',
      copy: 'Kopyala',
      copyUrl: 'URLyi Kopyala',
      copyPath: 'Dosya Yolunu Kopyala',
      copyName: 'Adını Kopyala',
      copied: 'Kopyalandı'
    },
    mediaLibrary: {
      onDelete: 'Seçilen medyayı silmek istediğinize emin misiniz?',
      fileTooLarge: 'Dosya çok büyük.\n%{size} kilobaytdan daha büyük dosyaların yüklenmemesi için ayarlanmış.'
    },
    mediaLibraryModal: {
      loading: 'Yükleniyor...',
      noResults: 'Sonuç yok.',
      noAssetsFound: 'Hiçbir dosya bulunamadı.',
      noImagesFound: 'Resim bulunamadı.',
      private: 'Özel ',
      images: 'Görseller',
      mediaAssets: 'Medya dosyaları',
      search: 'Ara...',
      uploading: 'Yükleniyor...',
      upload: 'Yükle',
      download: 'İndir',
      deleting: 'Siliniyor...',
      deleteSelected: 'Seçileni sil',
      chooseSelected: 'Seçileni kullan'
    }
  },
  ui: {
    default: {
      goBackToSite: 'Siteye geri git'
    },
    errorBoundary: {
      title: 'Hata',
      details: 'Bir hata oluştu - lütfen ',
      reportIt: 'GitHub üzerinde hata raporu aç.',
      detailsHeading: 'Ayrıntılar',
      privacyWarning: 'Bir hata raporu oluşturmak için gereken form otomatik olarak hata mesajı ve hata ayıklama verileriyle doldurulur.\nLütfen bilgilerin doğru olduğunu doğrulayın ve varsa hassas verileri kaldırın.',
      recoveredEntry: {
        heading: 'Kurtarılan belge',
        warning: 'Lütfen gitmeden önce bunu bir yere kopyalayın / yapıştırın!',
        copyButtonLabel: 'Panoya kopyala'
      }
    },
    settingsDropdown: {
      logOut: 'Çıkış Yap'
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
      onLoggedOut: 'Çıkış yaptınız, lütfen tüm verileri yedekleyin ve tekrar giriş yapın',
      onBackendDown: 'Arka uç hizmetinde bir kesinti yaşanıyor. Daha fazla bilgi için %{details} gör'
    }
  },
  workflow: {
    workflow: {
      loading: 'İş Akışı Girdileri Yükleniyor',
      workflowHeading: 'Editoryal İş Akışı',
      newPost: 'Yeni Mesaj',
      description: '%{smart_count} girdi incelemeyi bekliyor, %{readyCount} yayına hazır. |||| %{smart_count} girdi incelemeyi bekliyor, %{readyCount} yayınlanmaya hazır. ',
      dateFormat: 'MMMM D'
    },
    workflowCard: {
      lastChange: '%{date} tarafından %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: '%{author} tarafından',
      deleteChanges: 'Değişiklikleri sil',
      deleteNewEntry: 'Yeni girdiyi sil',
      publishChanges: 'Değişiklikleri yayınla',
      publishNewEntry: 'Yeni girdi yayınla'
    },
    workflowList: {
      onDeleteEntry: 'Bu girdiyi silmek istediğinize emin misiniz?',
      onPublishingNotReadyEntry: 'Yalnızca "Hazır" durumu olan öğeler yayınlanabilir. Lütfen yayınlamayı etkinleştirmek için kartı "Hazır" sütununa sürükleyin.',
      onPublishEntry: 'Bu girdiyi yayınlamak istediğinize emin misiniz?',
      draftHeader: 'Taslaklar',
      inReviewHeader: 'İncelemede',
      readyHeader: 'Hazır',
      currentEntries: '%{smart_count} girdi |||| %{smart_count} girdiler'
    }
  }
};
var _default = tr;
exports.default = _default;