import { fileExtensionWithSeparator, fileExtension } from '../path';

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
