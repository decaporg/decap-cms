import { Map } from 'immutable';
import { ADD_MEDIA_FILES_TO_LIBRARY, mediaDeleted } from 'Actions/mediaLibrary';
import mediaLibrary from '../mediaLibrary';

jest.mock('uuid/v4');

describe('mediaLibrary', () => {
  const uuid = require('uuid/v4');

  it('should add media files to library', () => {
    uuid.mockReturnValue('newKey');

    expect(
      mediaLibrary(
        Map({
          files: [
            { sha: 'old', path: 'path', key: 'key1' },
            { sha: 'sha', path: 'some-other-pas', key: 'key2' },
          ],
        }),
        {
          type: ADD_MEDIA_FILES_TO_LIBRARY,
          payload: { mediaFiles: [{ sha: 'new', path: 'path' }] },
        },
      ),
    ).toEqual(
      Map({
        files: [
          { sha: 'new', path: 'path', key: 'newKey' },
          { sha: 'sha', path: 'some-other-pas', key: 'key2' },
        ],
      }),
    );
  });

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
