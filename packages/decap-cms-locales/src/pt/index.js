const pt = {
  auth: {
    login: 'Entrar',
    loggingIn: 'Entrando...',
    loginWithNetlifyIdentity: 'Entrar com o Netlify Identity',
    loginWithAzure: 'Entrar com o Azure',
    loginWithBitbucket: 'Entrar com o Bitbucket',
    loginWithGitHub: 'Entrar com o GitHub',
    loginWithGitLab: 'Entrar com o GitLab',
    loginWithGitea: 'Entrar com o Gitea',
    errors: {
      email: 'Certifique-se de inserir seu e-mail.',
      password: 'Por favor, insira sua senha.',
      identitySettings:
        'Não foi possível acessar as configurações de identidade. Ao usar o back-end git-gateway, certifique-se de habilitar o serviço Identity e o Git Gateway.',
    },
  },
  app: {
    header: {
      content: 'Conteúdos',
      workflow: 'Fluxo de Trabalho',
      media: 'Mídia',
      quickAdd: 'Adição rápida',
    },
    app: {
      errorHeader: 'Erro ao carregar a configuração do CMS',
      configErrors: 'Erros de configuração',
      checkConfigYml: 'Verifique o arquivo config.yml.',
      loadingConfig: 'Carregando configuração...',
      waitingBackend: 'Aguardando o back-end...',
    },
    notFoundPage: {
      header: 'Não Encontrado',
    },
  },
  collection: {
    sidebar: {
      collections: 'Coleções',
      allCollections: 'Todas as Coleções',
      searchAll: 'Pesquisar em todos',
      searchIn: 'Pesquisar em',
    },
    collectionTop: {
      sortBy: 'Ordenar por',
      viewAs: 'Visualizar como',
      newButton: 'Novo(a) %{collectionLabel}',
      ascending: 'Ascendente',
      descending: 'Descendente',
      searchResults: 'Resultados da busca por "%{searchTerm}"',
      searchResultsInCollection: 'Resultados da busca por "%{searchTerm}" em %{collection}',
      filterBy: 'Filtrar por',
      groupBy: 'Agrupar por',
    },
    entries: {
      loadingEntries: 'Carregando Entradas',
      cachingEntries: 'Armazenando Entradas em Cache',
      longerLoading: 'Isso pode levar alguns minutos',
      noEntries: 'Nenhuma Entrada',
    },
    groups: {
      other: 'Outro',
      negateLabel: 'Não %{label}',
    },
    defaultFields: {
      author: {
        label: 'Autor',
      },
      updatedOn: {
        label: 'Atualizado em',
      },
    },
  },
  editor: {
    editorControl: {
      field: {
        optional: 'opcional',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} é obrigatório.',
        regexPattern: '%{fieldLabel} não corresponde com o padrão: %{pattern}.',
        processing: '%{fieldLabel} está processando.',
        range: '%{fieldLabel} deve estar entre %{minValue} e %{maxValue}.',
        min: '%{fieldLabel} deve ser, no mínimo, %{minValue}.',
        max: '%{fieldLabel} deve ser igual ou menor que %{maxValue}.',
        rangeCount: '%{fieldLabel} deve ser entre %{minCount} e %{maxCount}.',
        rangeCountExact: '%{fieldLabel} deve ser exatamente %{count}.',
        rangeMin: '%{fieldLabel} deve ter, pelo menos, %{minCount}.',
        rangeMax: '%{fieldLabel} deve ter %{maxCount} ou menos.',
        invalidPath: `'%{path}' não é um caminho válido`,
        pathExists: `O caminho '%{path}' já existe`,
      },
      i18n: {
        writingInLocale: 'Escrevendo em %{locale}',
      },
    },
    editor: {
      onLeavePage: 'Tem certeza que deseja sair desta página?',
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
    editorInterface: {
      toggleI18n: 'Mudar i18n',
      togglePreview: 'Mudar pré-visualização',
      toggleScrollSync: 'Sincronizar rolagem',
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
      statusInfoTooltipDraft:
        "Entrada definida como rascunho. Para finalizar e enviá-la a revisão, mude seu estado para 'Em revisão'",
      statusInfoTooltipInReview:
        'Entrada está sendo revisada, nenhuma ação extra é requirida. Porém, você ainda pode fazer mudanças adicionais enquanto ela está sendo revisada.',
      deleting: 'Excluindo...',
      updating: 'Atualizando...',
      status: 'Status: %{status}',
      backCollection: ' Escrevendo na coleção %{collectionLabel}',
      unsavedChanges: 'Alterações não salvas',
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
      markdown: {
        bold: 'Negrito',
        italic: 'Itálico',
        code: 'Código',
        link: 'Link',
        linkPrompt: 'Insira a URL do link',
        headings: 'Cabeçalho',
        quote: 'Citação',
        bulletedList: 'Lista Pontilhada',
        numberedList: 'Lista Numerada',
        addComponent: 'Adicionar Componente',
        richText: 'Rich Text',
        markdown: 'Markdown',
      },
      image: {
        choose: 'Escolha uma imagem',
        chooseUrl: 'Inserir de uma URL',
        replaceUrl: 'Substituir com uma URL',
        promptUrl: 'Insira a URL da imagem',
        chooseDifferent: 'Escolha uma imagem diferente',
        remove: 'Remover imagem',
      },
      file: {
        choose: 'Escolha um arquivo',
        chooseUrl: 'Inserir de uma URL',
        replaceUrl: 'Substituir com uma URL',
        promptUrl: 'Insira a URL do arquivo',
        chooseDifferent: 'Escolha um arquivo diferente',
        remove: 'Remover arquivo',
      },
      unknownControl: {
        noControl: "Nenhum controle para o widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Nenhuma pré-visualização para o widget '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Título nível 1',
        headingTwo: 'Título nível 2',
        headingThree: 'Título nível 3',
        headingFour: 'Título nível 4',
        headingFive: 'Título nível 5',
        headingSix: 'Título nível 6',
      },
      datetime: {
        now: 'Agora',
        clear: 'Limpar',
      },
      list: {
        add: 'Adicionar %{item}',
        addType: 'Adicionar %{item} item',
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Rascunho',
      copy: 'Copiar',
      copyUrl: 'Copiar URL',
      copyPath: 'Copiar Caminho',
      copyName: 'Copiar Nome',
      copied: 'Copiado',
    },
    mediaLibrary: {
      onDelete: 'Tem certeza de que deseja excluir a mídia selecionada?',
      fileTooLarge:
        'Arquivo muito grande.\nConfigurado para não permitir arquivos maiores que %{size} kB.',
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
      upload: 'Enviar novo',
      download: 'Download',
      deleting: 'Excluindo...',
      deleteSelected: 'Excluir selecionado',
      chooseSelected: 'Escolher selecionado',
    },
  },
  ui: {
    default: {
      goBackToSite: 'Voltar ao site',
    },
    errorBoundary: {
      title: 'Erro',
      details: 'Ocorreu um erro - por favor ',
      reportIt: 'relatar.',
      detailsHeading: 'Detalhes',
      privacyWarning:
        'Ao abrir uma issue, ela é preenchida com a mensagem de erro e o log de debug.\nPor favor, verifique se a informação está correta e remova dados sensíveis caso existam.',
      recoveredEntry: {
        heading: 'Documento recuperado',
        warning: 'Copie/cole isso em algum lugar antes de sair!',
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
      onLoggedOut: 'Você foi desconectado. Por favor, salve as alterações e entre novamente',
      onBackendDown: 'O serviço de back-end está fora do ar. Veja %{details} para mais informações',
    },
  },
  workflow: {
    workflow: {
      loading: 'Carregando entradas do Fluxo de Trabalho Editorial',
      workflowHeading: 'Fluxo de Trabalho Editorial',
      newPost: 'Nova Publicação',
      description:
        '%{smart_count} entrada aguardando revisão, %{readyCount} pronta para publicação. |||| %{smart_count} entradas aguardando revisão, %{readyCount} pronta para publicação.',
      dateFormat: 'MMMM D',
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
