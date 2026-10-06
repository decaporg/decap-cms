vi.mock('../../object/index', async () => {
  const React = await import('react');
  class MockObjectControl extends React.Component<any> {
    validate() {}
    render() {
      // Expose each item's latest props (keyed by its test id) so tests can
      // call the change handler an item was given.
      (globalThis as any).__objectControlProps ??= {};
      (globalThis as any).__objectControlProps[this.props['data-testid']] = this.props;
      const { children, ...rest } = this.props;
      return React.createElement('mock-object-control', rest, children);
    }
  }
  const DecapCmsWidgetObject = { controlComponent: MockObjectControl };
  return {
    default: DecapCmsWidgetObject,
    controlComponent: MockObjectControl,
  };
});
vi.mock('../../../ui/default/index', async () => {
  const actual = await vi.importActual('../../../ui/default/index');
  const { Collapsible } = await import('@base-ui/react/collapsible');

  // Mirrors the real component's `collapsibleTrigger` mode: the top bar acts
  // as a Base UI Collapsible.Trigger inside the item's Collapsible.Root, so
  // clicking it toggles the surrounding collapsible.
  function ListItemTopBar(props) {
    return (
      <Collapsible.Trigger nativeButton={false} render={<mock-list-item-top-bar {...props} />}>
        <button onClick={props.onRemove}>Remove</button>
        {props.children}
      </Collapsible.Trigger>
    );
  }

  // The real SortableArea, but its `onSortEnd` is exposed so tests can
  // reorder items the way a drag does.
  const ActualSortableArea = (actual as any).SortableArea;
  function SortableArea(props) {
    (globalThis as any).__listSortEnd = props.onSortEnd;
    return <ActualSortableArea {...props} />;
  }

  return {
    ...actual,
    ListItemTopBar,
    SortableArea,
  };
});
import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ListControl from '@/widgets/list/ListControl';

describe('ListControl', () => {
  const props = {
    onChange: vi.fn(),
    onChangeObject: vi.fn(),
    onValidateObject: vi.fn(),
    validate: vi.fn(),
    mediaPaths: {},
    getAsset: vi.fn(),
    onOpenMediaLibrary: vi.fn(),
    onAddAsset: vi.fn(),
    onRemoveInsertedMedia: vi.fn(),
    classNameWrapper: 'classNameWrapper',
    setActiveStyle: vi.fn(),
    setInactiveStyle: vi.fn(),
    editorControl: vi.fn(),
    resolveWidget: vi.fn(),
    clearFieldErrors: vi.fn(),
    fieldsErrors: {},
    entry: {
      path: 'posts/index.md',
    },
    forID: 'forID',
    t: key => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    let id = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() =>
      String(id++) as unknown as ReturnType<typeof crypto.randomUUID>
    );
  });
  it('should render list with nested object', () => {
    const field = {
      name: 'list',
      label: 'List',
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    };
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }]}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed');
  });

  it('should render list with nested object with collapse = false', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    };
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }]}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).not.toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).not.toHaveAttribute('collapsed');
  });

  it('should collapse all items on top bar collapse click', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    };
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }]}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).not.toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).not.toHaveAttribute('collapsed');

    fireEvent.click(getByTestId('expand-button'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed');
  });

  it('should set aria-expanded/aria-controls on the top-bar expand button and toggle them on click (DCMS-1673)', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    };
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }]}
      />,
    );

    const expandButton = getByTestId('expand-button');

    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    expect(expandButton.getAttribute('aria-controls')).toBeTruthy();

    fireEvent.click(expandButton);

    expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(expandButton);

    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps aria-controls on the top-bar expand button pointed at an existing panel id in both open and closed states (DCMS-1725)', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    };
    const { container, getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }]}
      />,
    );

    const expandButton = getByTestId('expand-button');

    // Open state: Base UI already wires this up correctly on its own.
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    const openPanelId = expandButton.getAttribute('aria-controls');
    expect(openPanelId).toBeTruthy();
    expect(container.querySelector(`#${CSS.escape(openPanelId!)}`)).not.toBeNull();

    fireEvent.click(expandButton);

    // Closed state: upstream Base UI drops aria-controls here unless we
    // backfill it (the DCMS-1725 bug); it must still reference a real node.
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    const closedPanelId = expandButton.getAttribute('aria-controls');
    expect(closedPanelId).toBeTruthy();
    expect(closedPanelId).toBe(openPanelId);
    expect(container.querySelector(`#${CSS.escape(closedPanelId!)}`)).not.toBeNull();
  });

  it('should collapse a single item on collapse item click', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    };
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }]}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).not.toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).not.toHaveAttribute('collapsed');

    fireEvent.click(getByTestId('styled-list-item-top-bar-0'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).not.toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).not.toHaveAttribute('collapsed');
  });

  it('should expand all items on top bar expand click', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    };
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }]}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed');

    fireEvent.click(getByTestId('expand-button'));

    expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).not.toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).not.toHaveAttribute('collapsed');
  });

  it('should expand a single item on expand item click', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    };
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }]}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed');

    fireEvent.click(getByTestId('styled-list-item-top-bar-0'));

    expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed');
  });

  it('should use widget name when no summary or label are configured for mixed types', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      types: [
        {
          name: 'type_1_object',
          widget: 'object',
          fields: [
            { label: 'First Name', name: 'first_name', widget: 'string' },
            { label: 'Last Name', name: 'last_name', widget: 'string' },
          ],
        },
      ],
    };

    const { getAllByText } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ first_name: 'hello', last_name: 'world', type: 'type_1_object' }]}
      />,
    );
    expect(getAllByText('type_1_object')[1]).toBeInTheDocument();
  });

  it('should use label when no summary is configured for mixed types', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      types: [
        {
          label: 'Type 1 Object',
          name: 'type_1_object',
          widget: 'object',
          fields: [
            { label: 'First Name', name: 'first_name', widget: 'string' },
            { label: 'Last Name', name: 'last_name', widget: 'string' },
          ],
        },
      ],
    };

    const { getAllByText } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ first_name: 'hello', last_name: 'world', type: 'type_1_object' }]}
      />,
    );
    expect(getAllByText('Type 1 Object')[1]).toBeInTheDocument();
  });

  it('should use summary when configured for mixed types', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      types: [
        {
          label: 'Type 1 Object',
          name: 'type_1_object',
          summary: '{{first_name}} - {{last_name}} - {{filename}}.{{extension}}',
          widget: 'object',
          fields: [
            { label: 'First Name', name: 'first_name', widget: 'string' },
            { label: 'Last Name', name: 'last_name', widget: 'string' },
          ],
        },
      ],
    };

    const { getByText } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ first_name: 'hello', last_name: 'world', type: 'type_1_object' }]}
      />,
    );
    expect(getByText('hello - world - index.md')).toBeInTheDocument();
  });

  it('should use widget name when no summary or label are configured for a single field', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      field: { name: 'name', widget: 'string' },
    };

    const { getByText } = render(<ListControl {...props} field={field} value={['Name']} />);
    expect(getByText('name')).toBeInTheDocument();
  });

  it('should use label when no summary is configured for a single field', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      field: { name: 'name', widget: 'string', label: 'Name' },
    };

    const { getByText } = render(<ListControl {...props} field={field} value={['Name']} />);
    expect(getByText('Name')).toBeInTheDocument();
  });

  it('should use summary when configured for a single field', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      summary: 'Name - {{fields.name}}',
      field: { name: 'name', widget: 'string', label: 'Name' },
    };

    const { getByText } = render(<ListControl {...props} field={field} value={['Name']} />);
    expect(getByText('Name - Name')).toBeInTheDocument();
  });

  it('should use first field value when no summary or label are configured for multiple fields', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      fields: [
        { name: 'first_name', widget: 'string', label: 'First Name' },
        { name: 'last_name', widget: 'string', label: 'Last Name' },
      ],
    };

    const { getByText } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ first_name: 'hello', last_name: 'world' }]}
      />,
    );
    expect(getByText('hello')).toBeInTheDocument();
  });

  it('should show `No <field>` when value is missing from first field for multiple fields', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      fields: [
        { name: 'first_name', widget: 'string', label: 'First Name' },
        { name: 'last_name', widget: 'string', label: 'Last Name' },
      ],
    };

    const { getByText } = render(
      <ListControl {...props} field={field} value={[{ last_name: 'world' }]} />,
    );
    expect(getByText('No first_name')).toBeInTheDocument();
  });

  it('should use summary when configured for multiple fields', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: true,
      summary: '{{first_name}} - {{last_name}} - {{filename}}.{{extension}}',
      fields: [
        { name: 'first_name', widget: 'string', label: 'First Name' },
        { name: 'last_name', widget: 'string', label: 'Last Name' },
      ],
    };

    const { getByText } = render(
      <ListControl
        {...props}
        field={field}
        value={[{ first_name: 'hello', last_name: 'world' }]}
      />,
    );
    expect(getByText('hello - world - index.md')).toBeInTheDocument();
  });

  it('should render list with fields with default collapse ("true") and minimize_collapsed ("false")', () => {
    const field = {
      name: 'list',
      label: 'List',
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    const { getByTestId } = render(
      <ListControl {...props} field={field} value={[{ string: 'item 1' }, { string: 'item 2' }]} />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed');
  });

  it('should render list with fields with collapse = "false" and default minimize_collapsed ("false")', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    const { getByTestId } = render(
      <ListControl {...props} field={field} value={[{ string: 'item 1' }, { string: 'item 2' }]} />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).not.toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).not.toHaveAttribute('collapsed');
  });

  it('should render list with fields with default collapse ("true") and minimize_collapsed = "true"', () => {
    const field = {
      name: 'list',
      label: 'List',
      minimize_collapsed: true,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    const { getByTestId, queryByTestId } = render(
      <ListControl {...props} field={field} value={[{ string: 'item 1' }, { string: 'item 2' }]} />,
    );

    expect(queryByTestId('styled-list-item-top-bar-0')).toBeNull();
    expect(queryByTestId('styled-list-item-top-bar-1')).toBeNull();

    expect(queryByTestId('object-control-0')).toBeNull();
    expect(queryByTestId('object-control-1')).toBeNull();

    fireEvent.click(getByTestId('expand-button'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed');
  });

  it('should render list with fields with collapse = "false" and default minimize_collapsed = "true"', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    const { getByTestId, queryByTestId } = render(
      <ListControl {...props} field={field} value={[{ string: 'item 1' }, { string: 'item 2' }]} />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('styled-list-item-top-bar-1')).not.toHaveAttribute('collapsed');

    expect(getByTestId('object-control-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('object-control-1')).not.toHaveAttribute('collapsed');

    fireEvent.click(getByTestId('expand-button'));

    expect(queryByTestId('styled-list-item-top-bar-0')).toBeNull();
    expect(queryByTestId('styled-list-item-top-bar-1')).toBeNull();

    expect(queryByTestId('object-control-0')).toBeNull();
    expect(queryByTestId('object-control-1')).toBeNull();
  });

  it('should add to list when add button is clicked', () => {
    const field = {
      name: 'list',
      label: 'List',
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    const { getByText, queryByTestId, rerender, getByTestId } = render(
      <ListControl {...props} field={field} value={[]} />,
    );

    expect(queryByTestId('object-control-0')).toBeNull();

    fireEvent.click(getByText('editor.editorWidgets.list.add'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([{}]);

    rerender(<ListControl {...props} field={field} value={[{}]} />);

    expect(getByTestId('styled-list-item-top-bar-0')).not.toHaveAttribute('collapsed');
    expect(getByTestId('object-control-0')).not.toHaveAttribute('collapsed');
  });

  it('should remove from list when remove button is clicked', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    const { getAllByText, rerender } = render(
      <ListControl {...props} field={field} value={[{ string: 'item 1' }, { string: 'item 2' }]} />,
    );

    let mock;
    try {
      mock = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const items = getAllByText('Remove');
      fireEvent.click(items[0]);

      expect(props.onChange).toHaveBeenCalledTimes(1);
      expect(props.onChange).toHaveBeenCalledWith([{ string: 'item 2' }], undefined);

      rerender(<ListControl {...props} field={field} value={[{ string: 'item 2' }]} />);
    } finally {
      mock.mockRestore();
    }
  });

  // DCMS-984: pin the four structural mode config keys (`fields`, `field`, `types`,
  // `add_to_top`) documented in ../README.md.

  it('should use `fields` (multiple mode) defaults when adding an item', () => {
    const field = {
      name: 'list',
      label: 'List',
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    const { getByText } = render(<ListControl {...props} field={field} value={[]} />);

    fireEvent.click(getByText('editor.editorWidgets.list.add'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([{}]);
  });

  it('should use `field` (single mode) defaults when adding an item', () => {
    const field = {
      name: 'list',
      label: 'List',
      field: { label: 'Url', name: 'url', widget: 'string' },
    };
    const { getByText } = render(<ListControl {...props} field={field} value={[]} />);

    fireEvent.click(getByText('editor.editorWidgets.list.add'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([null]);
  });

  it('should render an "add type" control instead of a plain add button when `types` is configured (mixed mode)', () => {
    const field = {
      name: 'list',
      label: 'List',
      types: [
        {
          name: 'type_1_object',
          widget: 'object',
          fields: [{ label: 'Text', name: 'text', widget: 'string' }],
        },
      ],
    };
    const { getByText, queryByText } = render(<ListControl {...props} field={field} value={[]} />);

    expect(getByText('editor.editorWidgets.list.addType')).toBeInTheDocument();
    expect(queryByText('editor.editorWidgets.list.add')).toBeNull();
  });

  it('should insert a new item at the top of the list when `add_to_top` is true', () => {
    const field = {
      name: 'list',
      label: 'List',
      add_to_top: true,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    const { getByText } = render(
      <ListControl {...props} field={field} value={[{ string: 'item 1' }]} />,
    );

    fireEvent.click(getByText('editor.editorWidgets.list.add'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([{}, { string: 'item 1' }]);
  });

  it('should append a new item at the bottom of the list when `add_to_top` is not set (default `false`)', () => {
    const field = {
      name: 'list',
      label: 'List',
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    const { getByText } = render(
      <ListControl {...props} field={field} value={[{ string: 'item 1' }]} />,
    );

    fireEvent.click(getByText('editor.editorWidgets.list.add'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([{ string: 'item 1' }, {}]);
  });

  function renderAndValidate(field, value) {
    let handle;
    render(<ListControl {...props} field={field} value={value} ref={h => (handle = h)} />);
    handle.validate();
  }

  it('should give validation error if below min elements', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      min: 2,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    renderAndValidate(field, [{ string: 'item 1' }]);
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.rangeCount',
        type: 'RANGE',
      },
    ]);
  });

  it('should give min validation error if below min elements', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      min: 2,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    renderAndValidate(field, [{ string: 'item 1' }]);
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.rangeMin',
        type: 'RANGE',
      },
    ]);
  });

  it('should give validation error if above max elements', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      min: 2,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    renderAndValidate(field, [
      { string: 'item 1' },
      { string: 'item 2' },
      { string: 'item 3' },
      { string: 'item 4' },
    ]);
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.rangeCount',
        type: 'RANGE',
      },
    ]);
  });

  it('should give max validation error if above max elements', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    renderAndValidate(field, [
      { string: 'item 1' },
      { string: 'item 2' },
      { string: 'item 3' },
      { string: 'item 4' },
    ]);
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.rangeMax',
        type: 'RANGE',
      },
    ]);
  });

  it('should give no validation error if between min and max elements', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      min: 2,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    renderAndValidate(field, [{ string: 'item 1' }, { string: 'item 2' }, { string: 'item 3' }]);
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', []);
  });

  it('should give no validation error if no elements and optional', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: false,
      min: 2,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    renderAndValidate(field, []);
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', []);
  });

  it('should give presence validation error if no elements and required with no min/max (DCMS-1816)', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    renderAndValidate(field, []);
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.required',
        type: 'PRESENCE',
      },
    ]);
  });

  it('should give presence validation error if no elements and required (default) with no min/max (DCMS-1816)', () => {
    const field = {
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    };
    renderAndValidate(field, []);
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.required',
        type: 'PRESENCE',
      },
    ]);
  });

  describe('changes made on an item after the list changed shape (decaporg #7956)', () => {
    const typedField = {
      name: 'list',
      label: 'List',
      types: [
        {
          name: 'type_one',
          widget: 'object',
          fields: [{ name: 'text', widget: 'richtext', label: 'Text' }],
        },
      ],
    };

    // The `onChangeObject` handler the list gave an item, as captured at render
    // time — what an editor holding a stale closure would call later.
    function changeHandlerOf(key: string) {
      return (globalThis as any).__objectControlProps[`object-control-${key}`].onChangeObject;
    }

    it('applies a change to the item it was made on after an earlier item is removed', () => {
      const value = [
        { type: 'type_one', text: 'one' },
        { type: 'type_one', text: 'two' },
        { type: 'type_one', text: 'three' },
      ];
      const { getAllByText, rerender } = render(
        <ListControl {...props} field={typedField} value={value} />,
      );
      // Keys come from the sequential randomUUID mock: '0', '1', '2'.
      const changeThirdItem = changeHandlerOf('2');

      fireEvent.click(getAllByText('Remove')[0]);
      const afterRemoval = props.onChange.mock.calls[0][0];
      rerender(<ListControl {...props} field={typedField} value={afterRemoval} />);

      changeThirdItem({ name: 'text' }, 'three edited');

      const written = props.onChange.mock.calls[1][0];
      expect(written).toEqual([
        { type: 'type_one', text: 'two' },
        { type: 'type_one', text: 'three edited' },
      ]);
    });

    it('applies a change to the item it was made on after the items are reordered', () => {
      const value = [
        { type: 'type_one', text: 'one' },
        { type: 'type_one', text: 'two' },
      ];
      const { rerender } = render(<ListControl {...props} field={typedField} value={value} />);
      const changeFirstItem = changeHandlerOf('0');

      // Drag the first item below the second.
      act(() => (globalThis as any).__listSortEnd({ oldIndex: 0, newIndex: 1 }));
      const afterSort = props.onChange.mock.calls[0][0];
      expect(afterSort).toEqual([value[1], value[0]]);
      rerender(<ListControl {...props} field={typedField} value={afterSort} />);

      changeFirstItem({ name: 'text' }, 'one edited');

      expect(props.onChange.mock.calls[1][0]).toEqual([
        { type: 'type_one', text: 'two' },
        { type: 'type_one', text: 'one edited' },
      ]);
    });

    it('discards a change made on an item that has since been removed', () => {
      const value = [
        { type: 'type_one', text: 'one' },
        { type: 'type_one', text: 'two' },
      ];
      const { getAllByText, rerender } = render(
        <ListControl {...props} field={typedField} value={value} />,
      );
      const changeSecondItem = changeHandlerOf('1');

      fireEvent.click(getAllByText('Remove')[1]);
      const afterRemoval = props.onChange.mock.calls[0][0];
      rerender(<ListControl {...props} field={typedField} value={afterRemoval} />);

      changeSecondItem({ name: 'text' }, 'text for a removed item');

      expect(props.onChange).toHaveBeenCalledTimes(1);
    });
  });
});
