import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import EditorPreview from '@/core/components/Editor/EditorPreviewPane/EditorPreview';
import { PreviewPane } from '@/core/components/Editor/EditorPreviewPane/EditorPreviewPane';
import { FOLDER } from '@/core/constants/collectionTypes';
import { I18n } from '@/core/i18n';
import { registerPreviewTemplate } from '@/core/lib/registry';

import type { CmsCollectionState, CmsEntry } from '@/lib/util/index';

const messages = {
  editor: {
    editorInterface: {
      previewPaneTitle: 'Preview pane',
    },
  },
};

const baseProps = {
  fields: [{ name: 'title', widget: 'string', label: 'Title' }],
  entry: { slug: 'entry-1', data: { title: 'Hello' } } as unknown as CmsEntry,
  fieldsMetaData: {},
  getAsset: () => ({ url: '', path: '' }),
  config: {} as any,
  state: { collections: {}, config: {}, integrations: {}, entries: {}, mediaLibrary: {} },
  isLoadingAsset: false,
  boundGetAsset: () => undefined,
} as const;

function renderPreviewPane(collection: CmsCollectionState) {
  return render(
    <I18n locale="en" messages={messages}>
      <PreviewPane {...baseProps} collection={collection} />
    </I18n>,
  );
}

describe('PreviewPane', () => {
  it('renders the generic preview in the iframe when no preview template is registered', () => {
    const collection = {
      type: FOLDER,
      name: 'no-preview-collection',
      fields: baseProps.fields,
    } as unknown as CmsCollectionState;

    renderPreviewPane(collection);

    expect(screen.queryByText(/No preview available/)).not.toBeInTheDocument();
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
  });

  it('renders the preview iframe when a preview template is registered for the collection', () => {
    function CustomPreview() {
      return <div>custom preview</div>;
    }
    registerPreviewTemplate('has-preview-collection', CustomPreview);

    const collection = {
      type: FOLDER,
      name: 'has-preview-collection',
      fields: baseProps.fields,
    } as unknown as CmsCollectionState;

    renderPreviewPane(collection);

    expect(document.querySelectorAll('iframe')).toHaveLength(1);
  });
});

describe('EditorPreview (generic preview)', () => {
  it('renders every visible field through widgetFor and skips hidden ones', () => {
    const fields = [
      { name: 'title', widget: 'string', label: 'Title' },
      { name: 'secret', widget: 'hidden', label: 'Secret' },
      { name: 'body', widget: 'richtext', label: 'Body' },
    ];
    const widgetFor = (name: string) => <span>preview of {name}</span>;

    render(
      <EditorPreview
        collection={{ name: 'posts' } as unknown as CmsCollectionState}
        entry={baseProps.entry}
        fields={fields as any}
        getAsset={baseProps.getAsset as any}
        widgetFor={widgetFor}
      />,
    );

    expect(screen.getByText('preview of title')).toBeInTheDocument();
    expect(screen.getByText('preview of body')).toBeInTheDocument();
    expect(screen.queryByText('preview of secret')).not.toBeInTheDocument();
  });
});
