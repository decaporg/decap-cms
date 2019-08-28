import { OrderedMap, fromJS, Map, List } from 'immutable';
import { configLoaded } from 'Actions/config';
import collections, { selectIdentifier } from '../collections';

describe('collections', () => {
  it('should handle an empty state', () => {
    expect(collections(undefined, {})).toEqual(null);
  });

  it('should load the collections from the config', () => {
    expect(
      collections(
        undefined,
        configLoaded(
          fromJS({
            collections: [
              {
                name: 'posts',
                folder: '_posts',
                fields: [{ name: 'title', widget: 'string' }],
              },
            ],
          }),
        ),
      ),
    ).toEqual(
      OrderedMap({
        posts: fromJS({
          name: 'posts',
          folder: '_posts',
          fields: [{ name: 'title', widget: 'string' }],
          type: 'folder_based_collection',
        }),
      }),
    );
  });

  describe('selectIdentifier', () => {
    it('should return null if a nested identifier_field does not have corresponding field', () => {
      expect(selectIdentifier(getFixture('not.a.real.field'))).toBe(null);
    });

    it('should return a field path when identifier_field is nested', () => {
      expect(selectIdentifier(getFixture('firstlevel.othersecondlevel.wowsonested'))).toEqual([
        'firstlevel',
        'othersecondlevel',
        'wowsonested',
      ]);
    });

    it('should fall back to title if a non-nested identifier_field does not have a corresponding field', () => {
      expect(selectIdentifier(getFixture('notarealfield'))).toBe('title');
    });
  });
});

function getFixture(identifierField) {
  const collectionData = {
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

      Map({
        name: 'randomtoplevel',
        widget: 'string',
      }),
    ]),
  };

  if (identifierField) {
    collectionData.identifier_field = identifierField;
  }

  const collection = Map(collectionData);

  return collection;
}
