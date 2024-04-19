import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';

import type { Implementation, Config } from 'decap-cms-lib-util';

const corsProxy = 'https://cors.isomorphic-git.org';
const dir = '/repo';
let singleton;

export default function GitProxyBackEndGenerator(T) {
  class GitProxyBackend implements Implementation {
    backend: Implementation;
    config: Config;
    constructor(config: Config, options = {}) {
      this.backend = new T(config, options);
      this.config = config;
      this.fs = new FS('decapfs');
      this.pfs = this.fs.promises;
      if (!singleton) {
        singleton = this.getRepository();
      }
      this.repository = singleton;
    }

    async getRepository() {
      try {
        await this.pfs.stat(dir);
      } catch (e) {
        await this.pfs.mkdir(dir);
        await git.init({
          fs: this.fs,
          dir,
          defaultBranch: 'main',
        });
      }
      const fetchResult = await git.fetch({
        fs: this.fs,
        http,
        dir,
        corsProxy,
        url: 'https://github.com/betagouv/aides-jeunes',
        ref: 'main',
        singleBranch: true,
        depth: 1,
      });
      await git.checkout({
        fs: this.fs,
        http,
        dir,
        ref: fetchResult.fetchHead,
        force: true,
        track: false,
      });
      return this.pfs.readdir(dir);
    }

    isGitBackend() {
      return true;
    }

    async entriesByFolder(folder: string, extension: string, depth: number) {
      try {
        const files = await this.pfs.readdir(`${dir}/${folder}`);
        const relevantFiles = files.filter(name => name.endsWith(extension));
        return Promise.all(
          relevantFiles.map(async filename => {
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
      const data = await this.pfs.readFile(`${dir}/${path}`, 'utf8');
      return {
        file: { path, id: null },
        data,
      };
    }

    status(...args) {
      return this.backend.status(...args);
    }
    authComponent(...args) {
      return this.backend.authComponent(...args);
    }
    restoreUser(...args) {
      return this.backend.restoreUser(...args);
    }
    authenticate(...args) {
      return this.backend.authenticate(...args);
    }
    logout() {
      return this.backend.logout(...args);
    }
    getToken(...args) {
      return this.backend.getToken(...args);
    }
    traverseCursor(...args) {
      return this.backend.traverseCursor(...args);
    }
    entriesByFiles(...args) {
      return this.backend.entriesByFiles(...args);
    }
    unpublishedEntries(...args) {
      return this.backend.unpublishedEntries(...args);
    }
    unpublishedEntry(...args) {
      return this.backend.unpublishedEntry(...args);
    }
    unpublishedEntryDataFile(...args) {
      return this.backend.unpublishedEntryDataFile(...args);
    }
    unpublishedEntryMediaFile(...args) {
      return this.backend.unpublishedEntryMediaFile(...args);
    }
    deleteUnpublishedEntry(collection: string, slug: string) {
      return this.backend.deleteUnpublishedEntry(collection, slug);
    }
    addOrUpdateUnpublishedEntry(...args) {
      return this.backend.addOrUpdateUnpublishedEntry(...args);
    }
    persistEntry(...args) {
      return this.backend.persistEntry(...args);
    }
    updateUnpublishedEntryStatus(...args) {
      return this.backend.updateUnpublishedEntryStatus(...args);
    }
    publishUnpublishedEntry(...args) {
      return this.backend.publishUnpublishedEntry(...args);
    }
    getMedia(...args) {
      return this.backend.getMedia(...args);
    }
    getMediaFile(...args) {
      return this.backend.getMediaFile(...args);
    }
    normalizeAsset(...args) {
      return this.backend.normalizeAsset(...args);
    }
    persistMedia(...args) {
      return this.backend.persistMedia(...args);
    }
    deleteFiles(...args) {
      return this.backend.deleteFiles(...args);
    }
    getDeployPreview(...args) {
      return this.backend.getDeployPreview(...args);
    }
  }
  return GitProxyBackend;
}
