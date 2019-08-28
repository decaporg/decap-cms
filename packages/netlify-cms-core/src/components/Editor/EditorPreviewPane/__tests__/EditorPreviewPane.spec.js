import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import EditorPreviewPane from '../EditorPreviewPane';
import { FOLDER } from 'Constants/collectionTypes';
import { registerWidget } from 'Lib/registry';
import { Map, List } from 'immutable';

const fakeComponent = () => <div />;

registerWidget('string', fakeComponent, fakeComponent);
registerWidget('object', fakeComponent, fakeComponent);

describe('EditorPreviewPane', () => {
  describe('identifier_field is not set', () => {
    it('should render the title field as a header', () => {
      const renderer = new ShallowRenderer();
      renderer.render(getTestComponent());
      const instance = renderer.getMountedInstance();

      const firstlevelWidget = instance.widgetFor('firstlevel');
      const titleWidget = instance.widgetFor('title');

      expect(firstlevelWidget.props.field.get('fields')[0].props.value.type).toBe('div');
      expect(titleWidget.props.value.type).toBe('h1');
    });
  });

  describe('identifier_field is set', () => {
    it('should render the inferred title field (identifier_field) as a header', () => {
      const renderer = new ShallowRenderer();
      renderer.render(getTestComponent('firstlevel.secondlevel'));
      const instance = renderer.getMountedInstance();

      const firstlevelWidget = instance.widgetFor('firstlevel');
      const titleWidget = instance.widgetFor('title');

      expect(firstlevelWidget.props.field.get('fields')[0].props.value.type).toBe('h1');
      expect(titleWidget.props.value.type).toBe('div');
    });
  });
});

function getTestComponent(identifierField) {
  const fakeCollectionData = {
    type: FOLDER,
    fields: List([
      Map({
        name: 'firstlevel',
        widget: 'object',
        fields: [
          Map({
            name: 'secondlevel',
            widget: 'string',
          }),
        ],
      }),

      Map({
        name: 'title',
        widget: 'string',
      }),
    ]),
  };

  if (identifierField) {
    fakeCollectionData.identifier_field = identifierField;
  }

  const fakeCollection = Map(fakeCollectionData);

  const fakeEntry = Map({
    data: Map({
      title: 'I am a title',
      firstlevel: Map({
        secondlevel: 'hello',
      }),
    }),
  });

  return (
    <EditorPreviewPane
      collection={fakeCollection}
      entry={fakeEntry}
      fields={fakeCollection.get('fields')}
      fieldsMetadata={Map({})}
      getAsset={() => {}}
    />
  );
}
