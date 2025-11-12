import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { fromJS } from 'immutable';

import ListControl from '../ListControl';

jest.mock('decap-cms-widget-object', () => {
  const React = require('react');

  class MockObjectControl extends React.Component {
    render() {
      return <mock-object-control {...this.props}>{this.props.children}</mock-object-control>;
    }
  }

  return {
    controlComponent: MockObjectControl,
  };
});

jest.mock('decap-cms-ui-default', () => {
  const actual = jest.requireActual('decap-cms-ui-default');

  function ListItemTopBar(props) {
    return (
      <mock-list-item-top-bar {...props} onClick={props.onCollapseToggle}>
        <button onClick={props.onRemove}>Remove</button>
        {props.children}
      </mock-list-item-top-bar>
    );
  }

  function ObjectWidgetTopBar(props) {
    return (
      <div>
        <button onClick={props.onCollapseToggle} data-testid="expand-button">
          {props.heading}
        </button>
        {props.allowAdd && (
          <button onClick={props.onAdd}>{props.t ? props.t('editor.editorWidgets.list.add') : 'Add'}</button>
        )}
      </div>
    );
  }

  return {
    ...actual,
    ListItemTopBar,
    ObjectWidgetTopBar,
  };
});

jest.mock('uuid');

describe('ListControl - Additional Tests', () => {
  const props = {
    onChange: jest.fn(),
    onChangeObject: jest.fn(),
    onValidateObject: jest.fn(),
    validate: jest.fn(),
    mediaPaths: fromJS({}),
    getAsset: jest.fn(),
    onOpenMediaLibrary: jest.fn(),
    onAddAsset: jest.fn(),
    onRemoveInsertedMedia: jest.fn(),
    classNameWrapper: 'classNameWrapper',
    setActiveStyle: jest.fn(),
    setInactiveStyle: jest.fn(),
    editorControl: jest.fn(),
    resolveWidget: jest.fn(),
    clearFieldErrors: jest.fn(),
    fieldsErrors: fromJS({}),
    entry: fromJS({
      path: 'posts/index.md',
    }),
    forID: 'forID',
    t: key => key,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const uuid = require('uuid');
    let id = 0;
    uuid.v4.mockImplementation(() => {
      return id++;
    });
  });

  describe('Add to top functionality', () => {
    it('should add item to top when add_to_top is true', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        add_to_top: true,
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const { getByText } = render(
        <ListControl {...props} field={field} value={fromJS([{ string: 'existing item' }])} />
      );

      fireEvent.click(getByText('editor.editorWidgets.list.add'));

      expect(props.onChange).toHaveBeenCalledWith(
        fromJS([{}, { string: 'existing item' }])
      );
    });

    it('should add item to bottom when add_to_top is false', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        add_to_top: false,
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const { getByText } = render(
        <ListControl {...props} field={field} value={fromJS([{ string: 'existing item' }])} />
      );

      fireEvent.click(getByText('editor.editorWidgets.list.add'));

      expect(props.onChange).toHaveBeenCalledWith(
        fromJS([{ string: 'existing item' }, {}])
      );
    });
  });

  describe('Allow remove/reorder functionality', () => {
    it('should disable remove when allow_remove is false', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        allow_remove: false,
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const { getByTestId } = render(
        <ListControl {...props} field={field} value={fromJS([{ string: 'item 1' }])} />
      );

      expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('allowremove');
    });

    it('should disable reorder when allow_reorder is false', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        allow_reorder: false,
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const { getByTestId } = render(
        <ListControl {...props} field={field} value={fromJS([{ string: 'item 1' }])} />
      );

      expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('allowreorder');
    });

    it('should disable add when allow_add is false', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        allow_add: false,
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const { queryByText } = render(<ListControl {...props} field={field} />);

      expect(queryByText('editor.editorWidgets.list.add')).not.toBeInTheDocument();
    });
  });

  describe('Default values', () => {
    it('should use default value for single field', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        field: {
          name: 'name',
          widget: 'string',
          default: 'Default Name',
        },
      });

      const { getByText } = render(<ListControl {...props} field={field} />);

      fireEvent.click(getByText('editor.editorWidgets.list.add'));

      expect(props.onChange).toHaveBeenCalledWith(fromJS(['Default Name']));
    });

    it('should use default values for multiple fields', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [
          { name: 'name', widget: 'string', default: 'Default Name' },
          { name: 'age', widget: 'number', default: 25 },
        ],
      });

      const { getByText } = render(<ListControl {...props} field={field} />);

      fireEvent.click(getByText('editor.editorWidgets.list.add'));

      expect(props.onChange).toHaveBeenCalledWith(
        fromJS([{ name: 'Default Name', age: 25 }])
      );
    });

    it('should handle nested object default values', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [
          {
            name: 'person',
            widget: 'object',
            fields: [
              { name: 'name', widget: 'string', default: 'John' },
              { name: 'surname', widget: 'string', default: 'Doe' },
            ],
          },
        ],
      });

      const { getByText } = render(<ListControl {...props} field={field} />);

      fireEvent.click(getByText('editor.editorWidgets.list.add'));

      expect(props.onChange).toHaveBeenCalledWith(
        fromJS([{ person: { name: 'John', surname: 'Doe' } }])
      );
    });
  });

  describe('Error handling', () => {
    it('should show error state when field has errors', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const fieldsErrors = fromJS({
        'forID.0.string': [{ message: 'Required field' }]
      });

      const listControl = new ListControl({
        ...props,
        field,
        value: fromJS([{ string: '' }]),
        fieldsErrors,
      });

      // Set up state to simulate having a key for the item
      listControl.state.keys = ['0'];

      const hasError = listControl.hasError(0);
      expect(hasError).toBe(true);
    });

    it('should not show error state when field has no errors', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const listControl = new ListControl({
        ...props,
        field,
        value: fromJS([{ string: 'valid value' }]),
      });

      // Set up state to simulate having a key for the item
      listControl.state.keys = ['0'];

      const hasError = listControl.hasError(0);
      expect(hasError).toBeFalsy();
    });
  });

  describe('Focus functionality', () => {
    it('should expand collapsed items when focusing', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        collapsed: true,
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const listControl = new ListControl({
        ...props,
        field,
        value: fromJS([{ string: 'item 1' }]),
      });

      // Set up mock child refs
      const mockControl = { focus: jest.fn() };
      listControl.childRefs = { '0': mockControl };
      listControl.state.keys = ['0'];
      listControl.state.itemsCollapsed = [true];
      listControl.state.listCollapsed = true;

      listControl.focus('0.string');

      expect(listControl.state.itemsCollapsed[0]).toBe(false);
      expect(listControl.state.listCollapsed).toBe(false);
    });
  });

  describe('String value handling', () => {
    it('should handle string array input correctly', () => {
      const field = fromJS({ name: 'list', label: 'List' });
      
      const { container } = render(<ListControl {...props} field={field} />);
      const input = container.querySelector('input');

      fireEvent.change(input, { target: { value: 'item1, item2, item3' } });

      expect(props.onChange).toHaveBeenCalledWith(
        fromJS(['item1', 'item2', 'item3'])
      );
    });

    it('should handle trailing comma correctly', () => {
      const field = fromJS({ name: 'list', label: 'List' });
      
      const listControl = new ListControl({
        ...props,
        field,
      });

      listControl.state.value = 'item1, item2, ';

      const mockEvent = {
        target: { value: 'item1, item2, item3,' }
      };

      listControl.handleChange(mockEvent);

      expect(props.onChange).toHaveBeenCalledWith(
        fromJS(['item1', 'item2', 'item3'])
      );
    });

    it('should handle focus and blur events for string input', () => {
      const field = fromJS({ name: 'list', label: 'List' });
      
      const { container } = render(<ListControl {...props} field={field} />);
      const input = container.querySelector('input');

      fireEvent.focus(input);
      expect(props.setActiveStyle).toHaveBeenCalled();

      fireEvent.blur(input);
      expect(props.setInactiveStyle).toHaveBeenCalled();
    });
  });

  describe('Mixed types (types field)', () => {
    it('should add item of specific type when using mixed types', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        types: [
          {
            name: 'text_type',
            widget: 'object',
            fields: [{ name: 'content', widget: 'string' }],
          },
          {
            name: 'image_type',
            widget: 'object',
            fields: [{ name: 'src', widget: 'string' }],
          },
        ],
      });

      const listControl = new ListControl({
        ...props,
        field,
        value: fromJS([]),
      });

      listControl.handleAddType('text_type', 'type');

      expect(props.onChange).toHaveBeenCalledWith(
        fromJS([{ type: 'text_type' }])
      );
    });

    it('should render error for invalid typed item', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        types: [
          {
            name: 'valid_type',
            widget: 'object',
            fields: [{ name: 'content', widget: 'string' }],
          },
        ],
      });

      const listControl = new ListControl({
        ...props,
        field,
        value: fromJS([{ type: 'invalid_type', content: 'test' }]),
      });

      listControl.state.keys = ['0'];

      const result = listControl.renderItem(fromJS({ type: 'invalid_type', content: 'test' }), 0);

      expect(result.props.children[1].props.error).toBe(true);
    });
  });

  describe('Component lifecycle', () => {
    it('should initialize state correctly in constructor', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        collapsed: false,
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const value = fromJS([{ string: 'item 1' }, { string: 'item 2' }]);

      const listControl = new ListControl({
        ...props,
        field,
        value,
      });

      expect(listControl.state.listCollapsed).toBe(false);
      expect(listControl.state.itemsCollapsed).toEqual([false, false]);
      expect(listControl.state.keys).toHaveLength(2);
    });

    it('should handle empty value in constructor', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const listControl = new ListControl({
        ...props,
        field,
        value: undefined,
      });

      expect(listControl.state.itemsCollapsed).toEqual([]);
      expect(listControl.state.keys).toEqual([]);
    });
  });

  describe('Validation edge cases', () => {
    it('should validate when no child widgets exist', () => {
      const field = fromJS({ name: 'list', label: 'List' });
      
      const listControl = new ListControl({
        ...props,
        field,
        value: fromJS(['item1', 'item2']),
      });

      listControl.validate();

      expect(props.validate).toHaveBeenCalled();
      expect(props.onValidateObject).toHaveBeenCalledWith('forID', []);
    });

    it('should handle validation with child widgets', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const listControl = new ListControl({
        ...props,
        field,
        value: fromJS([{ string: 'item 1' }]),
      });

      const mockChildWidget = { validate: jest.fn() };
      listControl.childRefs = { '0': mockChildWidget };

      listControl.validate();

      expect(mockChildWidget.validate).toHaveBeenCalled();
      expect(props.onValidateObject).toHaveBeenCalledWith('forID', []);
    });
  });

  describe('Sorting functionality', () => {
    it('should handle drag and drop reordering', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const value = fromJS([
        { string: 'item 1' },
        { string: 'item 2' },
        { string: 'item 3' },
      ]);

      const listControl = new ListControl({
        ...props,
        field,
        value,
      });

      listControl.state.keys = ['key0', 'key1', 'key2'];
      listControl.state.itemsCollapsed = [false, true, false];

      listControl.onSortEnd({ oldIndex: 0, newIndex: 2 });

      const expectedValue = fromJS([
        { string: 'item 2' },
        { string: 'item 3' },
        { string: 'item 1' },
      ]);

      expect(props.onChange).toHaveBeenCalledWith(expectedValue);
      expect(listControl.state.itemsCollapsed).toEqual([true, false, false]);
      expect(listControl.state.keys).toEqual(['key1', 'key2', 'key0']);
    });
  });

  describe('Label generation edge cases', () => {
    it('should handle missing label field for single field', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        collapsed: true,
        field: { name: 'content', widget: 'string' },
      });

      const listControl = new ListControl({
        ...props,
        field,
      });

      const label = listControl.objectLabel('Test Content');
      expect(label).toBe('content');
    });

    it('should handle invalid item for multiple fields', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [{ name: 'name', widget: 'string' }],
      });

      const listControl = new ListControl({
        ...props,
        field,
      });

      // Mock console.warn to avoid output in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const label = listControl.objectLabel('invalid item');
      expect(label).toBe('');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Clear field errors on remove', () => {
    it('should clear field errors when removing item', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const fieldsErrors = fromJS({
        'someField': [{ parentIds: ['key0'] }]
      });

      const listControl = new ListControl({
        ...props,
        field,
        value: fromJS([{ string: 'item 1' }]),
        fieldsErrors,
      });

      listControl.state.keys = ['key0'];
      listControl.childRefs = { 'key0': {} };

      const mockEvent = { preventDefault: jest.fn() };
      listControl.handleRemove(0, mockEvent);

      expect(props.clearFieldErrors).toHaveBeenCalledWith('someField');
    });

    it('should validate empty list after removing last item', () => {
      const field = fromJS({
        name: 'list',
        label: 'List',
        fields: [{ label: 'String', name: 'string', widget: 'string' }],
      });

      const listControl = new ListControl({
        ...props,
        field,
        value: fromJS([{ string: 'only item' }]),
      });

      listControl.state.keys = ['key0'];
      listControl.childRefs = { 'key0': {} };

      const mockEvent = { preventDefault: jest.fn() };
      listControl.handleRemove(0, mockEvent);

      expect(props.clearFieldErrors).toHaveBeenCalledWith('forID');
      expect(props.onValidateObject).toHaveBeenCalledWith('forID', []);
    });
  });
});
