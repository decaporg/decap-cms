import { Map } from 'immutable';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mocked } from 'jest-mock';

import { getAsset, ADD_ASSET, LOAD_ASSET_REQUEST } from '../media';
import { selectMediaFilePath } from '../../reducers/entries';
import AssetProxy from '../../valueObjects/AssetProxy';

import type { State } from '../../types/redux';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';

const middlewares = [thunk];
const mockStore = configureMockStore<Partial<State>, ThunkDispatch<State, {}, AnyAction>>(
  middlewares,
);
const mockedSelectMediaFilePath = mocked(selectMediaFilePath);

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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.URL = { createObjectURL: jest.fn() };

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should return empty asset for null path', () => {
      const store = mockStore({});

      const payload = { collection: null, entryPath: null, entry: null, path: null };

      // TODO change to proper payload when immutable is removed
      //  from 'collections' and 'entries' state slices
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = store.dispatch(getAsset(payload));
      const actions = store.getActions();
      expect(actions).toHaveLength(0);
      expect(result).toEqual(emptyAsset);
    });

    it('should return asset from medias state', () => {
      const path = 'static/media/image.png';
      const asset = new AssetProxy({ file: new File([], 'empty'), path });
      const store = mockStore({
        // TODO change to proper store data when immutable is removed
        //  from 'config' state slice
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config: Map(),
        medias: {
          [path]: { asset, isLoading: false, error: null },
        },
      });

      mockedSelectMediaFilePath.mockReturnValue(path);
      const payload = { collection: Map(), entry: Map({ path: 'entryPath' }), path };

      // TODO change to proper payload when immutable is removed
      //  from 'collections' and 'entries' state slices
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = store.dispatch(getAsset(payload));
      const actions = store.getActions();
      expect(actions).toHaveLength(0);

      expect(result).toBe(asset);
      expect(mockedSelectMediaFilePath).toHaveBeenCalledTimes(1);
      expect(mockedSelectMediaFilePath).toHaveBeenCalledWith(
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
        medias: {},
      });

      mockedSelectMediaFilePath.mockReturnValue(path);
      const payload = { collection: null, entryPath: null, path };

      // TODO change to proper payload when immutable is removed
      //  from 'collections' state slice
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
        medias: {},
      });

      mockedSelectMediaFilePath.mockReturnValue(path);
      const payload = { path };

      // TODO change to proper payload when immutable is removed
      //  from 'collections' and 'entries' state slices
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
        medias: {
          [resolvePath]: {
            asset: undefined,
            error: new Error('test'),
            isLoading: false,
          },
        },
      });

      mockedSelectMediaFilePath.mockReturnValue(resolvePath);
      const payload = { path };

      // TODO change to proper payload when immutable is removed
      //  from 'collections' and 'entries' state slices
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
