import { fireEvent, render } from '@testing-library/react';
import { fromJS, Map } from 'immutable';
import { useState } from 'react';

import ListControl from '../ListControl';

/**
 * Stands in for EditorControl wrapping a widget that stores a map value, such
 * as the code widget's `{ code, lang }`: each change is applied on top of the
 * current value prop.
 */
function MapValueControl({ value, onChange, field }) {
  const current = value || Map();
  return (
    <div data-testid={`control-${field.get('name')}`} data-value={JSON.stringify(current)}>
      <button onClick={() => onChange(field, current.set('code', 'echo hi'))}>Set code</button>
      <button onClick={() => onChange(field, current.set('lang', 'shell'))}>Set lang</button>
    </div>
  );
}

describe('list with a single field whose value is a map', () => {
  const field = fromJS({
    name: 'terminal',
    label: 'Terminal',
    collapsed: false,
    field: { name: 'code_snippet', label: 'Code Snippet', widget: 'code' },
  });

  function renderList(value) {
    const onChange = jest.fn();
    function ControlledList() {
      const [currentValue, setValue] = useState(fromJS(value));
      return (
        <ListControl
          field={field}
          value={currentValue}
          onChange={(nextValue, metadata) => {
            onChange(nextValue, metadata);
            setValue(nextValue);
          }}
          onChangeObject={jest.fn()}
          validate={jest.fn()}
          mediaPaths={fromJS({})}
          getAsset={jest.fn()}
          onOpenMediaLibrary={jest.fn()}
          onAddAsset={jest.fn()}
          onRemoveInsertedMedia={jest.fn()}
          classNameWrapper="list-control"
          setActiveStyle={jest.fn()}
          setInactiveStyle={jest.fn()}
          editorControl={MapValueControl}
          resolveWidget={jest.fn()}
          onValidateObject={jest.fn()}
          clearFieldErrors={jest.fn()}
          fieldsErrors={fromJS({})}
          entry={fromJS({ path: 'pages/index.md' })}
          forID="terminal"
          t={key => key}
        />
      );
    }
    const result = render(<ControlledList />);
    return { ...result, onChange };
  }

  it('passes the whole item value to the widget', () => {
    const { getByTestId } = renderList([{ code: 'ls', lang: 'shell' }]);

    expect(JSON.parse(getByTestId('control-code_snippet').dataset.value)).toEqual({
      code: 'ls',
      lang: 'shell',
    });
  });

  it('keeps both keys when they are changed one after the other', () => {
    const { getByText, onChange } = renderList([{}]);

    fireEvent.click(getByText('Set code'));
    fireEvent.click(getByText('Set lang'));

    expect(onChange.mock.calls.at(-1)[0].toJS()).toEqual([{ code: 'echo hi', lang: 'shell' }]);
  });
});
