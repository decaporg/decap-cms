import React from 'react';
import { shallow } from 'enzyme';
import EntryEditorToolbar from '../EntryEditorToolbar';

describe('EntryEditorToolbar', () => {
  it('should have both buttons enabled initially', () => {
    const component = shallow(
      <EntryEditorToolbar
        onPersist={() => {}}
        onCancelEdit={() => {}}
      />
    );
    const tree = component.html();
    expect(tree).toMatchSnapshot();
  });

  it('should disable and update label of Save button when persisting', () => {
    const component = shallow(
      <EntryEditorToolbar
        isPersisting
        onPersist={() => {}}
        onCancelEdit={() => {}}
      />
    );
    const tree = component.html();
    expect(tree).toMatchSnapshot();
  });
});
