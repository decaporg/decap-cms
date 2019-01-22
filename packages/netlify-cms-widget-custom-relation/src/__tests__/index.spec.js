import React from 'react';
import { render } from 'react-testing-library';
import 'react-testing-library/cleanup-after-each';
import 'jest-dom/extend-expect';
import create from '../index';

describe('"create" custom-relation widget', () => {
  console.log(create);
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
    // [TODO]: actually render it...
    const instance = new widget.control();
    expect(typeof instance.isReactComponent).toBe('object');
    expect(instance.isReactComponent).toBeTruthy();
  });

  it('widget.preview is a react component', () => {
    const value = 'some string here';
    const { getByText } = render(<widget.preview value={value} />);
    expect(getByText(value)).toBeInTheDocument();
  });
});
