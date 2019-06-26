import { resolveMediaFilename, fileExtensionWithSeparator, fileExtension } from '../path';

describe('resolveMediaFilename', () => {
  it('publicly Accessible URL, no slash', () => {
    expect(
      resolveMediaFilename('image.png', {
        publicFolder: 'static/assets',
      }),
    ).toEqual('/static/assets/image.png');
  });

  it('publicly Accessible URL, with slash', () => {
    expect(
      resolveMediaFilename('image.png', {
        publicFolder: '/static/assets',
      }),
    ).toEqual('/static/assets/image.png');
  });

  it('publicly Accessible URL, root', () => {
    expect(
      resolveMediaFilename('image.png', {
        publicFolder: '/',
      }),
    ).toEqual('/image.png');
  });

  it('relative URL, same folder', () => {
    expect(
      resolveMediaFilename('image.png', {
        mediaFolder: '/content/posts',
        collectionFolder: '/content/posts',
      }),
    ).toEqual('image.png');
  });

  it('relative URL, same folder, with slash', () => {
    expect(
      resolveMediaFilename('image.png', {
        mediaFolder: '/content/posts/',
        collectionFolder: '/content/posts',
      }),
    ).toEqual('image.png');
  });

  it('relative URL, same folder, with slashes', () => {
    expect(
      resolveMediaFilename('image.png', {
        mediaFolder: '/content/posts/',
        collectionFolder: '/content/posts/',
      }),
    ).toEqual('image.png');
  });

  it('relative URL, sibling folder', () => {
    expect(
      resolveMediaFilename('image.png', {
        mediaFolder: '/content/images/',
        collectionFolder: '/content/posts/',
      }),
    ).toEqual('../images/image.png');
  });

  it('relative URL, cousin folder', () => {
    expect(
      resolveMediaFilename('image.png', {
        mediaFolder: '/content/images/pngs/',
        collectionFolder: '/content/markdown/posts/',
      }),
    ).toEqual('../../images/pngs/image.png');
  });

  it('relative URL, parent folder', () => {
    expect(
      resolveMediaFilename('image.png', {
        mediaFolder: '/content/',
        collectionFolder: '/content/posts',
      }),
    ).toEqual('../image.png');
  });

  it('relative URL, child folder', () => {
    expect(
      resolveMediaFilename('image.png', {
        mediaFolder: '/content/images',
        collectionFolder: '/content/',
      }),
    ).toEqual('images/image.png');
  });
});

describe('fileExtensionWithSeparator', () => {
  it('should return the extension of a file', () => {
    expect(fileExtensionWithSeparator('index.html')).toEqual('.html');
  });

  it('should return the extension of a file path', () => {
    expect(fileExtensionWithSeparator('/src/main/index.html')).toEqual('.html');
  });

  it('should return the extension of a file path with trailing slash', () => {
    expect(fileExtensionWithSeparator('/src/main/index.html/')).toEqual('.html');
  });

  it('should return the extension for an extension with two ..', () => {
    expect(fileExtensionWithSeparator('/src/main/index..html')).toEqual('.html');
  });

  it('should return an empty string for the parent path ..', () => {
    expect(fileExtensionWithSeparator('..')).toEqual('');
  });

  it('should return an empty string if the file has no extension', () => {
    expect(fileExtensionWithSeparator('/src/main/index')).toEqual('');
  });
});

describe('fileExtension', () => {
  it('should return the extension of a file', () => {
    expect(fileExtension('index.html')).toEqual('html');
  });

  it('should return the extension of a file path', () => {
    expect(fileExtension('/src/main/index.html')).toEqual('html');
  });

  it('should return the extension of a file path with trailing slash', () => {
    expect(fileExtension('/src/main/index.html/')).toEqual('html');
  });

  it('should return the extension for an extension with two ..', () => {
    expect(fileExtension('/src/main/index..html')).toEqual('html');
  });

  it('should return an empty string for the parent path ..', () => {
    expect(fileExtension('..')).toEqual('');
  });

  it('should return an empty string if the file has no extension', () => {
    expect(fileExtension('/src/main/index')).toEqual('');
  });
});
