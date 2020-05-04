import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { fromJS } from 'immutable';
import ListControl from '../ListControl';

jest.mock('netlify-cms-widget-object', () => {
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
jest.mock('netlify-cms-ui-default', () => {
  const actual = jest.requireActual('netlify-cms-ui-default');
  const ListItemTopBar = props => (
    <mock-list-item-top-bar {...props} onClick={props.onCollapseToggle}>
      {props.children}
    </mock-list-item-top-bar>
  );
  return {
    ...actual,
    ListItemTopBar,
  };
});
jest.mock('uuid/v4');

describe('ListControl', () => {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const uuid = require('uuid/v4');
    let id = 0;
    uuid.mockImplementation(() => {
      return id++;
    });
  });
  it('should render empty list', () => {
    const field = fromJS({ name: 'list', label: 'List' });
    const { asFragment } = render(<ListControl {...props} field={field} />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render list with string array', () => {
    const field = fromJS({ name: 'list', label: 'List' });
    const { asFragment } = render(
      <ListControl {...props} field={field} value={fromJS(['item 1', 'item 2'])} />,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render list with nested object', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { asFragment, getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render list with nested object with collapse = false', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { asFragment, getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');

    expect(asFragment()).toMatchSnapshot();
  });

  it('should collapse all items on top bar collapse click', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');

    fireEvent.click(getByTestId('expand-button'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');
  });

  it('should collapse a single item on collapse item click', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');

    fireEvent.click(getByTestId('styled-list-item-top-bar-0'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');
  });

  it('should expand all items on top bar expand click', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');

    fireEvent.click(getByTestId('expand-button'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');
  });

  it('should expand a single item on expand item click', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');

    fireEvent.click(getByTestId('styled-list-item-top-bar-0'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');
  });
});
