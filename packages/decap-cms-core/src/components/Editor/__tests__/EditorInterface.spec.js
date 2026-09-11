import { render } from '@testing-library/react';
import { fromJS } from 'immutable';

import EditorInterface from '../EditorInterface';
import EditorToolbar from '../EditorToolbar';

jest.mock(
  'react-split-pane',
  () =>
    function MockSplitPane(props) {
      return <mock-split-pane>{props.children}</mock-split-pane>;
    },
);
jest.mock('../../../lib/i18n', () => ({
  hasI18n: jest.fn(() => false),
  getI18nInfo: jest.fn(() => ({ locales: ['en'], defaultLocale: 'en' })),
  getPreviewEntry: jest.fn(entry => entry),
}));
jest.mock('../../../reducers/collections', () => ({ getFileFromSlug: jest.fn() }));
jest.mock('../EditorToolbar', () => jest.fn(() => <mock-editor-toolbar />));
jest.mock('../EditorControlPane/EditorControlPane', () => {
  const { Component } = require('react');
  return class MockEditorControlPane extends Component {
    render() {
      return <mock-editor-control-pane />;
    }
  };
});
jest.mock(
  '../EditorPreviewPane/EditorPreviewPane',
  () =>
    function MockEditorPreviewPane() {
      return <mock-editor-preview-pane />;
    },
);
jest.mock(
  '../EditorNotesPane/EditorNotesPane',
  () =>
    function MockEditorNotesPane() {
      return <mock-editor-notes-pane />;
    },
);

describe('EditorInterface', () => {
  it('forwards simple draft mode to the toolbar', () => {
    render(
      <EditorInterface
        collection={fromJS({ name: 'posts', label: 'Posts' })}
        entry={fromJS({ slug: 'post' })}
        fields={fromJS([])}
        fieldsMetaData={fromJS({})}
        fieldsErrors={fromJS({})}
        onChange={jest.fn()}
        onValidate={jest.fn()}
        onPersist={jest.fn()}
        showDelete={true}
        onDelete={jest.fn()}
        onDeleteUnpublishedChanges={jest.fn()}
        onPublish={jest.fn()}
        unPublish={jest.fn()}
        onDuplicate={jest.fn()}
        onChangeStatus={jest.fn()}
        onLogoutClick={jest.fn()}
        loadDeployPreview={jest.fn()}
        draftKey="posts.post"
        editorBackLink="/collections/posts"
        simpleDraftMode={true}
        t={key => key}
      />,
    );

    expect(EditorToolbar.mock.calls[0][0]).toEqual(
      expect.objectContaining({ simpleDraftMode: true }),
    );
  });
});
