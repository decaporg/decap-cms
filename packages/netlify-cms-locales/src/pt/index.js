const pt = {
  app: {
    header: {
      content: 'Conteúdos',
      workflow: 'Fluxo de Trabalho',
      media: 'Media',
      quickAdd: 'Adição rápida',
    },
    app: {
      errorHeader: 'Erro ao carregar a confuguração do CMS',
      configErrors: 'Erros de configuração',
      checkConfigYml: 'Verifique o arquivo config.yml.',
      loadingConfig: 'Carregando configuração...',
      waitingBackend: 'Aguardando o backend...',
    },
    notFoundPage: {
      header: 'Não Encontrado',
    },
  },
  collection: {
    sidebar: {
      collections: 'Coleções',
      searchAll: 'Pesquisar em todos',
    },
    collectionTop: {
      viewAs: 'Visualizar como',
      newButton: 'Novo(a) %{collectionLabel}',
    },
    entries: {
      loadingEntries: 'Carregando Entradas',
      cachingEntries: 'Armazenando Entradas em Cache',
      longerLoading: 'Isso pode levar alguns minutos',
    },
  },
  editor: {
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} é requerido(a).',
        regexPattern: '%{fieldLabel} não corresponde com o padrão: %{pattern}.',
        processing: '%{fieldLabel} está processando.',
        range: '%{fieldLabel} deve estar entre %{minValue} e %{maxValue}.',
        min: '%{fieldLabel} deve ser, no mínimo, %{minValue}.',
        max: '%{fieldLabel} deve ser igual ou menos que %{maxValue}.',
      },
    },
    editor: {
      onLeavePage: 'Tem certeza que deseja sair dessa página?',
      onUpdatingWithUnsavedChanges:
        'Há mudanças não salvas. Por favor, salve-as antes de atualizar o status.',
      onPublishingNotReady: 'Por favor, altere o status para "Pronto" antes de publicar.',
      onPublishingWithUnsavedChanges:
        'Há mudanças não salvas. Por favor, salve-as antes de publicar.',
      onPublishing: 'Tem certeza que deseja publicar essa entrada?',
      onUnpublishing: 'Tem certeza que deseja cancelar a publicação dessa entrada?',
      onDeleteWithUnsavedChanges:
        'Tem certeza de que deseja excluir esta entrada publicada, bem como as alterações não salvas da sessão atual?',
      onDeletePublishedEntry: 'Tem certeza de que deseja excluir esta entrada publicada?',
      onDeleteUnpublishedChangesWithUnsavedChanges:
        'Isso excluirá todas as alterações não publicadas nesta entrada, bem como as alterações não salvas da sessão atual. Você ainda deseja excluir?',
      onDeleteUnpublishedChanges:
        'Todas as alterações não publicadas nesta entrada serão excluídas. Você ainda deseja excluir?',
      loadingEntry: 'Carregando entrada...',
      confirmLoadBackup: 'Um backup local foi recuperado para esta entrada. Deseja usá-lo?',
    },
    editorToolbar: {
      publishing: 'Publicando...',
      publish: 'Publicar',
      published: 'Publicado',
      unpublish: 'Despublicar',
      duplicate: 'Duplicado',
      unpublishing: 'Despublicando...',
      publishAndCreateNew: 'Publicar e criar novo(a)',
      publishAndDuplicate: 'Publicar e duplicar',
      deleteUnpublishedChanges: 'Excluir alterações não publicadas',
      deleteUnpublishedEntry: 'Excluir entrada não publicada',
      deletePublishedEntry: 'Excluir entrada publicada',
      deleteEntry: 'Excluir entrada',
      saving: 'Salvando...',
      save: 'Salvar',
      deleting: 'Deletando...',
      updating: 'Atualizando...',
      setStatus: 'Definir status',
      backCollection: ' Escrevando na coleção %{collectionLabel}',
      unsavedChanges: 'Alterções não salvas',
      changesSaved: 'Alterações salvas',
      draft: 'Rascunho',
      inReview: 'Em revisão',
      ready: 'Pronto',
      publishNow: 'Publicar agora',
      deployPreviewPendingButtonLabel: 'Verificar se há Pré-visualização',
      deployPreviewButtonLabel: 'Ver Pré-visualização',
      deployButtonLabel: 'Ver em Produção',
    },
    editorWidgets: {
      unknownControl: {
        noControl: "Nenhum controle para o widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Nenhuma pré-visualização para o widget '%{widget}'.",
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Rascunho',
    },
    mediaLibrary: {
      onDelete: 'Tem certeza de que deseja excluir a mídia selecionada?',
    },
    mediaLibraryModal: {
      loading: 'Carregando...',
      noResults: 'Nenhum resultado.',
      noAssetsFound: 'Nenhum recurso encontrado.',
      noImagesFound: 'Nenhuma imagem encontrada.',
      private: 'Privado ',
      images: 'Imagens',
      mediaAssets: 'Recursos de mídia',
      search: 'Pesquisar...',
      uploading: 'Enviando...',
      uploadNew: 'Enviar novo',
      deleting: 'Deletando...',
      deleteSelected: 'Excluir selecionado',
      chooseSelected: 'Escolher selecionado',
    },
  },
  ui: {
    errorBoundary: {
      title: 'Erro',
      details: 'Ocorreu um erro - por favor ',
      reportIt: 'rekate-o.',
      detailsHeading: 'Detalhes',
      recoveredEntry: {
        heading: 'Documento recuperado',
        warning: 'Copie/cole isso em algum lugar antes de navegar!',
        copyButtonLabel: 'Copiar para área de transferência',
      },
    },
    settingsDropdown: {
      logOut: 'Sair',
    },
    toast: {
      onFailToLoadEntries: 'Falha ao carregar a entrada: %{details}',
      onFailToLoadDeployPreview: 'Falha ao carregar a pré-visualização: %{details}',
      onFailToPersist: 'Falha ao persistir na entrada: %{details}',
      onFailToDelete: 'Falha ao excluir a entrada: %{details}',
      onFailToUpdateStatus: 'Falha ao atualizar status: %{details}',
      missingRequiredField:
        'Ops, você perdeu um campo obrigatório. Por favor, preencha antes de salvar.',
      entrySaved: 'Entrada salva',
      entryPublished: 'Entrada publicada',
      entryUnpublished: 'Entrada despublicada',
      onFailToPublishEntry: 'Falha ao publicar: %{details}',
      onFailToUnpublishEntry: 'Falha ao cancelar a publicação da entrada: %{details}',
      entryUpdated: 'Status da entrada atualizado',
      onDeleteUnpublishedChanges: 'Alterações não publicadas excluídas',
      onFailToAuth: '%{details}',
    },
  },
  workflow: {
    workflow: {
      loading: 'Carregando entradas do Fluxo de Trabalho Editorial',
      workflowHeading: 'Fluxo de Trabalho Editorial',
      newPost: 'Nova Publicação',
      description:
        '%{smart_count} entrada aguardando revisão, %{readyCount} pronta para publicação. |||| %{smart_count} entradas aguardando revisão, %{readyCount} pronta para publicação.',
    },
    workflowCard: {
      lastChange: '%{date} por %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'por %{author}',
      deleteChanges: 'Excluir alterações',
      deleteNewEntry: 'Excluir nova entrada',
      publishChanges: 'Publicar alterações',
      publishNewEntry: 'Publicar nova entrada',
    },
    workflowList: {
      onDeleteEntry: 'Tem certeza de que deseja excluir esta entrada?',
      onPublishingNotReadyEntry:
        'Somente itens com o status "Pronto" podem ser publicados. Arraste o cartão para a coluna "Pronto" para poder publicar.',
      onPublishEntry: 'Tem certeza de que quer publicar esta entrada?',
      draftHeader: 'Rascunhos',
      inReviewHeader: 'Em Revisão',
      readyHeader: 'Prontos',
      currentEntries: '%{smart_count} entrada |||| %{smart_count} entradas',
    },
  },
};

export default pt;
