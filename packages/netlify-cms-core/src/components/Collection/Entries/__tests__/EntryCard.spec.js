import React from 'react';
import TestRenderer from 'react-test-renderer';
import { FOLDER } from 'Constants/collectionTypes';
import EntryListing from '../EntryListing';
import { List, Map } from 'immutable';
import { StaticRouter } from 'react-router-dom';

const defaultTitleValue = 'I am the most amazing title!';
const nestedFieldValue = 'Life as a nested field is sweet!';
const veryNestedFieldValue = 'I am super nested!';

describe('EntryListing', () => {
  describe('when identifier_field is not set', () => {
    it('should display the title field as card heading', () => {
      const renderer = TestRenderer.create(getTestComponent());
      const instance = renderer.root;
      expect(instance.findByType('h2').children[0]).toBe(defaultTitleValue);
    });
  });

  describe('when identifier_field is set to a nested field', () => {
    it('should display the nested field as the card heading', () => {
      const renderer = TestRenderer.create(getTestComponent('firstlevel.secondlevel'));
      const instance = renderer.root;
      expect(instance.findByType('h2').children[0]).toBe(nestedFieldValue);
    });

    it('should display the very nested field as the card heading', () => {
      const renderer = TestRenderer.create(
        getTestComponent('firstlevel.othersecondlevel.wowsonested'),
      );
      const instance = renderer.root;
      expect(instance.findByType('h2').children[0]).toBe(veryNestedFieldValue);
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
        fields: List([
          Map({
            name: 'secondlevel',
            widget: 'string',
          }),
          Map({
            name: 'othersecondlevel',
            widget: 'object',
            fields: List([
              Map({
                name: 'wowsonested',
                widget: 'string',
              }),
            ]),
          }),
        ]),
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
      title: defaultTitleValue,
      firstlevel: Map({
        secondlevel: nestedFieldValue,
        othersecondlevel: Map({
          wowsonested: veryNestedFieldValue,
        }),
      }),
    }),
  });

  const NOOP = () => {};

  return (
    <StaticRouter context={{}}>
      <EntryListing
        collections={List([fakeCollection])}
        entries={List([fakeEntry])}
        publicFolder=""
        cursor={{}}
        handleCursorActions={NOOP}
      />
    </StaticRouter>
  );
}
