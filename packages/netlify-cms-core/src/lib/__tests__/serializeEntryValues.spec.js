import { serializeValues, deserializeValues } from '../serializeEntryValues';
import { fromJS } from 'immutable';

const values = fromJS({ title: 'New Post', unknown: 'Unknown Field' });
const fields = fromJS([{ name: 'title', widget: 'string' }]);
const collection = fromJS({ name: 'collection' });

describe('serializeValues', () => {
  it('should retain unknown fields', () => {
    expect(serializeValues(collection, values, fields)).toEqual(
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
