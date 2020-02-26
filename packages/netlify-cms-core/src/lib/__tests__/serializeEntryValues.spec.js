import { serializeValues, deserializeValues } from '../serializeEntryValues';
import { fromJS } from 'immutable';

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
