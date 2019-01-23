export function getPhrases() {
  return {
    app: {
      header: {
        content: 'Conteúdo',
        workflow: 'Fluxo Editorial',
        media: 'Mídia',
        quickAdd: 'Adicionar',
      },
      app: {
        errorHeader: 'Erro ao carregar configuração',
        configErrors: 'Erro na configuração',
        checkConfigYml: 'Olhe o arquivo config.yml',
        loadingConfig: 'Carregando configurações...',
        waitingBackend: 'Esperando o servidor...',
      },
      notFoundPage: {
        header: 'Não encontrado',
      },
    },
    collection: {
      sidebar: {
        collections: 'Coleções',
        searchAll: 'Pesquisar',
      },
      collectionTop: {
        viewAs: 'Visualização',
        newButton: 'Criar %{collectionLabel}',
      },
      entries: {
        loadingEntries: 'Carregando entradas',
        cachingEntries: 'Armazenando entradas',
        longerLoading: 'Isso pode demorar alguns minutos',
      },
    },
    editor: {
      editorControlPane: {
        widget: {
          required: '%{fieldLabel} é obrigatório.',
          regexPattern: '%{fieldLabel} não satisfaz o formato: %{pattern}.',
          processing: '%{fieldLabel} está sendo processado.',
        },
      },
      editor: {
        onLeavePage: 'Você tem certeza que deseja abandonar a página?',
        onUpdatingWithUnsavedChanges:
          'Você tem mudanças não salvas, salve-as antes de mudar o status.',
        onPublishingNotReady: 'Para publicar, mude o status para "Pronto".',
        onPublishingWithUnsavedChanges: 'Você tem mudanças não salvas, salve-as antes de publicar.',
        onPublishing: 'Você tem certeza que deseja publicar?',
        onDeleteWithUnsavedChanges: 'Você tem certeza que deseja deletar essa entrada?',
        onDeletePublishedEntry:
          'Você tem certeza que deseja deletar essa entrada? Ela já está publicada.',
        onDeleteUnpublishedChangesWithUnsavedChanges:
          'Essa ação vai deletar todas as mudanças nessa entrada, assim como as mudanças desta secção. Você ainda deseja deletar?',
        onDeleteUnpublishedChanges:
          'Todas as mudanças não publicadas referentes à essa entrada serão deletadas. Você ainda deseja deletar?',
        loadingEntry: 'Carregando entrada...',
      },
      editorToolbar: {
        publishing: 'Publicando...',
        publish: 'Publicar',
        published: 'Publicado',
        publishAndCreateNew: 'Publicar e criar mais um',
        deleteUnpublishedChanges: 'Apagar mudanças não publicadas',
        deleteUnpublishedEntry: 'Apagar entrada não publicada',
        deletePublishedEntry: 'Apagar entrada publicada',
        deleteEntry: 'Apagar entrada',
        saving: 'Salvando...',
        save: 'Salvar',
        deleting: 'Deletando...',
        updating: 'Atualizando...',
        setStatus: 'Definir status',
        backCollection: ' Voltar para %{collectionLabel}',
        unsavedChanges: 'Mudanças não salvas',
        changesSaved: 'Mudanças salvas',
        draft: 'Rascunho',
        inReview: 'Revisão',
        ready: 'Pronto',
        publishNow: 'Publicar agora',
      },
      editorWidgets: {
        unknownControl: {
          noControl: 'Não há controle para o widget "%{widget}".',
        },
        unknownPreview: {
          noPreview: 'Não há pre-visualização para o widget "%{widget}".',
        },
      },
    },
    mediaLibrary: {
      mediaLibrary: {
        onDelete: 'Você tem certeza que deseja apagar este arquivo?',
      },
      mediaLibraryModal: {
        loading: 'Carregando...',
        noResults: 'Sem resultados.',
        noAssetsFound: 'Nenhum arquivo encontrado.',
        noImagesFound: 'Nenhuma imagem encontrada.',
        private: 'Privado ',
        images: 'Imagens',
        mediaAssets: 'Arquivos de mídia',
        search: 'Pesquisar...',
        uploading: 'Subindo...',
        uploadNew: 'Subir novo',
        deleting: 'Apagando...',
        deleteSelected: 'Apagar selecionado(s)',
        chooseSelected: 'Escolher selecionado(s)',
      },
    },
    ui: {
      errorBoundary: {
        title: 'Sorry!',
        details: "There's been an error - please ",
        reportIt: 'report it!',
      },
      settingsDropdown: {
        logOut: 'Log Out',
      },
      toast: {
        onFailToLoadEntries: 'Falha ao carregar a entrada: %{details}',
        onFailToPersist: 'Falha ao salvar a entrada: %{details}',
        onFailToDelete: 'Falha ao remover entrada: %{details}',
        onFailToUpdateStatus: 'Falha ao atualizar entrada: %{details}',
        missingRequiredField: 'Campo requerido em branco',
        entrySaved: 'Entrada salva',
        entryPublished: 'Entrada publicada',
        onFailToPublishEntry: 'Falha ao publicar: %{details}',
        entryUpdated: 'Status alterado com sucesso',
        onDeleteUnpublishedChanges: 'Mudanças descartadas',
        onFailToAuth: 'Erro na autenticação: %{details}',
      },
    },
    workflow: {
      workflow: {
        loading: 'Carregando entradas do Fluxo Editorial',
        workflowHeading: 'Fluxo Editorial',
        newPost: 'Criar',
        description:
          '%{smart_count} entrada esperando revisão, %{readyCount} prontas. |||| %{smart_count} entradas esperando revisão, %{readyCount} prontas. ',
      },
      workflowCard: {
        lastChange: 'por %{author}, em %{date}',
        deleteChanges: 'Descartar mudanças',
        deleteNewEntry: 'Descartar entrada',
        publishChanges: 'Publicar mudanças',
        publishNewEntry: 'Publicar entrada',
      },
      workflowList: {
        onDeleteEntry: 'Você tem certeza que deseja apagar esta entrada?',
        onPublishingNotReadyEntry:
          'Apenas entradas na coluna "Pronto" podem ser publicadas. Arraste a entrada para a ultima coluna para habilitar a publicação',
        onPublishEntry: 'Você tem certeza que deseja publicar esta entrada?',
        draftHeader: 'Rascunhos',
        inReviewHeader: 'Em revisão',
        readyHeader: 'Pronto',
        currentEntries: '%{smart_count} entrada |||| %{smart_count} entradas',
      },
    },
  };
}
