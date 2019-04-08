import React, { useState } from 'react';
import { Map } from 'immutable';
import {
  render,
  fireEvent,
  cleanup,
  waitForElement,
} from 'react-testing-library';
import 'jest-dom/extend-expect'
import VisualEditor from '../VisualEditor';

const mocks = {
  field: Map(),
  getEditorComponents: () => {},
};

const Editor = () => {
  const { field, getEditorComponents } = mocks;
  const [value, setValue] = useState('');

  return (
    <div data-testid="visual-editor">
      <VisualEditor
        onChange={setValue}
        value={value}
        field={field}
        getEditorComponents={getEditorComponents}
      />
    </div>
  );
};

describe('VisualEditor', () => {
  afterEach(() => {
    cleanup();
  });

  test('loads', async () => {
    const { getByTestId } = render(<Editor/>);
    const editorWrapper = await waitForElement(() =>
      getByTestId('visual-editor');
    );

    fireEvent.click(editorWrapper);
    fireEvent.keyDown(editorWrapper, { key: 'a', code: 65 });

    expect(editorWrapper.toHaveTextContent('a'));
  })
