import { resolvePath, fileExtensionWithSeparator, fileExtension } from '../pathHelper';

describe('resolvePath', () => {
  it('should return null if no file name specified', () => {
    expect(
      resolvePath('', 'assets/uploads')
    ).toBeNull();
  });
  it('should return the file name without change if it is absolute', () => {
    expect(
      resolvePath('https://my-asset-store.com/filename.png', 'assets/uploads')
    ).toEqual(
      'https://my-asset-store.com/filename.png'
    );
  });
  it('should consider the file name a path relative to the site root if it contains slashes', () => {
    expect(
      resolvePath('folder/filename.png', 'assets/uploads')
    ).toEqual(
      '/folder/filename.png'
    );
  });
  it('should prepend the basePath to the file name', () => {
    expect(
      resolvePath('filename.png', 'assets/uploads')
    ).toEqual(
      '/assets/uploads/filename.png'
    );
  });
  it('should consider the basePath relative to the site root', () => {
    expect(
      resolvePath('filename.png', 'assets/uploads')
    ).toEqual(
      '/assets/uploads/filename.png'
    );
  });
  it('should consider the basePath absolute if it begins with a protocol', () => {
    expect(
      resolvePath('filename.png', 'https://my-asset-store.com/assets/uploads')
    ).toEqual(
      'https://my-asset-store.com/assets/uploads/filename.png'
    );
  });
  it('should consider the basePath absolute if it begins with double-slashes', () => {
    expect(
      resolvePath('filename.png', '//my-asset-store.com/assets/uploads')
    ).toEqual(
      '//my-asset-store.com/assets/uploads/filename.png'
    );
  });
  it('should remove duplicate and/or forward path separators', () => {
    expect(
      resolvePath('filename.png', '\\assets\\uploads\\')
    ).toEqual(
      '/assets/uploads/filename.png'
    );
  });
});

describe('fileExtensionWithSeparator', () => {
  it('should return the extension of a file', () => {
    expect(
      fileExtensionWithSeparator('index.html')
    ).toEqual(
      '.html'
    );
  });

  it('should return the extension of a file path', () => {
    expect(
      fileExtensionWithSeparator('/src/main/index.html')
    ).toEqual(
      '.html'
    );
  });

  it('should return the extension of a file path with trailing slash', () => {
    expect(
      fileExtensionWithSeparator('/src/main/index.html/')
    ).toEqual(
      '.html'
    );
  });

  it('should return the extension for an extension with two ..', () => {
    expect(
      fileExtensionWithSeparator('/src/main/index..html')
    ).toEqual(
      '.html'
    );
  });

  it('should return an empty string for the parent path ..', () => {
    expect(
      fileExtensionWithSeparator('..')
    ).toEqual(
      ''
    );
  });

  it('should return an empty string if the file has no extension', () => {
    expect(
      fileExtensionWithSeparator('/src/main/index')
    ).toEqual(
      ''
    );
  });
});

describe('fileExtension', () => {
  it('should return the extension of a file', () => {
    expect(
      fileExtension('index.html')
    ).toEqual(
      'html'
    );
  });

  it('should return the extension of a file path', () => {
    expect(
      fileExtension('/src/main/index.html')
    ).toEqual(
      'html'
    );
  });

  it('should return the extension of a file path with trailing slash', () => {
    expect(
      fileExtension('/src/main/index.html/')
    ).toEqual(
      'html'
    );
  });

  it('should return the extension for an extension with two ..', () => {
    expect(
      fileExtension('/src/main/index..html')
    ).toEqual(
      'html'
    );
  });

  it('should return an empty string for the parent path ..', () => {
    expect(
      fileExtension('..')
    ).toEqual(
      ''
    );
  });

  it('should return an empty string if the file has no extension', () => {
    expect(
      fileExtension('/src/main/index')
    ).toEqual(
      ''
    );
  });
});
