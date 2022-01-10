import type { EntryField } from '../types/redux';
import type { AssetProxy as AssetProxyInterface } from 'netlify-cms-lib-util';

interface AssetProxyArgs {
  path: string;
  url?: string;
  file?: File;
  field?: EntryField;
}

export default class AssetProxy implements AssetProxyInterface {
  url: string;
  fileObj?: File;
  path: string;
  field?: EntryField;

  constructor({ url, file, path, field }: AssetProxyArgs) {
    if (url) {
      this.url = url;
    } else if (file) {
      this.url = window.URL.createObjectURL(file);
    } else {
      this.url = '';
    }
    this.fileObj = file;
    this.path = path;
    this.field = field;
  }

  toString(): string {
    return this.url;
  }

  async toBase64(): Promise<string> {
    const blob = await fetch(this.url).then(response => response.blob());
    if (blob.size <= 0) {
      return '';
    }
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

export function createAssetProxy({ url, file, path, field }: AssetProxyArgs): AssetProxy {
  return new AssetProxy({ url, file, path, field });
}
