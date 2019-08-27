import { fromJS } from 'immutable';

export function getPhrases(overwritePhrases = {}) {
  const phrases = {
    app: {
      header: {
        content: 'Conteúdo',
        workflow: 'Fluxo de trabalho',
        media: 'Mídia',
        quickAdd: 'Adicionar',
      },
      app: {
        errorHeader: 'Erro ao carregar as configurações do CMS',
        configErrors: 'Erros de configuração',
        checkConfigYml: 'Verifique o arquivo config.yml',
        loadingConfig: 'Carregando configuração...',
        waitingBackend: 'Esperando backend...',
      },
      notFoundPage: {
        header: 'Não encontrado',
      },
    },
    collection: {
      sidebar: {
        collections: 'Coleções',
        searchAll: 'Procurar todas',
      },
      collectionTop: {
        viewAs: 'Ver como',
        newButton: 'Novo %{collectionLabel}',
      },
      entries: {
        loadingEntries: 'Carregando entradas',
        cachingEntries: 'Cacheando entradas',
        longerLoading: 'Isso pode levar alguns minutos',
      },
    },
    editor: {
      editorControlPane: {
        widget: {
          required: '%{fieldLabel} é obrigatório.',
          regexPattern: "%{fieldLabel} não obedece o padrão: %{pattern}.",
          processing: '%{fieldLabel} está sendo processado.',
          range: '%{fieldLabel} deve estar entre %{minValue} e %{maxValue}.',
          min: '%{fieldLabel} deve ser ao menos %{minValue}.',
          max: '%{fieldLabel} deve ser %{maxValue} ou menos.',
        },
      },
      editor: {
        onLeavePage: 'Tem certeza que deseja deixar esta página?',
        onUpdatingWithUnsavedChanges:
          'Você tem mudanças não salvas, salve antes de atualizar o status.',
        onPublishingNotReady: 'Atualize o status para "pronto" antes de publicar.',
        onPublishingWithUnsavedChanges: 'Você tem alterações não salvas, salve antes de publicar',
        onPublishing: 'Tem certeza que seseja publicar essa entrada?',
        onDeleteWithUnsavedChanges:
          'Tem certeza que deseja deletar essa entrada publicada e as alterações não salvas?',
        onDeletePublishedEntry: 'Tem certeza que deseja deletar',
        onDeleteUnpublishedChangesWithUnsavedChanges:
          'Isso vai deletar todas mudanças não salvas, você quer deletar?',
        onDeleteUnpublishedChanges:
          'Todas mudanças não publicadas serão deletadas. Você ainda quer deletar?',
        loadingEntry: 'Carregando entrada...',
        confirmLoadBackup: 'Um backup local foi recuperado, gostaria de utilizá-lo?',
      },
      editorToolbar: {
        publishing: 'Publicando...',
        publish: 'Publicar',
        published: 'Publicado',
        publishAndCreateNew: 'Publicar e criar novo item',
        deleteUnpublishedChanges: 'Deletar mudanças não publicadas',
        deleteUnpublishedEntry: 'Deletar entrada não publicada',
        deletePublishedEntry: 'Deletar entrada publicada',
        deleteEntry: 'Deletar entrada',
        saving: 'Salvando...',
        save: 'Salvo',
        deleting: 'Deletando...',
        updating: 'Atualizando...',
        setStatus: 'Definir status',
        backCollection: 'Escrevendo na coleção %{collectionLabel}',
        unsavedChanges: 'Mudanças não salvas',
        changesSaved: 'Mudanças salvas',
        draft: 'Rascunho',
        inReview: 'Em revisão',
        ready: 'Pronto',
        publishNow: 'Publicar',
        deployPreviewPendingButtonLabel: 'Verifcar se há preview',
        deployPreviewButtonLabel: 'Ver preview',
        deployButtonLabel: 'Ver ao vivo',
      },
      editorWidgets: {
        unknownControl: {
          noControl: "Não há controle no widget '%{widget}'.",
        },
        unknownPreview: {
          noPreview: "Sem preview para o widget '%{widget}'.",
        },
      },
    },
    mediaLibrary: {
      mediaLibrary: {
        onDelete: 'Tem certeza que deseja deletar a mídia selecionada?',
      },
      mediaLibraryModal: {
        loading: 'Carregando...',
        noResults: 'Sem resultados.',
        noAssetsFound: 'Nenhum ativo encontrado.',
        noImagesFound: 'Nenhuma imagem encontrada.',
        private: 'Privado ',
        images: 'Imagens',
        mediaAssets: 'Ativos de mídia',
        search: 'Procurando...',
        uploading: 'Fazendo upload...',
        uploadNew: 'Novo upload',
        deleting: 'Deletando...',
        deleteSelected: 'Deletar seleção',
        chooseSelected: 'Escolher seleção',
      },
    },
    ui: {
      errorBoundary: {
        title: 'Erro',
        details: "Ocorreu um erro - favor ",
        reportIt: 'reportar.',
        detailsHeading: 'Detalhes',
        recoveredEntry: {
          heading: 'Documento recuerado',
          warning: 'Favor salvar isso em algum lugar antes de sair!',
          copyButtonLabel: 'Copiar para a área de transferência',
        },
      },
      settingsDropdown: {
        logOut: 'Sair',
      },
      toast: {
        onFailToLoadEntries: 'Falha ao carregar: %{details}',
        onFailToLoadDeployPreview: 'Falha ao carregar preview: %{details}',
        onFailToPersist: 'Falha em: %{details}',
        onFailToDelete: 'Falha ao deletar entrada: %{details}',
        onFailToUpdateStatus: 'Falha ao atualizar o status: %{details}',
        missingRequiredField:
          "Você esqueceu um campo obrigatório, preencha antes de salvar.",
        entrySaved: 'Entrada salva',
        entryPublished: 'Entrada publicada',
        onFailToPublishEntry: 'Falha ao publicar: %{details}',
        entryUpdated: 'Status da entrada atualizada',
        onDeleteUnpublishedChanges: 'Mudanças não publicadas deletadas',
        onFailToAuth: '%{details}',
      },
    },
    workflow: {
      workflow: {
        loading: 'Carregando entradas do fluxo editorial',
        workflowHeading: 'Fluxo editorial',
        newPost: 'Novo post',
        description:
          '%{smart_count} Entrada esperando revisão, %{readyCount} pronto para produção. |||| %{smart_count} entradas esperando revisão, %{readyCount} prontas para produção. ',
      },
      workflowCard: {
        lastChange: '%{date} por %{author}',
        deleteChanges: 'Deletar mudanças',
        deleteNewEntry: 'Deletar nova entrada',
        publishChanges: 'Publicar mudanças',
        publishNewEntry: 'Publicar novas mudanças',
      },
      workflowList: {
        onDeleteEntry: 'Tem certeza que deseja deletar essa entrada?',
        onPublishingNotReadyEntry:
          'Apenas itens com status "pronto" podem ser publicados. Favor arrastar o card para a coluna "pronto" para permitir a publicação',
        onPublishEntry: 'Tem certeza que deseja publicar essa entrada?',
        draftHeader: 'Rascunhos',
        inReviewHeader: 'Em revisão',
        readyHeader: 'Pronto',
        currentEntries: '%{smart_count} entrada |||| %{smart_count} entradas',
      },
    },
  };
  return fromJS(phrases)
    .mergeDeep(overwritePhrases)
    .toJS();
}
