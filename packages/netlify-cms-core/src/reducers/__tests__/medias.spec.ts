import { Map, fromJS } from 'immutable';
import { addAssets, addAsset, removeAsset } from '../../actions/media';
import reducer from '../medias';
import { createAssetProxy } from '../../valueObjects/AssetProxy';

describe('medias', () => {
  const asset = createAssetProxy({ url: 'url', path: 'path' });

  it('should add assets', () => {
    expect(reducer(fromJS({}), addAssets([asset]))).toEqual(Map({ path: asset }));
  });

  it('should add asset', () => {
    expect(reducer(fromJS({}), addAsset(asset))).toEqual(Map({ path: asset }));
  });

  it('should remove asset', () => {
    expect(reducer(fromJS({ path: asset }), removeAsset(asset.path))).toEqual(Map());
  });
});
