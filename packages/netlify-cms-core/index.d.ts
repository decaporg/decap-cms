/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'netlify-cms-core' {
  import React, { ComponentType } from 'react';
  import { Map } from 'immutable';

  export type CmsBackendType = 'git-gateway' | 'github' | 'gitlab' | 'bitbucket' | 'test-repo';

  export type CmsMapWidgetType = 'Point' | 'LineString' | 'Polygon';

  export type CmsMarkdownWidgetButton =
    | 'bold'
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

  export type CmsFilesExtension = 'yml' | 'yaml' | 'toml' | 'json' | 'md' | 'markdown' | 'html';

  export type CmsCollectionFormatType =
    | 'yml'
    | 'yaml'
    | 'toml'
    | 'json'
    | 'frontmatter'
    | 'yaml-frontmatter'
    | 'toml-frontmatter'
    | 'json-frontmatter';

  export type CmsAuthScope = 'repo' | 'public_repo';

  export type CmsPublishMode = 'simple' | 'editorial_workflow';

  export type CmsSlugEncoding = 'unicode' | 'ascii';

  export interface CmsField {
    name: string;
    label?: string;
    widget?: string;
    required?: boolean;
  }

  export interface CmsCollectionFile {
    name: string;
    label: string;
    file: string;
    fields: CmsField[];
    label_singular?: string;
    description?: string;
  }

  export interface CmsCollection {
    name: string;
    label: string;
    label_singular?: string;
    description?: string;
    folder?: string;
    files?: CmsCollectionFile[];
    identifier_field?: string;
    summary?: string;
    slug?: string;
    preview_path?: string;
    preview_path_date_field?: string;
    create?: boolean;
    editor?: {
      preview?: boolean;
    };
    format?: CmsCollectionFormatType;
    extension?: CmsFilesExtension;
    frontmatter_delimiter?: string[] | string;
    fields?: CmsField[];
  }

  export interface CmsBackend {
    name: CmsBackendType;
    auth_scope?: CmsAuthScope;
    open_authoring?: boolean;
    repo?: string;
    branch?: string;
    api_root?: string;
    site_domain?: string;
    base_url?: string;
    auth_endpoint?: string;
  }

  export interface CmsSlug {
    encoding?: CmsSlugEncoding;
    clean_accents?: boolean;
  }

  export interface CmsConfig {
    backend: CmsBackend;
    collections: CmsCollection[];
    locale?: string;
    site_url?: string;
    display_url?: string;
    logo_url?: string;
    show_preview_links?: boolean;
    media_folder?: string;
    public_folder?: string;
    media_folder_relative?: boolean;
    media_library?: CmsMediaLibrary;
    publish_mode?: CmsPublishMode;
    slug?: CmsSlug;
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
    id: number | string;
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
    controlComponent: ComponentType<any>;
    previewComponent?: ComponentType<any>;
    globalStyles: any;
  }

  export interface CmsWidget {
    control: ComponentType<any>;
    preview?: ComponentType<any>;
    globalStyles?: any;
  }

  export type CmsWidgetValueSerializer = any; // TODO: type properly

  export type CmsMediaLibraryOptions = any; // TODO: type properly

  export interface CmsMediaLibrary {
    name: string;
    config?: CmsMediaLibraryOptions;
  }

  export type CmsLocalePhrases = any; // TODO: type properly

  export interface CmsRegistry {
    backends: {
      [name: string]: CmsRegistryBackend;
    };
    templates: {
      [name: string]: ComponentType<any>;
    };
    previewStyles: PreviewStyle[];
    widgets: {
      [name: string]: CmsWidget;
    };
    editorComponents: Map<string, ComponentType<any>>;
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
    getEditorComponents: () => Map<string, ComponentType<any>>;
    getLocale: (locale: string) => CmsLocalePhrases | undefined;
    getMediaLibrary: (name: string) => CmsMediaLibrary | undefined;
    getPreviewStyles: () => PreviewStyle[];
    getPreviewTemplate: (name: string) => ComponentType<any> | undefined;
    getWidget: (name: string) => CmsWidget | undefined;
    getWidgetValueSerializer: (widgetName: string) => CmsWidgetValueSerializer | undefined;
    init: (options?: InitOptions) => void;
    registerBackend: (name: string, backendClass: CmsBackendClass) => void;
    registerEditorComponent: (options: EditorComponentOptions) => void;
    registerLocale: (locale: string, phrases: CmsLocalePhrases) => void;
    registerMediaLibrary: (mediaLibrary: CmsMediaLibrary, options?: CmsMediaLibraryOptions) => void;
    registerPreviewStyle: (filePath: string, options?: PreviewStyleOptions) => void;
    registerPreviewTemplate: (name: string, component: ComponentType<any>) => void;
    registerWidget: (
      widget: string | CmsWidgetParam,
      control?: ComponentType<any>,
      preview?: ComponentType<any>,
    ) => void;
    registerWidgetValueSerializer: (
      widgetName: string,
      serializer: CmsWidgetValueSerializer,
    ) => void;
    resolveWidget: (name: string) => CmsWidget | undefined;
  }

  export const NetlifyCmsCore: CMS;

  export default NetlifyCmsCore;
}
