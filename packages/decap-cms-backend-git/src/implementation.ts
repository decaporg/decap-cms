import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';

import type {
  AssetProxy,
  Config,
  Credentials,
  Cursor,
  Entry,
  Implementation,
  ImplementationFile,
  PersistOptions,
  User,
} from 'decap-cms-lib-util';

const corsProxy = 'https://cors.isomorphic-git.org';
const dir = '/repo';
let singleton: Promise<any>;

function determineRepositoryURL(backend: any): string {
  const name = backend.name as string; // TOOD consolidate CmsConfig and Config
  if (name.startsWith('github')) {
    return `https://github.com/${backend.repo}.git`;
  } else if (name.startsWith('gitlab')) {
    return `https://gitlab.com/${backend.repo}.git`;
  } else if (name.startsWith('git-gateway')) {
    return backend.repo!;
  }
  throw new Error("Can't determine repository URL");
}

export default function GitProxyBackEndGenerator(T: any) {
  class GitProxyBackend implements Implementation {
    backend: Implementation;
    config: Config;
    fs: any;
    pfs: any;
    repositoryUrl: string;
    repository: Promise<any>;
    constructor(config: Config, options = {}) {
      this.backend = new T(config, options);
      this.config = config;
      this.fs = new FS('decapfs');
      this.pfs = this.fs.promises;
      this.repositoryUrl = determineRepositoryURL(config.backend);
      if (!singleton) {
        singleton = this.getRepository();
      }
      this.repository = singleton;
    }

    async getRepository() {
      const branch = this.config.backend.branch || 'main';
      try {
        await this.pfs.stat(dir);
      } catch (e) {
        await this.pfs.mkdir(dir);
        await git.init({
          fs: this.fs,
          dir,
          defaultBranch: branch,
        });
      }
      await git.addRemote({
        fs: this.fs,
        dir,
        url: this.repositoryUrl,
        remote: 'origin',
        force: true,
      });
      await git.fetch({
        fs: this.fs,
        http,
        dir,
        corsProxy,
        remote: 'origin',
        ref: branch,
        singleBranch: true,
        depth: 1,
      });
      await git.checkout({
        fs: this.fs,
        dir,
        ref: branch,
        force: true,
        track: false,
      });
      return this.pfs.readdir(dir);
    }

    isGitBackend() {
      return true;
    }

    async entriesByFolder(folder: string, extension: string) {
      try {
        await this.repository;
        const files = await this.pfs.readdir(`${dir}/${folder}`);
        const relevantFiles = files.filter((name: string) => name.endsWith(extension));
        return Promise.all(
          relevantFiles.map(async (filename: string) => {
            const path = `${folder}/${filename}`;
            const fullPath = `${dir}/${path}`;
            const data = await this.pfs.readFile(fullPath, 'utf8');
            return {
              data,
              file: { path, id: path },
            };
          }),
        );
      } catch {
        return [];
      }
    }
    async getEntry(path: string) {
      await this.repository;
      const data = await this.pfs.readFile(`${dir}/${path}`, 'utf8');
      return {
        file: { path, id: null },
        data,
      };
    }

    status() {
      return this.backend.status();
    }
    authComponent() {
      return this.backend.authComponent();
    }
    restoreUser(user: User) {
      return this.backend.restoreUser(user);
    }
    authenticate(credentials: Credentials) {
      return this.backend.authenticate(credentials);
    }
    logout() {
      return this.backend.logout();
    }
    getToken() {
      return this.backend.getToken();
    }
    traverseCursor(cursor: Cursor, action: string) {
      return this.backend.traverseCursor!(cursor, action);
    }
    entriesByFiles(files: ImplementationFile[]) {
      return this.backend.entriesByFiles(files);
    }
    unpublishedEntries() {
      return this.backend.unpublishedEntries();
    }
    unpublishedEntry(args: { id?: string; collection?: string; slug?: string }) {
      return this.backend.unpublishedEntry(args);
    }
    unpublishedEntryDataFile(collection: string, slug: string, path: string, id: string) {
      return this.backend.unpublishedEntryDataFile(collection, slug, path, id);
    }
    unpublishedEntryMediaFile(collection: string, slug: string, path: string, id: string) {
      return this.backend.unpublishedEntryMediaFile(collection, slug, path, id);
    }
    deleteUnpublishedEntry(collection: string, slug: string) {
      return this.backend.deleteUnpublishedEntry(collection, slug);
    }
    persistEntry(entry: Entry, opts: PersistOptions) {
      return this.backend.persistEntry(entry, opts);
    }
    updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
      return this.backend.updateUnpublishedEntryStatus(collection, slug, newStatus);
    }
    publishUnpublishedEntry(collection: string, slug: string) {
      return this.backend.publishUnpublishedEntry(collection, slug);
    }
    getMedia(folder?: string) {
      return this.backend.getMedia(folder);
    }
    getMediaFile(path: string) {
      return this.backend.getMediaFile(path);
    }
    persistMedia(file: AssetProxy, opts: PersistOptions) {
      return this.backend.persistMedia(file, opts);
    }
    deleteFiles(paths: string[], commitMessage: string) {
      return this.backend.deleteFiles(paths, commitMessage);
    }
    getDeployPreview(collectionName: string, slug: string) {
      return this.backend.getDeployPreview(collectionName, slug);
    }
  }
  return GitProxyBackend;
}
