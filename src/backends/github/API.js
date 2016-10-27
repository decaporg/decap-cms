import LocalForage from 'localforage';
import MediaProxy from '../../valueObjects/MediaProxy';
import { Base64 } from 'js-base64';
import _ from 'lodash';
import { SIMPLE, EDITORIAL_WORKFLOW, status } from '../../constants/publishModes';

const API_ROOT = 'https://api.github.com';

export default class API {
  constructor(token, repo, branch) {
    this.token = token;
    this.repo = repo;
    this.branch = branch;
    this.repoURL = `/repos/${ this.repo }`;
  }

  user() {
    return this.request('/user');
  }

  requestHeaders(headers = {}) {
    return {
      Authorization: `token ${ this.token }`,
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  parseJsonResponse(response) {
    return response.json().then((json) => {
      if (!response.ok) {
        return Promise.reject(json);
      }

      return json;
    });
  }

  urlFor(path, options) {
    const params = [];
    if (options.params) {
      for (const key in options.params) {
        params.push(`${ key }=${ encodeURIComponent(options.params[key]) }`);
      }
    }
    if (params.length) {
      path += `?${ params.join('&') }`;
    }
    return API_ROOT + path;
  }

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    return fetch(url, { ...options, headers }).then((response) => {
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }

      return response.text();
    });
  }

  checkMetadataRef() {
    return this.request(`${ this.repoURL }/git/refs/meta/_netlify_cms?${ Date.now() }`, {
      cache: 'no-store',
    })
    .then(response => response.object)
    .catch((error) => {
      // Meta ref doesn't exist
      const readme = {
        raw: '# Netlify CMS\n\nThis tree is used by the Netlify CMS to store metadata information for specific files and branches.',
      };

      return this.uploadBlob(readme)
      .then(item => this.request(`${ this.repoURL }/git/trees`, {
        method: 'POST',
        body: JSON.stringify({ tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: item.sha }] }),
      }))
      .then(tree => this.commit('First Commit', tree))
      .then(response => this.createRef('meta', '_netlify_cms', response.sha))
      .then(response => response.object);
    });
  }

  storeMetadata(key, data) {
    return this.checkMetadataRef()
    .then((branchData) => {
      const fileTree = {
        [`${ key }.json`]: {
          path: `${ key }.json`,
          raw: JSON.stringify(data),
          file: true,
        },
      };

      return this.uploadBlob(fileTree[`${ key }.json`])
      .then(item => this.updateTree(branchData.sha, '/', fileTree))
      .then(changeTree => this.commit(`Updating “${ key }” metadata`, changeTree))
      .then(response => this.patchRef('meta', '_netlify_cms', response.sha))
      .then(() => {
        LocalForage.setItem(`gh.meta.${ key }`, {
          expires: Date.now() + 300000, // In 5 minutes
          data,
        });
      });
    });
  }

  retrieveMetadata(key) {
    const cache = LocalForage.getItem(`gh.meta.${ key }`);
    return cache.then((cached) => {
      if (cached && cached.expires > Date.now()) { return cached.data; }
      console.log("%c Checking for MetaData files", "line-height: 30px;text-align: center;font-weight: bold"); // eslint-disable-line
      return this.request(`${ this.repoURL }/contents/${ key }.json`, {
        params: { ref: 'refs/meta/_netlify_cms' },
        headers: { Accept: 'application/vnd.github.VERSION.raw' },
        cache: 'no-store',
      })
      .then(response => JSON.parse(response))
      .catch(error => console.log("%c %s does not have metadata", "line-height: 30px;text-align: center;font-weight: bold", key)); // eslint-disable-line
    });
  }

  readFile(path, sha, branch = this.branch) {
    const cache = sha ? LocalForage.getItem(`gh.${ sha }`) : Promise.resolve(null);
    return cache.then((cached) => {
      if (cached) { return cached; }

      return this.request(`${ this.repoURL }/contents/${ path }`, {
        headers: { Accept: 'application/vnd.github.VERSION.raw' },
        params: { ref: branch },
        cache: false,
      }).then((result) => {
        if (sha) {
          LocalForage.setItem(`gh.${ sha }`, result);
        }
        return result;
      });
    });
  }

  listFiles(path) {
    return this.request(`${ this.repoURL }/contents/${ path }`, {
      params: { ref: this.branch },
    });
  }

  readUnpublishedBranchFile(contentKey) {
    let metaData;
    const unpublishedPromise = this.retrieveMetadata(contentKey)
    .then((data) => {
      metaData = data;
      return this.readFile(data.objects.entry, null, data.branch);
    })
    .then(fileData => ({ metaData, fileData }))
    .catch((error) => {
      return null;
    });
    return unpublishedPromise;
  }

  listUnpublishedBranches() {
    return this.request(`${ this.repoURL }/git/refs/heads/cms`);
  }

  persistFiles(entry, mediaFiles, options) {
    let filename,
      part,
      parts,
      subtree;
    const fileTree = {};
    const uploadPromises = [];

    const files = mediaFiles.concat(entry);

    files.forEach((file) => {
      if (file.uploaded) { return; }
      uploadPromises.push(this.uploadBlob(file));
      parts = file.path.split('/').filter(part => part);
      filename = parts.pop();
      subtree = fileTree;
      while (part = parts.shift()) {
        subtree[part] = subtree[part] || {};
        subtree = subtree[part];
      }
      subtree[filename] = file;
      file.file = true;
    });
    return Promise.all(uploadPromises).then(() => {
      if (!options.mode || (options.mode && options.mode === SIMPLE)) {
        return this.getBranch()
        .then(branchData => this.updateTree(branchData.commit.sha, '/', fileTree))
        .then(changeTree => this.commit(options.commitMessage, changeTree))
        .then(response => this.patchBranch(this.branch, response.sha));
      } else if (options.mode && options.mode === EDITORIAL_WORKFLOW) {
        const mediaFilesList = mediaFiles.map(file => file.path);
        return this.editorialWorkflowGit(fileTree, entry, mediaFilesList, options);
      }
    });
  }

  editorialWorkflowGit(fileTree, entry, filesList, options) {
    const contentKey = entry.slug;
    const branchName = `cms/${ contentKey }`;
    const unpublished = options.unpublished || false;

    if (!unpublished) {
      // Open new editorial review workflow for this entry - Create new metadata and commit to new branch
      const contentKey = entry.slug;
      const branchName = `cms/${ contentKey }`;

      return this.getBranch()
      .then(branchData => this.updateTree(branchData.commit.sha, '/', fileTree))
      .then(changeTree => this.commit(options.commitMessage, changeTree))
      .then(commitResponse => this.createBranch(branchName, commitResponse.sha))
      .then(branchResponse => this.createPR(options.commitMessage, branchName))
      .then((prResponse) => {
        return this.user().then((user) => {
          return user.name ? user.name : user.login;
        })
        .then(username => this.storeMetadata(contentKey, {
          type: 'PR',
          pr: {
            number: prResponse.number,
            head: prResponse.head && prResponse.head.sha,
          },
          user: username,
          status: status.first(),
          branch: branchName,
          collection: options.collectionName,
          title: options.parsedData && options.parsedData.title,
          description: options.parsedData && options.parsedData.description,
          objects: {
            entry: entry.path,
            files: filesList,
          },
          timeStamp: new Date().toISOString(),
        }));
      });
    } else {
      // Entry is already on editorial review workflow - just update metadata and commit to existing branch
      return this.getBranch(branchName)
      .then(branchData => this.updateTree(branchData.commit.sha, '/', fileTree))
      .then(changeTree => this.commit(options.commitMessage, changeTree))
      .then((response) => {
        const contentKey = entry.slug;
        const branchName = `cms/${ contentKey }`;
        return this.user().then((user) => {
          return user.name ? user.name : user.login;
        })
        .then(username => this.retrieveMetadata(contentKey))
        .then((metadata) => {
          let files = metadata.objects && metadata.objects.files || [];
          files = files.concat(filesList);

          return {
            ...metadata,
            title: options.parsedData && options.parsedData.title,
            description: options.parsedData && options.parsedData.description,
            objects: {
              entry: entry.path,
              files: _.uniq(files),
            },
            timeStamp: new Date().toISOString(),
          };
        })
        .then(updatedMetadata => this.storeMetadata(contentKey, updatedMetadata))
        .then(this.patchBranch(branchName, response.sha));
      });
    }
  }

  updateUnpublishedEntryStatus(collection, slug, status) {
    const contentKey = slug;
    return this.retrieveMetadata(contentKey)
    .then((metadata) => {
      return {
        ...metadata,
        status,
      };
    })
    .then(updatedMetadata => this.storeMetadata(contentKey, updatedMetadata));
  }

  publishUnpublishedEntry(collection, slug, status) {
    const contentKey = slug;
    return this.retrieveMetadata(contentKey)
    .then((metadata) => {
      const headSha = metadata.pr && metadata.pr.head;
      const number = metadata.pr && metadata.pr.number;
      return this.mergePR(headSha, number);
    })
    .then(() => this.deleteBranch(`cms/${ contentKey }`));
  }

  createRef(type, name, sha) {
    return this.request(`${ this.repoURL }/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/${ type }/${ name }`, sha }),
    });
  }

  patchRef(type, name, sha) {
    return this.request(`${ this.repoURL }/git/refs/${ type }/${ name }`, {
      method: 'PATCH',
      body: JSON.stringify({ sha }),
    });
  }

  deleteRef(type, name, sha) {
    return this.request(`${ this.repoURL }/git/refs/${ type }/${ name }`, {
      method: 'DELETE',
    });
  }

  getBranch(branch = this.branch) {
    return this.request(`${ this.repoURL }/branches/${ branch }`);
  }

  createBranch(branchName, sha) {
    return this.createRef('heads', branchName, sha);
  }

  patchBranch(branchName, sha) {
    return this.patchRef('heads', branchName, sha);
  }

  deleteBranch(branchName) {
    return this.deleteRef('heads', branchName);
  }

  createPR(title, head, base = 'master') {
    const body = 'Automatically generated by Netlify CMS';
    return this.request(`${ this.repoURL }/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title, body, head, base }),
    });
  }

  mergePR(headSha, number) {
    return this.request(`${ this.repoURL }/pulls/${ number }/merge`, {
      method: 'PUT',
      body: JSON.stringify({
        commit_message: 'Automatically generated. Merged on Netlify CMS.',
        sha: headSha,
      }),
    });
  }

  getTree(sha) {
    return sha ? this.request(`${ this.repoURL }/git/trees/${ sha }`) : Promise.resolve({ tree: [] });
  }

  toBase64(str) {
    return Promise.resolve(
      Base64.encode(str)
    );
  }

  uploadBlob(item) {
    const content = item instanceof MediaProxy ? item.toBase64() : this.toBase64(item.raw);

    return content.then((contentBase64) => {
      return this.request(`${ this.repoURL }/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: contentBase64,
          encoding: 'base64',
        }),
      }).then((response) => {
        item.sha = response.sha;
        item.uploaded = true;
        return item;
      });
    });
  }

  updateTree(sha, path, fileTree) {
    return this.getTree(sha)
      .then((tree) => {
        let obj,
          filename,
          fileOrDir;
        const updates = [];
        const added = {};

        for (let i = 0, len = tree.tree.length; i < len; i++) {
          obj = tree.tree[i];
          if (fileOrDir = fileTree[obj.path]) {
            added[obj.path] = true;
            if (fileOrDir.file) {
              updates.push({ path: obj.path, mode: obj.mode, type: obj.type, sha: fileOrDir.sha });
            } else {
              updates.push(this.updateTree(obj.sha, obj.path, fileOrDir));
            }
          }
        }
        for (filename in fileTree) {
          fileOrDir = fileTree[filename];
          if (added[filename]) { continue; }
          updates.push(
            fileOrDir.file ?
              { path: filename, mode: '100644', type: 'blob', sha: fileOrDir.sha } :
              this.updateTree(null, filename, fileOrDir)
          );
        }
        return Promise.all(updates)
          .then((updates) => {
            return this.request(`${ this.repoURL }/git/trees`, {
              method: 'POST',
              body: JSON.stringify({ base_tree: sha, tree: updates }),
            });
          }).then((response) => {
            return { path, mode: '040000', type: 'tree', sha: response.sha, parentSha: sha };
          });
      });
  }

  commit(message, changeTree) {
    const tree = changeTree.sha;
    const parents = changeTree.parentSha ? [changeTree.parentSha] : [];
    return this.request(`${ this.repoURL }/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message, tree, parents }),
    });
  }

}
