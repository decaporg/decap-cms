import { Map, fromJS } from 'immutable';
import {
  addAssets,
  addAsset,
  removeAsset,
  loadAssetRequest,
  loadAssetSuccess,
  loadAssetFailure,
} from '../../actions/media';
import reducer from '../medias';
import { createAssetProxy } from '../../valueObjects/AssetProxy';

describe('medias', () => {
  const asset = createAssetProxy({ url: 'url', path: 'path' });

  it('should add assets', () => {
    expect(reducer(fromJS({}), addAssets([asset]))).toEqual(
      Map({ path: { asset, isLoading: false, error: null } }),
    );
  });

  it('should add asset', () => {
    expect(reducer(fromJS({}), addAsset(asset))).toEqual(
      Map({ path: { asset, isLoading: false, error: null } }),
    );
  });

  it('should remove asset', () => {
    expect(reducer(fromJS({ path: asset }), removeAsset(asset.path))).toEqual(Map());
  });

  it('should mark asset as loading', () => {
    expect(reducer(fromJS({}), loadAssetRequest(asset.path))).toEqual(
      Map({ path: { isLoading: true } }),
    );
  });

  it('should mark asset as not loading', () => {
    expect(reducer(fromJS({}), loadAssetSuccess(asset.path))).toEqual(
      Map({ path: { isLoading: false, error: null } }),
    );
  });

  it('should set loading error', () => {
    const error = new Error('some error');
    expect(reducer(fromJS({}), loadAssetFailure(asset.path, error))).toEqual(
      Map({ path: { isLoading: false, error } }),
    );
  });
});
