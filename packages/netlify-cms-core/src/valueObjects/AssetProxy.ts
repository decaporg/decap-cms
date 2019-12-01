import { resolvePath } from 'netlify-cms-lib-util';
// @ts-ignore
import { currentBackend } from '../backend';
// @ts-ignore
import { getIntegrationProvider } from '../integrations';
// @ts-ignore
import { selectIntegration } from '../reducers';

export function resolveAssetPath(folder: string, uploaded: boolean, value: string): string {
  return folder && !uploaded ? resolvePath(value, folder) : value;
}

export function resolveAssetPublicPath(folder: string, uploaded: boolean, value: string): string {
  return !uploaded ? resolvePath(value, folder) : value;
}

interface IntegrationAsset {
  url: string;
}

interface AssetProxyArgs {
  state: any;
  value: string;
  fileObj: File | null;
  uploaded?: boolean;
  asset?: IntegrationAsset | null;
}

export default class AssetProxy {
  value: string;
  fileObj: File | null;
  uploaded: boolean;
  sha: null;
  asset: unknown;
  path: string;
  public_path: string;

  constructor({ state, value, fileObj, uploaded = false, asset = null }: AssetProxyArgs) {
    this.value = value;
    this.fileObj = fileObj;
    this.uploaded = uploaded;
    this.sha = null;
    this.asset = asset;

    this.path = resolveAssetPath(state.config.get('media_folder'), uploaded, value);

    /* eslint-disable @typescript-eslint/camelcase */
    this.public_path = resolveAssetPublicPath(state.config.get('public_folder'), uploaded, value);
  }

  toString(): string {
    // Use the deployed image path if we do not have a locally cached copy.
    if (this.uploaded && !this.fileObj) return this.public_path;
    try {
      return window.URL.createObjectURL(this.fileObj);
    } catch (error) {
      return '';
    }
  }

  toBase64(): Promise<string> {
    return new Promise(resolve => {
      const fr = new FileReader();
      fr.onload = (readerEvt): void => {
        const binaryString = readerEvt.target?.result || '';

        resolve(binaryString.toString().split('base64,')[1]);
      };
      fr.readAsDataURL(this.fileObj as Blob);
    });
  }
}

export function createAssetProxy({
  state,
  value,
  fileObj,
  uploaded = false,
  privateUpload = false,
}: AssetProxyArgs & { privateUpload: boolean }): Promise<AssetProxy> {
  const integration = selectIntegration(state, null, 'assetStore');
  if (integration && !uploaded) {
    const provider =
      integration &&
      getIntegrationProvider(
        state.integrations,
        currentBackend(state.config).getToken,
        integration,
      );
    return provider.upload(fileObj, privateUpload).then(
      (response: { asset: IntegrationAsset }) =>
        new AssetProxy({
          state,
          value: response.asset.url.replace(/^(https?):/, ''),
          fileObj: null,
          uploaded: true,
          asset: response.asset,
        }),
      () => new AssetProxy({ state, value, fileObj, uploaded: false }),
    );
  } else if (privateUpload) {
    throw new Error('The Private Upload option is only available for Asset Store Integration');
  }

  return Promise.resolve(new AssetProxy({ state, value, fileObj, uploaded }));
}
