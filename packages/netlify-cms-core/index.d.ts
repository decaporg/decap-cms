declare module 'netlify-cms-core' {
  import React, { ComponentType } from 'react';
  import { Map } from 'immutable';

  export type CmsBackendType
    = 'git-gateway'
    | 'github'
    | 'gitlab'
    | 'bitbucket'
    | 'test-repo';

  export type CmsMapWidgetType
    = 'Point'
    | 'LineString'
    | 'Polygon';

  export type CmsMarkdownWidgetButton
    = 'bold'
    | 'italic'
    | 'code'
    | 'link'
    | 'heading-one'
    | 'heading-two'
    | 'heading-three'
    | 'heading-four'
    | 'heading-five'
    | 'heading-six'
    | 'quote'
    | 'code-block'
    | 'bulleted-list'
    | 'numbered-list';

  export type CmsFilesExtension
    = 'yml'
    | 'yaml'
    | 'toml'
    | 'json'
    | 'md'
    | 'markdown'
    | 'html';

  export type CmsCollectionFormatType
    = 'yml'
    | 'yaml'
    | 'toml'
    | 'json'
    | 'frontmatter'
    | 'yaml-frontmatter'
    | 'toml-frontmatter'
    | 'json-frontmatter';

  export interface CmsField {
    label: string;
    name: string;
    widget: string;
    pattern?: string[];
    default?: boolean | string | string[] | number | null;
    format?: string;
    dateFormat?: boolean | string;
    timeFormat?: boolean | string;
    media_library?: {
      allow_multiple?: boolean;
      config?: {
        multiple?: boolean;
      };
    };
    allow_add?: boolean;
    field?: CmsField;
    fields?: CmsField[];
    decimals?: number;
    type?: CmsMapWidgetType;
    buttons?: CmsMarkdownWidgetButton[];
    valueType?: number;
    min?: number;
    max?: number;
    step?: number;
    collection?: string;
    displayFields?: string[];
    valueField?: string;
    multiple?: boolean;
    optionsLength?: number;
    options?: string[] | {
      label: string;
      value: string;
    }[];
  }

  export interface CmsCollectionFile {
    label: string;
    name: string;
    file: string;
    fields: CmsField[];
  }

  export interface CmsCollection {
    name: string;
    fields: CmsField[];
    label?: string;
    label_singular?: string;
    description?: string;
    files?: CmsCollectionFile[];
    folder?: string;
    create?: boolean;
    delete?: boolean;
    filter?: {
      field: string;
      value: string;
    };
    identifier_field?: string;
    extension?: CmsFilesExtension;
    format?: CmsCollectionFormatType;
    frontmatter_delimiter?: string[];
    slug?: string;
    preview_path?: string;
    preview_path_date_field?: string;
    editor?: {
      preview: boolean;
    };
    summary?: string;
  }

  export interface CmsBackendParam {
    name: CmsBackendType;
    accept_roles?: string[];
    repo?: string;
    preview_context?: string;
    auth_type?: string;
    app_id?: string;
    api_root?: string;
    base_url?: string;
    auth_endpoint?: string;
  }

  export interface CmsConfig {
    backend?: CmsBackendType | CmsBackendParam;
    load_config_file?: boolean;
    media_folder?: string;
    public_folder?: string;
    collections: CmsCollection[];
  }

  export interface InitOptions {
    config: CmsConfig;
  }

  export interface EditorComponentField {
    name: string;
    label: string;
    widget: string;
  }

  export interface EditorComponentData {
    id: number;
  }

  export interface EditorComponentOptions {
    id: string;
    label: string;
    fields: EditorComponentField[];
    pattern: RegExp;
    fromBlock: (match: RegExpMatchArray) => EditorComponentData;
    toBlock: (data: EditorComponentData) => string;
    toPreview: (data: EditorComponentData) => string;
  }

  export interface PreviewStyleOptions {
    raw: boolean;
  }

  export interface PreviewStyle extends PreviewStyleOptions {
    value: string;
  }

  export type CmsBackendClass = any; // TODO: type properly

  export interface CmsRegistryBackend {
    init: (args: any) => CmsBackendClass;
  }

  export interface CmsWidgetParam {
    name: string;
    controlComponent: ComponentType;
    previewComponent?: ComponentType;
    globalStyles: any;
  }

  export interface CmsWidget {
    control: ComponentType;
    preview?: ComponentType;
    globalStyles?: any;
  }

  export type CmsWidgetValueSerializer = any; // TODO: type properly

  export interface CmsMediaLibraryParam {
    name: string;
    config?: {
      publicKey?: string;
    };
  }

  export type CmsMediaLibraryOptions = any; // TODO: type properly

  export interface CmsMediaLibrary extends CmsMediaLibraryOptions {
    options: CmsMediaLibraryOptions;
  }

  export type CmsLocalePhrases = any; // TODO: type properly

  export interface CmsRegistry {
    backends: {
      [name: string]: CmsRegistryBackend;
    };
    templates: {
      [name: string]: ComponentType;
    };
    previewStyles: PreviewStyle[];
    widgets: {
      [name: string]: CmsWidget;
    };
    editorComponents: Map<string, ComponentType>;
    widgetValueSerializers: {
      [name: string]: CmsWidgetValueSerializer;
    };
    mediaLibraries: CmsMediaLibrary[];
    locales: {
      [name: string]: CmsLocalePhrases;
    };
  }

  export interface CMS {
    getBackend: (name: string) => CmsRegistryBackend | undefined;
    getEditorComponents: () => Map<string, ComponentType>;
    getLocale: (locale: string) => CmsLocalePhrases | undefined;
    getMediaLibrary: (name: string) => CmsMediaLibrary | undefined;
    getPreviewStyles: () => PreviewStyle[];
    getPreviewTemplate: (name: string) => ComponentType | undefined;
    getWidget: (name: string) => CmsWidget | undefined;
    getWidgetValueSerializer: (widgetName: string) => CmsWidgetValueSerializer | undefined;
    init: (options?: InitOptions) => void;
    registerBackend: (name: string, backendClass: CmsBackendClass) => void;
    registerEditorComponent: (options: EditorComponentOptions) => void;
    registerLocale: (locale: string, phrases: CmsLocalePhrases) => void;
    registerMediaLibrary: (mediaLibrary: CmsMediaLibraryParam, options?: CmsMediaLibraryOptions) => void;
    registerPreviewStyle: (filePath: string, options?: PreviewStyleOptions) => void;
    registerPreviewTemplate: (name: string, component: ComponentType) => void;
    registerWidget: (widget: string | CmsWidgetParam, control: ComponentType, preview?: ComponentType) => void;
    registerWidgetValueSerializer: (widgetName: string, serializer: CmsWidgetValueSerializer) => void;
    resolveWidget: (name: string) => CmsWidget | undefined;
  }

  export const NetlifyCmsCore: CMS;

  export default NetlifyCmsCore;
}