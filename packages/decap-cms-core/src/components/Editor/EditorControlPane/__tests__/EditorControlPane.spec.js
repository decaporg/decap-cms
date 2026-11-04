import { createRef, useState } from 'react';
import { act, render } from '@testing-library/react';
import { fromJS } from 'immutable';

import ControlPane from '../EditorControlPane';

jest.mock('../../../../reducers/collections', () => ({}));

// Like the markdown widget, this control only reads its value on mount.
jest.mock('../EditorControl', () => {
  const { useState } = require('react');
  return function MockEditorControl({ field, value }) {
    const [initialValue] = useState(value);
    return <span data-testid={field.get('name')}>{initialValue}</span>;
  };
});

describe('EditorControlPane', () => {
  const collection = fromJS({
    name: 'posts',
    i18n: { structure: 'multiple_folders', locales: ['en', 'de'], default_locale: 'en' },
  });
  const fields = fromJS([{ name: 'body', widget: 'markdown', i18n: 'translate' }]);

  function setup() {
    const paneRef = createRef();
    let setEntry;

    function Wrapper() {
      const [entry, updateEntry] = useState(
        fromJS({ data: { body: 'English' }, i18n: { de: { data: { body: '' } } } }),
      );
      setEntry = updateEntry;
      return (
        <ControlPane
          ref={paneRef}
          collection={collection}
          entry={entry}
          fields={fields}
          fieldsMetaData={fromJS({})}
          fieldsErrors={fromJS({})}
          locale="de"
          t={key => key}
          onChange={(field, value, metadata, i18n) =>
            setEntry(entry =>
              entry.setIn(['i18n', i18n.currentLocale, 'data', field.get('name')], value),
            )
          }
          onValidate={jest.fn()}
          onLocaleChange={jest.fn()}
        />
      );
    }

    const utils = render(<Wrapper />);
    return { ...utils, paneRef };
  }

  beforeEach(() => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the copied value after filling in from another locale', () => {
    const { getByTestId, paneRef } = setup();
    expect(getByTestId('body').textContent).toBe('');

    act(() => {
      paneRef.current.copyFromOtherLocale({ targetLocale: 'de', t: key => key })('en');
    });

    expect(getByTestId('body').textContent).toBe('English');
  });
});
