import { Plugin } from '@uppy/core';

export class CMSUploader extends Plugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = opts.id || 'CMSUploader';
    this.type = 'uploader';
    this.title = 'CMSUploader';
    this.handleUpload = this.handleUpload.bind(this);
    this.handlePersist = opts.handlePersist;
  }

  async handleUpload(fileIDs) {
    if (fileIDs.length === 0) {
      return;
    }

    const files = fileIDs.map(fileID => this.uppy.getFile(fileID));
    await Promise.all(
      files.map(async file => {
        this.uppy.emit('upload-started', file);
        await this.handlePersist(file.data);
        this.uppy.emit('upload-success', file, { status: 200 });
      }),
    );
  }

  install() {
    this.uppy.addUploader(this.handleUpload);
  }

  uninstall() {
    this.uppy.removeUploader(this.handleUpload);
  }
}
