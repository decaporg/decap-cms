import { Base64 } from 'js-base64';
import { uniq, initial, last, get, find, hasIn, partial, result } from 'lodash';
import {
  localForage,
  filterPromises,
  resolvePromiseProperties,
  APIError,
  EditorialWorkflowError,
} from 'netlify-cms-lib-util';

const CMS_BRANCH_PREFIX = 'cms/';

export default class API {
  constructor(config) {
    this.api_root = config.api_root || 'https://api.github.com';
    this.token = config.token || false;
    this.branch = config.branch || 'master';
    this.repo = config.repo || '';
    this.repoURL = `/repos/${this.repo}`;
    this.merge_method = config.squash_merges ? 'squash' : 'merge';
    this.initialWorkflowStatus = config.initialWorkflowStatus;
  }

  user() {
    return this.request('/user');
  }

  hasWriteAccess() {
    return this.request(this.repoURL)
      .then(repo => repo.permissions.push)
      .catch(error => {
        console.error('Problem fetching repo data from GitHub');
        throw error;
      });
  }

  requestHeaders(headers = {}) {
    const baseHeader = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.token) {
      baseHeader.Authorization = `token ${this.token}`;
      return baseHeader;
    }

    return baseHeader;
  }

  parseJsonResponse(response) {
    return response.json().then(json => {
      if (!response.ok) {
        return Promise.reject(json);
      }

      return json;
    });
  }

  urlFor(path, options) {
    const cacheBuster = new Date().getTime();
    const params = [`ts=${cacheBuster}`];
    if (options.params) {
      for (const key in options.params) {
        params.push(`${key}=${encodeURIComponent(options.params[key])}`);
      }
    }
    if (params.length) {
      path += `?${params.join('&')}`;
    }
    return this.api_root + path;
  }

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    let responseStatus;
    return fetch(url, { ...options, headers })
      .then(response => {
        responseStatus = response.status;
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.match(/json/)) {
          return this.parseJsonResponse(response);
        }
        const text = response.text();
        if (!response.ok) {
          return Promise.reject(text);
        }
        return text;
      })
      .catch(error => {
        throw new APIError(error.message, responseStatus, 'GitHub');
      });
  }

  generateBranchName(basename) {
    return `${CMS_BRANCH_PREFIX}${basename}`;
  }

  checkMetadataRef() {
    return this.request(`${this.repoURL}/git/refs/meta/_netlify_cms?${Date.now()}`, {
      cache: 'no-store',
    })
      .then(response => response.object)
      .catch(() => {
        // Meta ref doesn't exist
        const readme = {
          raw:
            '# Netlify CMS\n\nThis tree is used by the Netlify CMS to store metadata information for specific files and branches.',
        };

        return this.uploadBlob(readme)
          .then(item =>
            this.request(`${this.repoURL}/git/trees`, {
              method: 'POST',
              body: JSON.stringify({
                tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: item.sha }],
              }),
            }),
          )
          .then(tree => this.commit('First Commit', tree))
          .then(response => this.createRef('meta', '_netlify_cms', response.sha))
          .then(response => response.object);
      });
  }

  storeMetadata(key, data) {
    return this.checkMetadataRef().then(branchData => {
      const fileTree = {
        [`${key}.json`]: {
          path: `${key}.json`,
          raw: JSON.stringify(data),
          file: true,
        },
      };

      return this.uploadBlob(fileTree[`${key}.json`])
        .then(() => this.updateTree(branchData.sha, '/', fileTree))
        .then(changeTree => this.commit(`Updating “${key}” metadata`, changeTree))
        .then(response => this.patchRef('meta', '_netlify_cms', response.sha))
        .then(() => {
          localForage.setItem(`gh.meta.${key}`, {
            expires: Date.now() + 300000, // In 5 minutes
            data,
          });
        });
    });
  }

  retrieveMetadata(key) {
    const cache = localForage.getItem(`gh.meta.${key}`);
    return cache.then(cached => {
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }
      console.log(
        '%c Checking for MetaData files',
        'line-height: 30px;text-align: center;font-weight: bold',
      );
      return this.request(`${this.repoURL}/contents/${key}.json`, {
        params: { ref: 'refs/meta/_netlify_cms' },
        headers: { Accept: 'application/vnd.github.VERSION.raw' },
        cache: 'no-store',
      })
        .then(response => JSON.parse(response))
        .catch(() =>
          console.log(
            '%c %s does not have metadata',
            'line-height: 30px;text-align: center;font-weight: bold',
            key,
          ),
        );
    });
  }

  readFile(path, sha, branch = this.branch) {
    if (sha) {
      return this.getBlob(sha);
    } else {
      return this.request(`${this.repoURL}/contents/${path}`, {
        headers: { Accept: 'application/vnd.github.VERSION.raw' },
        params: { ref: branch },
        cache: 'no-store',
      }).catch(error => {
        if (hasIn(error, 'message.errors') && find(error.message.errors, { code: 'too_large' })) {
          const dir = path
            .split('/')
            .slice(0, -1)
            .join('/');
          return this.listFiles(dir)
            .then(files => files.find(file => file.path === path))
            .then(file => this.getBlob(file.sha));
        }
        throw error;
      });
    }
  }

  getBlob(sha) {
    return localForage.getItem(`gh.${sha}`).then(cached => {
      if (cached) {
        return cached;
      }

      return this.request(`${this.repoURL}/git/blobs/${sha}`, {
        headers: { Accept: 'application/vnd.github.VERSION.raw' },
      }).then(result => {
        localForage.setItem(`gh.${sha}`, result);
        return result;
      });
    });
  }

  listFiles(path) {
    return this.request(`${this.repoURL}/contents/${path.replace(/\/$/, '')}`, {
      params: { ref: this.branch },
    })
      .then(files => {
        if (!Array.isArray(files)) {
          throw new Error(`Cannot list files, path ${path} is not a directory but a ${files.type}`);
        }
        return files;
      })
      .then(files => files.filter(file => file.type === 'file'));
  }

  readUnpublishedBranchFile(contentKey) {
    const metaDataPromise = this.retrieveMetadata(contentKey).then(data =>
      data.objects.entry.path ? data : Promise.reject(null),
    );
    return resolvePromiseProperties({
      metaData: metaDataPromise,
      fileData: metaDataPromise.then(data =>
        this.readFile(data.objects.entry.path, null, data.branch),
      ),
      isModification: metaDataPromise.then(data =>
        this.isUnpublishedEntryModification(data.objects.entry.path, this.branch),
      ),
    }).catch(() => {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    });
  }

  isUnpublishedEntryModification(path, branch) {
    return this.readFile(path, null, branch)
      .then(() => true)
      .catch(err => {
        if (err.message && err.message === 'Not Found') {
          return false;
        }
        throw err;
      });
  }

  listUnpublishedBranches() {
    console.log(
      '%c Checking for Unpublished entries',
      'line-height: 30px;text-align: center;font-weight: bold',
    );
    return this.request(`${this.repoURL}/git/refs/heads/cms`)
      .then(branches =>
        filterPromises(branches, branch => {
          const branchName = branch.ref.substring('/refs/heads/'.length - 1);

          // Get PRs with a `head` of `branchName`. Note that this is a
          // substring match, so we need to check that the `head.ref` of
          // at least one of the returned objects matches `branchName`.
          return this.request(`${this.repoURL}/pulls`, {
            params: {
              head: branchName,
              state: 'open',
              base: this.branch,
            },
          }).then(prs => prs.some(pr => pr.head.ref === branchName));
        }),
      )
      .catch(error => {
        console.log(
          '%c No Unpublished entries',
          'line-height: 30px;text-align: center;font-weight: bold',
        );
        throw error;
      });
  }

  /**
   * Retrieve statuses for a given SHA. Unrelated to the editorial workflow
   * concept of entry "status". Useful for things like deploy preview links.
   */
  async getStatuses(sha) {
    const resp = await this.request(`${this.repoURL}/commits/${sha}/status`);
    return resp.statuses;
  }

  composeFileTree(files) {
    let filename;
    let part;
    let parts;
    let subtree;
    const fileTree = {};

    files.forEach(file => {
      if (file.uploaded) {
        return;
      }
      parts = file.path.split('/').filter(part => part);
      filename = parts.pop();
      subtree = fileTree;
      while ((part = parts.shift())) {
        // eslint-disable-line no-cond-assign
        subtree[part] = subtree[part] || {};
        subtree = subtree[part];
      }
      subtree[filename] = file;
      file.file = true;
    });

    return fileTree;
  }

  persistFiles(entry, mediaFiles, options) {
    const uploadPromises = [];
    const files = entry ? mediaFiles.concat(entry) : mediaFiles;

    files.forEach(file => {
      if (file.uploaded) {
        return;
      }
      uploadPromises.push(this.uploadBlob(file));
    });

    const fileTree = this.composeFileTree(files);

    return Promise.all(uploadPromises).then(() => {
      if (!options.useWorkflow) {
        return this.getBranch()
          .then(branchData => this.updateTree(branchData.commit.sha, '/', fileTree))
          .then(changeTree => this.commit(options.commitMessage, changeTree))
          .then(response => this.patchBranch(this.branch, response.sha));
      } else {
        const mediaFilesList = mediaFiles.map(file => ({ path: file.path, sha: file.sha }));
        return this.editorialWorkflowGit(fileTree, entry, mediaFilesList, options);
      }
    });
  }

  deleteFile(path, message, options = {}) {
    const branch = options.branch || this.branch;
    const pathArray = path.split('/');
    const filename = last(pathArray);
    const directory = initial(pathArray).join('/');
    const fileDataPath = encodeURIComponent(directory);
    const fileDataURL = `${this.repoURL}/git/trees/${branch}:${fileDataPath}`;
    const fileURL = `${this.repoURL}/contents/${path}`;

    /**
     * We need to request the tree first to get the SHA. We use extended SHA-1
     * syntax (<rev>:<path>) to get a blob from a tree without having to recurse
     * through the tree.
     */
    return this.request(fileDataURL, { cache: 'no-store' }).then(resp => {
      const { sha } = resp.tree.find(file => file.path === filename);
      const opts = { method: 'DELETE', params: { sha, message, branch } };
      if (this.commitAuthor) {
        opts.params.author = {
          ...this.commitAuthor,
          date: new Date().toISOString(),
        };
      }
      return this.request(fileURL, opts);
    });
  }

  editorialWorkflowGit(fileTree, entry, filesList, options) {
    const contentKey = entry.slug;
    const branchName = this.generateBranchName(contentKey);
    const unpublished = options.unpublished || false;
    if (!unpublished) {
      // Open new editorial review workflow for this entry - Create new metadata and commit to new branch`
      let prResponse;

      return this.getBranch()
        .then(branchData => this.updateTree(branchData.commit.sha, '/', fileTree))
        .then(changeTree => this.commit(options.commitMessage, changeTree))
        .then(commitResponse => this.createBranch(branchName, commitResponse.sha))
        .then(() => this.createPR(options.commitMessage, branchName))
        .then(pr => {
          prResponse = pr;
          return this.user();
        })
        .then(user => {
          return this.storeMetadata(contentKey, {
            type: 'PR',
            pr: {
              number: prResponse.number,
              head: prResponse.head && prResponse.head.sha,
            },
            user: user.name || user.login,
            status: this.initialWorkflowStatus,
            branch: branchName,
            collection: options.collectionName,
            title: options.parsedData && options.parsedData.title,
            description: options.parsedData && options.parsedData.description,
            objects: {
              entry: {
                path: entry.path,
                sha: entry.sha,
              },
              files: filesList,
            },
            timeStamp: new Date().toISOString(),
          });
        });
    } else {
      // Entry is already on editorial review workflow - just update metadata and commit to existing branch
      let newHead;
      return this.getBranch(branchName)
        .then(branchData => this.updateTree(branchData.commit.sha, '/', fileTree))
        .then(changeTree => this.commit(options.commitMessage, changeTree))
        .then(commit => {
          newHead = commit;
          return this.retrieveMetadata(contentKey);
        })
        .then(metadata => {
          const { title, description } = options.parsedData || {};
          const metadataFiles = get(metadata.objects, 'files', []);
          const files = [...metadataFiles, ...filesList];
          const pr = { ...metadata.pr, head: newHead.sha };
          const objects = {
            entry: { path: entry.path, sha: entry.sha },
            files: uniq(files),
          };
          const updatedMetadata = { ...metadata, pr, title, description, objects };

          /**
           * If an asset store is in use, assets are always accessible, so we
           * can just finish the persist operation here.
           */
          if (options.hasAssetStore) {
            return this.storeMetadata(contentKey, updatedMetadata).then(() =>
              this.patchBranch(branchName, newHead.sha),
            );
          }

          /**
           * If no asset store is in use, assets are being stored in the content
           * repo, which means pull requests opened for editorial workflow
           * entries must be rebased if assets have been added or removed.
           */
          return this.rebasePullRequest(pr.number, branchName, contentKey, metadata, newHead);
        });
    }
  }

  /**
   * Rebase a pull request onto the latest HEAD of it's target base branch
   * (should generally be the configured backend branch). Only rebases changes
   * in the entry file.
   */
  async rebasePullRequest(prNumber, branchName, contentKey, metadata, head) {
    const { path } = metadata.objects.entry;

    try {
      /**
       * Get the published branch and create new commits over it. If the pull
       * request is up to date, no rebase will occur.
       */
      const baseBranch = await this.getBranch();
      const commits = await this.getPullRequestCommits(prNumber, head);

      /**
       * Sometimes the list of commits for a pull request isn't updated
       * immediately after the PR branch is patched. There's also the possibility
       * that the branch has changed unexpectedly. We account for both by adding
       * the head if it's missing, or else throwing an error if the PR head is
       * neither the head we expect nor its parent.
       */
      const finalCommits = this.assertHead(commits, head);
      const rebasedHead = await this.rebaseSingleBlobCommits(baseBranch.commit, finalCommits, path);

      /**
       * Update metadata, then force update the pull request branch head.
       */
      const pr = { ...metadata.pr, head: rebasedHead.sha };
      const timeStamp = new Date().toISOString();
      const updatedMetadata = { ...metadata, pr, timeStamp };
      await this.storeMetadata(contentKey, updatedMetadata);
      return this.patchBranch(branchName, rebasedHead.sha, { force: true });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Rebase an array of commits one-by-one, starting from a given base SHA. Can
   * accept an array of commits as received from the GitHub API. All commits are
   * expected to change the same, single blob.
   */
  rebaseSingleBlobCommits(baseCommit, commits, pathToBlob) {
    /**
     * If the parent of the first commit already matches the target base,
     * return commits as is.
     */
    if (commits.length === 0 || commits[0].parents[0].sha === baseCommit.sha) {
      return Promise.resolve(last(commits));
    }

    /**
     * Re-create each commit over the new base, applying each to the previous,
     * changing only the parent SHA and tree for each, but retaining all other
     * info, such as the author/committer data.
     */
    const newHeadPromise = commits.reduce((lastCommitPromise, commit) => {
      return lastCommitPromise.then(newParent => {
        /**
         * Normalize commit data to ensure it's not nested in `commit.commit`.
         */
        const parent = this.normalizeCommit(newParent);
        const commitToRebase = this.normalizeCommit(commit);

        return this.rebaseSingleBlobCommit(parent, commitToRebase, pathToBlob);
      });
    }, Promise.resolve(baseCommit));

    /**
     * Return a promise that resolves when all commits have been created.
     */
    return newHeadPromise;
  }

  /**
   * Rebase a commit that changes a single blob. Also handles updating the tree.
   */
  rebaseSingleBlobCommit(baseCommit, commit, pathToBlob) {
    /**
     * Retain original commit metadata.
     */
    const { message, author, committer } = commit;

    /**
     * Set the base commit as the parent.
     */
    const parent = [baseCommit.sha];

    /**
     * Get the blob data by path.
     */
    return (
      this.getBlobInTree(commit.tree.sha, pathToBlob)

        /**
         * Create a new tree consisting of the base tree and the single updated
         * blob. Use the full path to indicate nesting, GitHub will take care of
         * subtree creation.
         */
        .then(blob => this.createTree(baseCommit.tree.sha, [{ ...blob, path: pathToBlob }]))

        /**
         * Create a new commit with the updated tree and original commit metadata.
         */
        .then(tree => this.createCommit(message, tree.sha, parent, author, committer))
    );
  }

  /**
   * Get a pull request by PR number.
   */
  getPullRequest(prNumber) {
    return this.request(`${this.repoURL}/pulls/${prNumber} }`);
  }

  /**
   * Get the list of commits for a given pull request.
   */
  getPullRequestCommits(prNumber) {
    return this.request(`${this.repoURL}/pulls/${prNumber}/commits`);
  }

  /**
   * Returns `commits` with `headToAssert` appended if it's the child of the
   * last commit in `commits`. Returns `commits` unaltered if `headToAssert` is
   * already the last commit in `commits`. Otherwise throws an error.
   */
  assertHead(commits, headToAssert) {
    const headIsMissing = headToAssert.parents[0].sha === last(commits).sha;
    const headIsNotMissing = headToAssert.sha === last(commits).sha;

    if (headIsMissing) {
      return commits.concat(headToAssert);
    } else if (headIsNotMissing) {
      return commits;
    }

    throw Error('Editorial workflow branch changed unexpectedly.');
  }

  updateUnpublishedEntryStatus(collection, slug, status) {
    const contentKey = slug;
    return this.retrieveMetadata(contentKey)
      .then(metadata => ({
        ...metadata,
        status,
      }))
      .then(updatedMetadata => this.storeMetadata(contentKey, updatedMetadata));
  }

  deleteUnpublishedEntry(collection, slug) {
    const contentKey = slug;
    const branchName = this.generateBranchName(contentKey);
    return (
      this.retrieveMetadata(contentKey)
        .then(metadata => this.closePR(metadata.pr))
        .then(() => this.deleteBranch(branchName))
        // If the PR doesn't exist, then this has already been deleted -
        // deletion should be idempotent, so we can consider this a
        // success.
        .catch(err => {
          if (err.message === 'Reference does not exist') {
            return Promise.resolve();
          }
          return Promise.reject(err);
        })
    );
  }

  publishUnpublishedEntry(collection, slug) {
    const contentKey = slug;
    const branchName = this.generateBranchName(contentKey);
    return this.retrieveMetadata(contentKey)
      .then(metadata => this.mergePR(metadata.pr, metadata.objects))
      .then(() => this.deleteBranch(branchName));
  }

  createRef(type, name, sha) {
    return this.request(`${this.repoURL}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/${type}/${name}`, sha }),
    });
  }

  patchRef(type, name, sha, opts = {}) {
    const force = opts.force || false;
    return this.request(`${this.repoURL}/git/refs/${type}/${encodeURIComponent(name)}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha, force }),
    });
  }

  deleteRef(type, name) {
    return this.request(`${this.repoURL}/git/refs/${type}/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  getBranch(branch = this.branch) {
    return this.request(`${this.repoURL}/branches/${encodeURIComponent(branch)}`);
  }

  createBranch(branchName, sha) {
    return this.createRef('heads', branchName, sha);
  }

  assertCmsBranch(branchName) {
    return branchName.startsWith(CMS_BRANCH_PREFIX);
  }

  patchBranch(branchName, sha, opts = {}) {
    const force = opts.force || false;
    if (force && !this.assertCmsBranch(branchName)) {
      throw Error(`Only CMS branches can be force updated, cannot force update ${branchName}`);
    }
    return this.patchRef('heads', branchName, sha, { force });
  }

  deleteBranch(branchName) {
    return this.deleteRef('heads', branchName);
  }

  createPR(title, head, base = this.branch) {
    const body = 'Automatically generated by Netlify CMS';
    return this.request(`${this.repoURL}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title, body, head, base }),
    });
  }

  closePR(pullrequest) {
    const prNumber = pullrequest.number;
    console.log('%c Deleting PR', 'line-height: 30px;text-align: center;font-weight: bold');
    return this.request(`${this.repoURL}/pulls/${prNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({
        state: closed,
      }),
    });
  }

  mergePR(pullrequest, objects) {
    const headSha = pullrequest.head;
    const prNumber = pullrequest.number;
    console.log('%c Merging PR', 'line-height: 30px;text-align: center;font-weight: bold');
    return this.request(`${this.repoURL}/pulls/${prNumber}/merge`, {
      method: 'PUT',
      body: JSON.stringify({
        commit_message: 'Automatically generated. Merged on Netlify CMS.',
        sha: headSha,
        merge_method: this.merge_method,
      }),
    }).catch(error => {
      if (error instanceof APIError && error.status === 405) {
        return this.forceMergePR(pullrequest, objects);
      } else {
        throw error;
      }
    });
  }

  forceMergePR(pullrequest, objects) {
    const files = objects.files.concat(objects.entry);
    const fileTree = this.composeFileTree(files);
    let commitMessage = 'Automatically generated. Merged on Netlify CMS\n\nForce merge of:';
    files.forEach(file => {
      commitMessage += `\n* "${file.path}"`;
    });
    console.log(
      '%c Automatic merge not possible - Forcing merge.',
      'line-height: 30px;text-align: center;font-weight: bold',
    );
    return this.getBranch()
      .then(branchData => this.updateTree(branchData.commit.sha, '/', fileTree))
      .then(changeTree => this.commit(commitMessage, changeTree))
      .then(response => this.patchBranch(this.branch, response.sha));
  }

  getTree(sha) {
    if (sha) {
      return this.request(`${this.repoURL}/git/trees/${sha}`);
    }
    return Promise.resolve({ tree: [] });
  }

  /**
   * Get a blob from a tree. Requests individual subtrees recursively if blob is
   * nested within one or more directories.
   */
  getBlobInTree(treeSha, pathToBlob) {
    const pathSegments = pathToBlob.split('/').filter(val => val);
    const directories = pathSegments.slice(0, -1);
    const filename = pathSegments.slice(-1)[0];
    const baseTree = this.getTree(treeSha);
    const subTreePromise = directories.reduce((treePromise, segment) => {
      return treePromise.then(tree => {
        const subTreeSha = find(tree.tree, { path: segment }).sha;
        return this.getTree(subTreeSha);
      });
    }, baseTree);
    return subTreePromise.then(subTree => find(subTree.tree, { path: filename }));
  }

  toBase64(str) {
    return Promise.resolve(Base64.encode(str));
  }

  uploadBlob(item) {
    const content = result(item, 'toBase64', partial(this.toBase64, item.raw));

    return content.then(contentBase64 =>
      this.request(`${this.repoURL}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: contentBase64,
          encoding: 'base64',
        }),
      }).then(response => {
        item.sha = response.sha;
        item.uploaded = true;
        return item;
      }),
    );
  }

  updateTree(sha, path, fileTree) {
    return this.getTree(sha).then(tree => {
      let obj;
      let filename;
      let fileOrDir;
      const updates = [];
      const added = {};

      for (let i = 0, len = tree.tree.length; i < len; i++) {
        obj = tree.tree[i];
        if ((fileOrDir = fileTree[obj.path])) {
          // eslint-disable-line no-cond-assign
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
        if (added[filename]) {
          continue;
        }
        updates.push(
          fileOrDir.file
            ? { path: filename, mode: '100644', type: 'blob', sha: fileOrDir.sha }
            : this.updateTree(null, filename, fileOrDir),
        );
      }
      return Promise.all(updates)
        .then(tree => this.createTree(sha, tree))
        .then(response => ({
          path,
          mode: '040000',
          type: 'tree',
          sha: response.sha,
          parentSha: sha,
        }));
    });
  }

  createTree(baseSha, tree) {
    return this.request(`${this.repoURL}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseSha, tree }),
    });
  }

  /**
   * Some GitHub API calls return commit data in a nested `commit` property,
   * with the SHA outside of the nested property, while others return a
   * flatter object with no nested `commit` property. This normalizes a commit
   * to resemble the latter.
   */
  normalizeCommit(commit) {
    if (commit.commit) {
      return { ...commit.commit, sha: commit.sha };
    }
    return commit;
  }

  commit(message, changeTree) {
    const parents = changeTree.parentSha ? [changeTree.parentSha] : [];
    return this.createCommit(message, changeTree.sha, parents);
  }

  createCommit(message, treeSha, parents, author, committer) {
    return this.request(`${this.repoURL}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message, tree: treeSha, parents, author, committer }),
    });
  }
}
