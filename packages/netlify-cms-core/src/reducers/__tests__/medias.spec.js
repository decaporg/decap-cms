import { Map } from 'immutable';
import { addAssets, addAsset, removeAsset } from 'Actions/media';
import medias from '../medias';

describe('medias', () => {
  it('should add assets', () => {
    expect(medias(Map(), addAssets([{ public_path: 'public_path' }]))).toEqual(
      Map({ public_path: { public_path: 'public_path' } }),
    );
  });

  it('should add asset', () => {
    expect(medias(Map(), addAsset({ public_path: 'public_path' }))).toEqual(
      Map({ public_path: { public_path: 'public_path' } }),
    );
  });

  it('should remove asset', () => {
    expect(
      medias(Map({ public_path: { public_path: 'public_path' } }), removeAsset('public_path')),
    ).toEqual(Map());
  });
});
