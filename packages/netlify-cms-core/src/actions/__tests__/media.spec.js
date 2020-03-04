import { Map } from 'immutable';
import { getAsset, ADD_ASSET, LOAD_ASSET_REQUEST } from '../media';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AssetProxy from '../../valueObjects/AssetProxy';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock('../../reducers/entries');
jest.mock('../mediaLibrary');

describe('media', () => {
  const emptyAsset = new AssetProxy({
    path: 'empty.svg',
    file: new File([`<svg xmlns="http://www.w3.org/2000/svg"></svg>`], 'empty.svg', {
      type: 'image/svg+xml',
    }),
  });

  describe('getAsset', () => {
    global.URL = { createObjectURL: jest.fn() };

    const { selectMediaFilePath } = require('../../reducers/entries');

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should return empty asset for null path', () => {
      const store = mockStore({});

      const payload = { collection: null, entryPath: null, path: null };

      const result = store.dispatch(getAsset(payload));
      const actions = store.getActions();
      expect(actions).toHaveLength(0);
      expect(result).toEqual(emptyAsset);
    });

    it('should return asset from medias state', () => {
      const path = 'static/media/image.png';
      const asset = new AssetProxy({ file: new File([], 'empty'), path });
      const store = mockStore({
        config: Map(),
        medias: Map({
          [path]: { asset },
        }),
      });

      selectMediaFilePath.mockReturnValue(path);
      const payload = { collection: Map(), entry: Map({ path: 'entryPath' }), path };

      const result = store.dispatch(getAsset(payload));
      const actions = store.getActions();
      expect(actions).toHaveLength(0);

      expect(result).toBe(asset);
      expect(selectMediaFilePath).toHaveBeenCalledTimes(1);
      expect(selectMediaFilePath).toHaveBeenCalledWith(
        store.getState().config,
        payload.collection,
        payload.entry,
        path,
        undefined,
      );
    });

    it('should create asset for absolute path when not in medias state', () => {
      const path = 'https://asset.netlify.com/image.png';

      const asset = new AssetProxy({ url: path, path });
      const store = mockStore({
        medias: Map({}),
      });

      selectMediaFilePath.mockReturnValue(path);
      const payload = { collection: null, entryPath: null, path };

      const result = store.dispatch(getAsset(payload));
      const actions = store.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        type: ADD_ASSET,
        payload: asset,
      });
      expect(result).toEqual(asset);
    });

    it('should return empty asset and initiate load when not in medias state', () => {
      const path = 'static/media/image.png';
      const store = mockStore({
        medias: Map({}),
      });

      selectMediaFilePath.mockReturnValue(path);
      const payload = { path };

      const result = store.dispatch(getAsset(payload));
      const actions = store.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        type: LOAD_ASSET_REQUEST,
        payload: { path },
      });
      expect(result).toEqual(emptyAsset);
    });

    it('should return asset with original path on load error', () => {
      const path = 'static/media/image.png';
      const resolvePath = 'resolvePath';
      const store = mockStore({
        medias: Map({ [resolvePath]: { error: true } }),
      });

      selectMediaFilePath.mockReturnValue(resolvePath);
      const payload = { path };

      const result = store.dispatch(getAsset(payload));
      const actions = store.getActions();

      const asset = new AssetProxy({ url: path, path: resolvePath });
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        type: ADD_ASSET,
        payload: asset,
      });
      expect(result).toEqual(asset);
    });
  });
});
