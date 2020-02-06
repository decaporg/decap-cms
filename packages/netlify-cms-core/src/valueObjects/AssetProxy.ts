interface AssetProxyArgs {
  path: string;
  url?: string;
  file?: File;
  folder?: string;
}

export default class AssetProxy {
  url: string;
  fileObj?: File;
  path: string;
  folder?: string;

  constructor({ url, file, path, folder }: AssetProxyArgs) {
    this.url = url ? url : window.URL.createObjectURL(file);
    this.fileObj = file;
    this.path = path;
    this.folder = folder;
  }

  toString(): string {
    return this.url;
  }

  async toBase64(): Promise<string> {
    const blob = await fetch(this.url).then(response => response.blob());
    const result = await new Promise<string>(resolve => {
      const fr = new FileReader();
      fr.onload = (readerEvt): void => {
        const binaryString = readerEvt.target?.result || '';

        resolve(binaryString.toString().split('base64,')[1]);
      };
      fr.readAsDataURL(blob);
    });

    return result;
  }
}

export function createAssetProxy({ url, file, path, folder }: AssetProxyArgs): AssetProxy {
  return new AssetProxy({ url, file, path, folder });
}
