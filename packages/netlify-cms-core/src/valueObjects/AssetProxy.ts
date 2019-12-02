import { resolvePath } from 'netlify-cms-lib-util';

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
  value: string;
  fileObj: File | null;
  uploaded?: boolean;
  asset?: IntegrationAsset | null;
  mediaFolder: string;
  publicFolder: string;
}

export default class AssetProxy {
  value: string;
  fileObj: File | null;
  uploaded: boolean;
  sha: null;
  asset: unknown;
  path: string;
  public_path: string;

  constructor({
    value,
    fileObj,
    mediaFolder,
    publicFolder,
    uploaded = false,
    asset = null,
  }: AssetProxyArgs) {
    this.value = value;
    this.fileObj = fileObj;
    this.uploaded = uploaded;
    this.sha = null;
    this.asset = asset;

    this.path = resolveAssetPath(mediaFolder, uploaded, value);
    /* eslint-disable @typescript-eslint/camelcase */
    this.public_path = resolveAssetPublicPath(publicFolder, uploaded, value);
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
  value,
  fileObj,
  uploaded = false,
  privateUpload = false,
  mediaFolder,
  publicFolder,
  integration,
  getIntegrationProvider,
}: AssetProxyArgs & {
  privateUpload: boolean;
  integration?: {};
  getIntegrationProvider?: () => {
    upload: (fileObj: File | null, privateUpload: boolean) => Promise<{ asset: IntegrationAsset }>;
  };
}): Promise<AssetProxy> {
  if (integration && !uploaded && getIntegrationProvider) {
    const provider = getIntegrationProvider();
    return provider.upload(fileObj, privateUpload).then(
      response =>
        new AssetProxy({
          value: response.asset.url.replace(/^(https?):/, ''),
          fileObj: null,
          uploaded: true,
          asset: response.asset,
          mediaFolder,
          publicFolder,
        }),
      () => new AssetProxy({ value, fileObj, uploaded: false, mediaFolder, publicFolder }),
    );
  } else if (privateUpload) {
    throw new Error('The Private Upload option is only available for Asset Store Integration');
  }

  return Promise.resolve(new AssetProxy({ value, fileObj, uploaded, mediaFolder, publicFolder }));
}
