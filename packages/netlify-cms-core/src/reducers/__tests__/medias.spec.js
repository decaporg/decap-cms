import { Map } from 'immutable';
import { addAssets, addAsset, removeAsset } from 'Actions/media';
import reducer from '../medias';

jest.mock('ValueObjects/AssetProxy');

describe('medias', () => {
  it('should add assets', () => {
    expect(reducer(Map(), addAssets([{ public_path: 'public_path' }]))).toEqual(
      Map({ public_path: { public_path: 'public_path' } }),
    );
  });

  it('should add asset', () => {
    expect(reducer(Map(), addAsset({ public_path: 'public_path' }))).toEqual(
      Map({ public_path: { public_path: 'public_path' } }),
    );
  });

  it('should remove asset', () => {
    expect(
      reducer(Map({ public_path: { public_path: 'public_path' } }), removeAsset('public_path')),
    ).toEqual(Map());
  });
});
