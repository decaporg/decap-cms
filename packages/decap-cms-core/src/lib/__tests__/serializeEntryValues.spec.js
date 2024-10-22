import { fromJS } from 'immutable';

import { serializeValues, deserializeValues } from '../serializeEntryValues';

const values = fromJS({ title: 'New Post', unknown: 'Unknown Field', removed_image: '' });
const fields = fromJS([{ name: 'title', widget: 'string' }, { name: 'removed_image', widget: 'image' }]);

describe('serializeValues', () => {
  it('should retain unknown fields', () => {
    expect(serializeValues(values, fields)).toEqual(
      fromJS({ title: 'New Post', unknown: 'Unknown Field', removed_image: '' }),
    );
  });

  it('should remove image field', () => {
    expect(serializeValues(values, fields, { remove_empty_image_field: true })).toEqual(
      fromJS({ title: 'New Post', unknown: 'Unknown Field' }),
    );
  });
});

describe('deserializeValues', () => {
  it('should retain unknown fields', () => {
    expect(deserializeValues(values, fields)).toEqual(
      fromJS({ title: 'New Post', unknown: 'Unknown Field', removed_image: '' }),
    );
  });
});
