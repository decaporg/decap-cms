import { fromJS } from 'immutable';

import { serializeValues, deserializeValues } from '../serializeEntryValues';
import { registerWidgetValueSerializer } from '../registry';

const values = fromJS({ title: 'New Post', unknown: 'Unknown Field', removed_image: '' });
const fields = fromJS([
  { name: 'title', widget: 'string' },
  { name: 'removed_image', widget: 'image' },
]);

describe('serializeValues', () => {
  it('should retain unknown fields', () => {
    expect(serializeValues(values, fields)).toEqual(
      fromJS({ title: 'New Post', unknown: 'Unknown Field', removed_image: '' }),
    );
  });

  it('should remove empty fields for configured widgets', () => {
    const configuredValues = values.merge(fromJS({ removed_title: '', count: 0, featured: false }));
    const configuredFields = fields.concat(
      fromJS([
        { name: 'removed_title', widget: 'string' },
        { name: 'count', widget: 'number' },
        { name: 'featured', widget: 'boolean' },
      ]),
    );

    expect(
      serializeValues(configuredValues, configuredFields, {
        remove_empty_fields: ['image', 'string', 'number', 'boolean'],
      }),
    ).toEqual(
      fromJS({
        title: 'New Post',
        unknown: 'Unknown Field',
        count: 0,
        featured: false,
      }),
    );
  });

  it('should remove nested fields and preserve dots in field names', () => {
    const nestedValues = fromJS({
      sections: [{ image: '', 'hero.image': '' }, { image: 'image.jpg' }],
    });
    const nestedFields = fromJS([
      {
        name: 'sections',
        widget: 'list',
        fields: [
          { name: 'image', widget: 'image' },
          { name: 'hero.image', widget: 'image' },
        ],
      },
    ]);

    expect(serializeValues(nestedValues, nestedFields, { remove_empty_fields: ['image'] })).toEqual(
      fromJS({ sections: [{}, { image: 'image.jpg' }] }),
    );
  });

  it('should not retain removal paths after a serializer throws', () => {
    registerWidgetValueSerializer('throwing-widget', {
      serialize: () => {
        throw new Error('Serialization failed');
      },
    });
    const failingFields = fromJS([
      { name: 'removed_image', widget: 'image' },
      { name: 'content', widget: 'throwing-widget' },
    ]);

    expect(() =>
      serializeValues(fromJS({ removed_image: '', content: 'value' }), failingFields, {
        remove_empty_fields: ['image'],
      }),
    ).toThrow('Serialization failed');

    expect(
      serializeValues(
        fromJS({ removed_image: 'image.jpg' }),
        fromJS([{ name: 'removed_image', widget: 'image' }]),
        { remove_empty_fields: ['image'] },
      ),
    ).toEqual(fromJS({ removed_image: 'image.jpg' }));
  });

  it('should retain empty fields for widgets that are not configured', () => {
    expect(serializeValues(values, fields, { remove_empty_fields: ['string'] })).toEqual(
      fromJS({ title: 'New Post', unknown: 'Unknown Field', removed_image: '' }),
    );
  });

  it('should treat fields without a widget as string fields', () => {
    expect(
      serializeValues(fromJS({ subtitle: '' }), fromJS([{ name: 'subtitle' }]), {
        remove_empty_fields: ['string'],
      }),
    ).toEqual(fromJS({}));
  });

  it('should remove null fields for configured widgets', () => {
    expect(
      serializeValues(fromJS({ image: null }), fromJS([{ name: 'image', widget: 'image' }]), {
        remove_empty_fields: ['image'],
      }),
    ).toEqual(fromJS({}));
  });
});

describe('deserializeValues', () => {
  it('should retain unknown fields', () => {
    expect(deserializeValues(values, fields)).toEqual(
      fromJS({ title: 'New Post', unknown: 'Unknown Field', removed_image: '' }),
    );
  });
});
