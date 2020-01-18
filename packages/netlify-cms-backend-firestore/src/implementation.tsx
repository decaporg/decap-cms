import * as React from 'react';
import trimStart from 'lodash/trimStart';
import {
  Implementation,
  AssetProxy,
  PersistOptions,
  DisplayURL,
  Entry,
  User,
  Credentials,
  Config,
  ImplementationFile,
} from 'netlify-cms-lib-util';
import AuthenticationPage from './AuthenticationPage';
import API from './API';


export default class Firebase implements Implementation {
  api: API | null;
  options: {
    proxied: boolean;
    API: API | null;
    useWorkflow?: boolean;
    initialWorkflowStatus: string;
  };

  mediaFolder: string;
  dbCollection?: string;
  bucket?: string;
  token: string | null;

  constructor(config: Config, options = {}) {
    this.options = {
      proxied: false,
      API: null,
      initialWorkflowStatus: '',
      ...options,
    };

    this.api = this.options.API || null;
    this.dbCollection = config.backend.collection;
    this.bucket = config.backend.bucket;
    this.mediaFolder = config.media_folder;
    this.token = '';
  }

  authComponent() {
    const wrappedAuthenticationPage = (props: Record<string, unknown>) => (
      <AuthenticationPage {...props} backend={this} />
    );
    wrappedAuthenticationPage.displayName = 'AuthenticationPage';
    return wrappedAuthenticationPage;
  }

  restoreUser(user: User) {
    return this.authenticate(user);
  }

  async authenticate(state: Credentials) {
    this.token = state.token as string;
    this.api = new API({
      bucket: this.bucket,
      dbCollection: this.dbCollection,
      mediaFolder: this.mediaFolder,
    });
    const user = await this.api!.user();
    const isCollab = await this.api!.hasWriteAccess();

    // Unauthorized user
    if (!isCollab) {
      throw new Error('You don\'t have write access to the CMS.');
    }

    // Authorized user
    return {
      name: user.displayName || user.email || `User ${user.uid}`,
      token: state.token as string,
    };
  }

  logout() {
    // noop
    this.token = null;
  }

  getToken() {
    return Promise.resolve(this.token);
  }

  // Fetches a single entry.
  async getEntry(path: string) {
    return this.api!.readDraft(path);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entriesByFolder(folder: string, _extension: string) {
    return this.api!.draftsByFolder(folder);
  }

  entriesByFiles(files: ImplementationFile[]) {
    return Promise.all(files.map((file) => this.api!.readDraft(file.path)));
  }

  getMediaDisplayURL(displayURL: DisplayURL) {
    console.log('getMediaDisplayURL', displayURL);
    return Promise.resolve(typeof displayURL === 'string' ? displayURL : (displayURL.path || ''));
  }

  async getMedia(mediaFolder?: string) {
    console.log('getMedia', mediaFolder);
    return this.api!.listAllMedia();
  }

  async getMediaFile(path: string) {
    console.log('getMediaFile', path);
    return this.api!.getMediaFile(path);
  }

  persistEntry(entry: Entry, mediaFiles: AssetProxy[] = [], options: PersistOptions) {
    return this.api!.persistFiles(entry, mediaFiles, options);
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    try {
      await this.api!.persistFiles(null, [mediaFile], options);
      const { sha, path, fileObj } = mediaFile as AssetProxy & { sha: string };
      const displayURL = URL.createObjectURL(fileObj);
      return {
        id: sha,
        name: fileObj!.name,
        size: fileObj!.size,
        displayURL,
        path: trimStart(path, '/'),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  deleteFile(path: string, commitMessage: string) {
    console.log('deleteFile (unbpublish draft)', path, commitMessage);
    return this.api!.unpublishDraft(path, commitMessage);
  }

  unpublishedEntries() {
    return this.api!.unpublishedDrafts();
  }

  unpublishedEntry(
    collection: string,
    slug: string,
  ) {
    return this.api!.readUnpublishedDraft(collection, slug);
  }

  async updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    await this.api!.updateUnpublishedDraftStatus(collection, slug, newStatus)
  }

  async deleteUnpublishedEntry(collection: string, slug: string) {
    await this.api!.deleteUnpublishedDraft(collection, slug);
  }

  async publishUnpublishedEntry(collection: string, slug: string) {
    await this.api!.publishUnpublishedDraft(collection, slug);
  }

  /**
   * Returns the url provided by the
   * status, as well as the status state, which should be one of 'success',
   * 'pending', and 'failure'.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getDeployPreview(_collectionName: string, _slug: string) {
    return null;
  }
}
