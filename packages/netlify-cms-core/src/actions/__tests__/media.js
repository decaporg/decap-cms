import { Map } from 'immutable';
import { getAsset, ADD_ASSET } from '../media';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AssetProxy from '../../valueObjects/AssetProxy';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock('../../reducers/entries');
jest.mock('../mediaLibrary');
jest.mock('../../reducers/mediaLibrary');

describe('media', () => {
  describe('getAsset', () => {
    global.URL = { createObjectURL: jest.fn() };

    const { selectMediaFilePath } = require('../../reducers/entries');
    const { selectMediaFileByPath } = require('../../reducers/mediaLibrary');
    const { getMediaDisplayURL, getMediaFile } = require('../mediaLibrary');

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should return empty asset for null path', () => {
      const store = mockStore({});

      const payload = { collection: null, entryPath: null, path: null };

      return store.dispatch(getAsset(payload)).then(result => {
        const actions = store.getActions();
        expect(actions).toHaveLength(0);

        expect(result).toEqual(new AssetProxy({ file: new File([], 'empty'), path: '' }));
      });
    });

    it('should return asset from medias state', () => {
      const path = 'static/media/image.png';
      const asset = new AssetProxy({ file: new File([], 'empty'), path });
      const store = mockStore({
        config: Map(),
        medias: Map({
          [path]: asset,
        }),
      });

      selectMediaFilePath.mockReturnValue(path);
      const payload = { collection: Map(), entry: Map({ path: 'entryPath' }), path };

      return store.dispatch(getAsset(payload)).then(result => {
        const actions = store.getActions();
        expect(actions).toHaveLength(0);

        expect(result).toBe(asset);
        expect(selectMediaFilePath).toHaveBeenCalledTimes(1);
        expect(selectMediaFilePath).toHaveBeenCalledWith(
          store.getState().config,
          payload.collection,
          payload.entry,
          path,
        );
      });
    });

    it('should create asset for absolute path when not in medias state', () => {
      const path = 'https://asset.netlify.com/image.png';

      const asset = new AssetProxy({ url: path, path });
      const store = mockStore({
        medias: Map({}),
      });

      selectMediaFilePath.mockReturnValue(path);
      const payload = { collection: null, entryPath: null, path };

      return store.dispatch(getAsset(payload)).then(result => {
        const actions = store.getActions();
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
          type: ADD_ASSET,
          payload: asset,
        });
        expect(result).toEqual(asset);
      });
    });

    it('should create asset from media file when not in medias state', () => {
      const path = 'static/media/image.png';
      const mediaFile = { file: new File([], '') };
      const url = 'blob://displayURL';
      const asset = new AssetProxy({ url, path });
      const store = mockStore({
        medias: Map({}),
      });

      selectMediaFilePath.mockReturnValue(path);
      selectMediaFileByPath.mockReturnValue(mediaFile);
      getMediaDisplayURL.mockResolvedValue(url);
      const payload = { path };

      return store.dispatch(getAsset(payload)).then(result => {
        const actions = store.getActions();
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
          type: ADD_ASSET,
          payload: asset,
        });
        expect(result).toEqual(asset);
      });
    });

    it('should fetch asset media file when not in redux store', () => {
      const path = 'static/media/image.png';
      const url = 'blob://displayURL';
      const asset = new AssetProxy({ url, path });
      const store = mockStore({
        medias: Map({}),
      });

      selectMediaFilePath.mockReturnValue(path);
      selectMediaFileByPath.mockReturnValue(undefined);
      getMediaFile.mockResolvedValue({ url });
      const payload = { path };

      return store.dispatch(getAsset(payload)).then(result => {
        const actions = store.getActions();
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
          type: ADD_ASSET,
          payload: asset,
        });
        expect(result).toEqual(asset);
      });
    });
  });
});
