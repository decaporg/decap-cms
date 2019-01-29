import React from 'react';
import { List, Map } from 'immutable';
import { Provider } from 'react-redux';
import { render } from 'react-testing-library';
import 'react-testing-library/cleanup-after-each';
import 'jest-dom/extend-expect';
import store from 'netlify-cms-core/src/redux';
import create from '../index';

const props = {
  onChange: () => {},
  forID: 'some-random-id',
  classNameWrapper: 'classname-wrapper',
  query: async () => {},
  clearSearch: () => {},
  setActiveStyle: () => {},
  setInactiveStyle: () => {},
  field: Map({
    label: 'Autor',
    name: 'authors',
    widget: 'author',
    multiple: true,
    required: false,
  }),
  value: List([]),
};

describe('"create" custom-relation widget', () => {
  it('exports a function', () => {
    expect(typeof create).toBe('function');
  });

  const widget = create();

  it('returns an object containing components', () => {
    expect(typeof widget).toBe('object');
    expect(typeof widget.control).toBe('function');
    expect(typeof widget.preview).toBe('function');
  });

  it('widget.control is a react component', () => {
    const { container } = render(
      <Provider store={store}>
        <widget.control {...props} />
      </Provider>,
    );
    expect(container.querySelector('#some-random-id')).toBeInTheDocument();
  });

  it('widget.preview is a react component', () => {
    const value = 'some string here';
    const { getByText } = render(<widget.preview value={value} />);
    expect(getByText(value)).toBeInTheDocument();
  });
});
