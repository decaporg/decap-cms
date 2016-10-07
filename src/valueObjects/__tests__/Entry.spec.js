import { createEntry } from '../Entry';

describe('createEntry', () => {
  it('should return an object with default parameters', () => {
    expect(createEntry()).toEqual({
      path: '',
      slug: '',
      raw: '',
      data: {},
      metaData: {},
    });
  });

  it('should return an object with passed parameters', () => {
    expect(createEntry('path', 'slug', 'raw')).toEqual({
      path: 'path',
      slug: 'slug',
      raw: 'raw',
      data: {},
      metaData: {},
    });
  });
});
