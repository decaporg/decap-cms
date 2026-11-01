import { fireEvent, render } from '@testing-library/react';
import { fromJS } from 'immutable';
import { useState } from 'react';

import ListControl from '../ListControl';

describe('erroneous typed list items', () => {
  const field = fromJS({
    name: 'sections',
    types: [{ name: 'text', widget: 'object', fields: [{ name: 'body', widget: 'string' }] }],
  });

  function renderList(value, overrides = {}) {
    const onChange = jest.fn();
    function ControlledList() {
      const [currentValue, setValue] = useState(fromJS(value));
      return (
        <ListControl
          field={field.merge(overrides)}
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
          editorControl={jest.fn()}
          resolveWidget={jest.fn()}
          onValidateObject={jest.fn()}
          clearFieldErrors={jest.fn()}
          fieldsErrors={fromJS({})}
          entry={fromJS({ path: 'pages/index.md' })}
          forID="sections"
          t={key => key}
        />
      );
    }
    const result = render(<ControlledList />);
    return { ...result, onChange };
  }

  it.each([
    [{ body: 'Missing type' }, "Error: item has no 'type' property"],
    [
      { type: 'unknown', body: 'Unknown type' },
      "Error: item has illegal 'type' property: 'unknown'",
    ],
  ])('allows removing an invalid item: %j', (item, message) => {
    const remaining = { body: 'Keep this item' };
    const { getAllByText, onChange } = renderList([item, remaining]);
    const row = getAllByText(message)[0].parentElement;
    const removeButton = row.querySelector('button');

    expect(removeButton).toBeInTheDocument();
    fireEvent.click(removeButton);

    expect(onChange).toHaveBeenCalledWith(fromJS([remaining]), undefined);
  });

  it.each([
    [{}, true, true],
    [{ allow_remove: false }, false, true],
    [{ allow_reorder: false }, true, false],
    [{ allow_remove: false, allow_reorder: false }, false, false],
  ])('respects the configured controls: %j', (overrides, allowRemove, allowReorder) => {
    const { getByText } = renderList([{ body: 'Missing type' }], overrides);
    const row = getByText("Error: item has no 'type' property").parentElement;

    expect(Boolean(row.querySelector('button'))).toBe(allowRemove);
    expect(Boolean(row.querySelector('[aria-roledescription="sortable"]'))).toBe(allowReorder);
  });
});
