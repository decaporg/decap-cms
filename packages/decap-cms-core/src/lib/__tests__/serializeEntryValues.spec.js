import { fromJS } from 'immutable';

import { serializeValues, deserializeValues } from '../serializeEntryValues';

const values = fromJS({ title: 'New Post', unknown: 'Unknown Field' });
const fields = fromJS([{ name: 'title', widget: 'string' }]);

describe('serializeValues', () => {
  it('should retain unknown fields', () => {
    expect(serializeValues(values, fields)).toEqual(
      fromJS({ title: 'New Post', unknown: 'Unknown Field' }),
    );
  });
});

describe('deserializeValues', () => {
  it('should retain unknown fields', () => {
    expect(deserializeValues(values, fields)).toEqual(
      fromJS({ title: 'New Post', unknown: 'Unknown Field' }),
    );
  });
});

describe('list fields', () => {
  // A plain list widget, i.e. one without nested `fields`.
  const simpleValues = fromJS({ title: 'New Post', tags: ['tag1', 'tag2'] });
  const simpleFields = fromJS([
    { name: 'title', widget: 'string' },
    { name: 'tags', widget: 'list' },
  ]);

  it('should not duplicate simple list items when serializing', () => {
    expect(serializeValues(simpleValues, simpleFields)).toEqual(simpleValues);
  });

  it('should not duplicate simple list items when deserializing', () => {
    expect(deserializeValues(simpleValues, simpleFields)).toEqual(simpleValues);
  });

  // A list widget with nested `fields`, which recurses per item.
  const nestedValues = fromJS({
    title: 'New Post',
    authors: [{ name: 'Ada' }, { name: 'Grace' }],
  });
  const nestedFields = fromJS([
    { name: 'title', widget: 'string' },
    { name: 'authors', widget: 'list', fields: [{ name: 'name', widget: 'string' }] },
  ]);

  it('should not duplicate nested list items when serializing', () => {
    expect(serializeValues(nestedValues, nestedFields)).toEqual(nestedValues);
  });

  it('should not duplicate nested list items when deserializing', () => {
    expect(deserializeValues(nestedValues, nestedFields)).toEqual(nestedValues);
  });
});
