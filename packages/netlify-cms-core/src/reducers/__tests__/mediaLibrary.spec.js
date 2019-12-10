import { Map } from 'immutable';
import { mediaDeleted } from 'Actions/mediaLibrary';
import mediaLibrary from '../mediaLibrary';

jest.mock('uuid/v4');

describe('mediaLibrary', () => {
  it('should remove media file by key', () => {
    expect(
      mediaLibrary(
        Map({
          files: [{ key: 'key1' }, { key: 'key2' }],
        }),
        mediaDeleted({ key: 'key1' }),
      ),
    ).toEqual(
      Map({
        isDeleting: false,
        files: [{ key: 'key2' }],
      }),
    );
  });

  it('should remove media file by id', () => {
    expect(
      mediaLibrary(
        Map({
          files: [{ id: 'id1' }, { id: 'id2' }],
        }),
        mediaDeleted({ id: 'id1' }),
      ),
    ).toEqual(
      Map({
        isDeleting: false,
        files: [{ id: 'id2' }],
      }),
    );
  });
});
