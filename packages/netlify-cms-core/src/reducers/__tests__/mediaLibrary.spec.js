import { Map, fromJS } from 'immutable';
import { mediaDeleted } from 'Actions/mediaLibrary';
import mediaLibrary, {
  selectMediaFiles,
  selectMediaFileByPath,
  selectMediaDisplayURL,
} from '../mediaLibrary';

jest.mock('uuid/v4');
jest.mock('Reducers/entries');
jest.mock('Reducers');

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

  it('should select draft media files when editing a draft', () => {
    const { selectEditingDraft } = require('Reducers/entries');

    selectEditingDraft.mockReturnValue(true);

    const state = {
      entryDraft: fromJS({ entry: { mediaFiles: [{ id: 1 }] } }),
    };

    expect(selectMediaFiles(state)).toEqual([{ key: 1, id: 1 }]);
  });

  it('should select global media files when not editing a draft', () => {
    const { selectEditingDraft } = require('Reducers/entries');

    selectEditingDraft.mockReturnValue(false);

    const state = {
      mediaLibrary: Map({ files: [{ id: 1 }] }),
    };

    expect(selectMediaFiles(state)).toEqual([{ id: 1 }]);
  });

  it('should select global media files when not using asset store integration', () => {
    const { selectIntegration } = require('Reducers');

    selectIntegration.mockReturnValue({});

    const state = {
      mediaLibrary: Map({ files: [{ id: 1 }] }),
    };

    expect(selectMediaFiles(state)).toEqual([{ id: 1 }]);
  });

  it('should return media file by path', () => {
    const { selectEditingDraft } = require('Reducers/entries');

    selectEditingDraft.mockReturnValue(false);

    const state = {
      mediaLibrary: Map({ files: [{ id: 1, path: 'path' }] }),
    };

    expect(selectMediaFileByPath(state, 'path')).toEqual({ id: 1, path: 'path' });
  });

  it('should return media display URL state', () => {
    const state = {
      mediaLibrary: fromJS({ displayURLs: { id: { url: 'url' } } }),
    };

    expect(selectMediaDisplayURL(state, 'id')).toEqual(Map({ url: 'url' }));
  });
});
