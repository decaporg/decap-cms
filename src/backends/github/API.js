import LocalForage from "localforage";
import { Base64 } from "js-base64";
import { entries, isString, partition, pick, uniq, zipObject } from "lodash";
import { Map } from 'immutable';
import { filterPromises, resolvePromiseProperties } from "../../lib/promiseHelper";
import AssetProxy from "../../valueObjects/AssetProxy";
import { EDITORIAL_WORKFLOW, status } from "../../constants/publishModes";
import { APIError, EditorialWorkflowError } from "../../valueObjects/errors";

export default class API {
  constructor(config) {
    this.api_root = config.api_root || "https://api.github.com";
    this.token = config.token || false;
    this.branch = config.branch || "master";
    this.repo = config.repo || "";
    this.repoURL = `/repos/${ this.repo }`;
  }

  user() {
    return this.request("/user");
  }

  isCollaborator(user) {
    return this.request('/user/repos').then(repos =>
      Object.keys(repos).some(
        key => (repos[key].full_name === this.repo) && repos[key].permissions.push
      )
    );
  }

  requestHeaders(headers = {}) {
    return {
      ...headers,
      ...(this.token ? { Authorization: `token ${ this.token }` } : {}),
      "Content-Type": "application/json",
    };
  }

  urlFor(path, options) {
    const cacheBuster = `ts=${ new Date().getTime() }`;
    const encodedParams = options.params
          ? Object.entries(options.params).map(
            ([key, val]) => `${ key }=${ encodeURIComponent(val) }`)
          : [];
    return `${ this.api_root }${ path }?${ [cacheBuster, ...encodedParams].join("&") }`;
  }

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    return fetch(url, { ...options, headers })
    .then((response) => {
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.match(/json/)) {
        return Promise.all([response, response.json()]);
      }
      return Promise.all([response, response.text()]);
    })
    .catch(err => [err, null])
    .then(([response, value]) => (response.ok ? value : Promise.reject([value, response])))
    .catch(([errorValue, response]) => {
      const errorMessageProp = (errorValue && errorValue.message) ? errorValue.message : null;
      const message = errorMessageProp || (isString(errorValue) ? errorValue : "");
      throw new APIError(message, response && response.status, 'GitHub', { response, errorValue });
    });
  }

  checkMetadataRef() {
    return this.request(`${ this.repoURL }/git/refs/meta/_netlify_cms?${ Date.now() }`, {
      cache: "no-store",
    })
    .then(response => response.object)
    .catch((error) => {
      // Meta ref doesn't exist
      const readme = {
        raw: `\
# Netlify CMS

This tree is used by the Netlify CMS to store metadata information for specific files and branches.`,
      };

      return this.uploadBlob(readme)
      .then(item => this.request(`${ this.repoURL }/git/trees`, {
        method: "POST",
        body: JSON.stringify({ tree: [{ path: "README.md", mode: "100644", type: "blob", sha: item.sha }] }),
      }))
      .then(tree => this.commit("First Commit", tree))
      .then(response => this.createRef("meta", "_netlify_cms", response.sha))
      .then(response => response.object);
    });
  }

  storeMetadata(key, data) {
    return this.checkMetadataRef()
    .then((branchData) => {
      const fileName = `${ key }.json`;
      const file = {
        path: fileName,
        raw: JSON.stringify(data),
        file: true,
      };
      return this.uploadBlob(file)
      .then(uploadedFile => this.updateTree(branchData.sha, "/", { [fileName]: uploadedFile }))
      .then(changeTree => this.commit(`Updating “${ key }” metadata`, changeTree))
      .then(response => this.patchRef("meta", "_netlify_cms", response.sha))
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
        params: { ref: "refs/meta/_netlify_cms" },
        headers: { Accept: "application/vnd.github.VERSION.raw" },
        cache: "no-store",
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
        headers: { Accept: "application/vnd.github.VERSION.raw" },
        params: { ref: branch },
        cache: "no-store",
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
    })
    .then((files) => {
      if (!Array.isArray(files)) {
        throw new Error(`Cannot list files, path ${ path } is not a directory but a ${ files.type }`);
      }
      return files;
    })
    .then(files => files.filter(file => file.type === "file"));
  }

  readUnpublishedBranchFile(contentKey) {
    const metaDataPromise = this.retrieveMetadata(contentKey)
      .then(data => (data.objects.entry.path ? data : Promise.reject(null)));
    return resolvePromiseProperties({
      metaData: metaDataPromise,
      fileData: metaDataPromise.then(
        data => this.readFile(data.objects.entry.path, null, data.branch)),
      isModification: metaDataPromise.then(
        data => this.isUnpublishedEntryModification(data.objects.entry.path, this.branch)),
    })
    .catch(() => {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    });
  }

  isUnpublishedEntryModification(path, branch) {
    return this.readFile(path, null, branch)
    .then(() => true)
    .catch((err) => {
      if (err.message && err.message === "Not Found") {
        return false;
      }
      throw err;
    });
  }

  listUnpublishedBranches() {
    console.log("%c Checking for Unpublished entries", "line-height: 30px;text-align: center;font-weight: bold"); // eslint-disable-line
    return this.request(`${ this.repoURL }/git/refs/heads/cms`)
    .then(branches => filterPromises(branches, (branch) => {
      const branchName = branch.ref.substring("/refs/heads/".length - 1);

      // Get PRs with a `head` of `branchName`. Note that this is a
      // substring match, so we need to check that the `head.ref` of
      // at least one of the returned objects matches `branchName`.
      return this.request(`${ this.repoURL }/pulls`, {
        params: {
          head: branchName,
          state: 'open',
        },
      })
        .then(prs => prs.some(pr => pr.head.ref === branchName));
    }))
    .catch((error) => {
      console.log("%c No Unpublished entries", "line-height: 30px;text-align: center;font-weight: bold"); // eslint-disable-line
      throw error;
    });
  }

  composeFileTree(files) {
    return files
      .map(file => ({ ...file, file: true }))
      .reduce((tree, file) => tree.setIn(file.path.split("/"), file), Map())
      .toJS();
  }

  persistFiles(entry, mediaFiles, options) {
    const newFiles = [...mediaFiles, entry].filter(file => !file.uploaded);
    const uploadsPromise = Promise.all(newFiles.map(file => this.uploadBlob(file)));
    const fileTreePromise = uploadsPromise.then(files => this.composeFileTree(files));

    if (options.mode === EDITORIAL_WORKFLOW) {
      const mediaFilesList = mediaFiles.map(file => ({ path: file.path, sha: file.sha }));
      return fileTreePromise
        .then(fileTree => this.editorialWorkflowGit(fileTree, entry, mediaFilesList, options));
    }

    return Promise.all([fileTreePromise, this.getBranch()])
      .then(([fileTree, branchData]) => this.updateTree(branchData.commit.sha, "/", fileTree))
      .then(changeTree => this.commit(options.commitMessage, changeTree))
      .then(response => this.patchBranch(this.branch, response.sha));
  }

  deleteFile(path, message, options={}) {
    const branch = options.branch || this.branch;
    const fileURL = `${ this.repoURL }/contents/${ path }`;
    // We need to request the file first to get the SHA
    return this.request(fileURL)
    .then(({ sha }) => this.request(fileURL, {
      method: "DELETE",
      params: { sha, message, branch },
    }));
  }

  editorialWorkflowGit(fileTree, entry, filesList, options) {
    const contentKey = entry.slug;
    const branchName = `cms/${ contentKey }`;
    const unpublished = options.unpublished || false;

    const commitPromise = this.getBranch()
      .then(branchData => this.updateTree(branchData.commit.sha, "/", fileTree))
      .then(changeTree => this.commit(options.commitMessage, changeTree));

    const usernamePromise = this.user().then(user => (user.name ? user.name : user.login));

    const initialMetadata = {
      title: options.parsedData && options.parsedData.title,
      description: options.parsedData && options.parsedData.description,
      timeStamp: new Date().toISOString(),
    };

    return (unpublished

      // Entry is already on editorial review workflow - just update
      // metadata and commit to existing branch
      ? this.retrieveMetadata(contentKey).then(existingMetadata => resolvePromiseProperties({
        ...existingMetadata,
        ...initialMetadata,
        pr: commitPromise.then(commit => ({ ...existingMetadata.pr, head: commit.sha })),
        objects: {
          entry: pick(entry, ['path', 'sha']),
          files: uniq(
            ((existingMetadata.objects && existingMetadata.objects.files) || []).concat(filesList)
          ),
        },
      }))
        .then(newMetadata => Promise.all([newMetadata, commitPromise]))
        .then(([newMetadata, commit]) =>
          this.patchBranch(branchName, commit.sha).then(() => newMetadata)
        )

      // Open new editorial review workflow for this entry - Create new
      // metadata and commit to new branch
      : resolvePromiseProperties({
        ...initialMetadata,
        type: "PR",
        pr: commitPromise
          .then(commit => this.createBranch(branchName, commit.sha))
          .then(() => this.createPR(options.commitMessage, branchName))
          .then(pr => ({ number: pr.number, head: pr.head && pr.head.sha })),
        user: usernamePromise,
        status: status.first(),
        branch: branchName,
        collection: options.collectionName,
        objects: { entry: pick(entry, ['path', 'sha']), files: filesList },
      })

    ).then(metadata => this.storeMetadata(contentKey, metadata));
  }

  updateUnpublishedEntryStatus(collection, slug, status) {
    const contentKey = slug;
    return this.retrieveMetadata(contentKey)
    .then(metadata => ({ ...metadata, status }))
    .then(updatedMetadata => this.storeMetadata(contentKey, updatedMetadata));
  }

  deleteUnpublishedEntry(collection, slug) {
    const contentKey = slug;
    return this.retrieveMetadata(contentKey)
    .then(metadata => this.closePR(metadata.pr, metadata.objects))
    .then(() => this.deleteBranch(`cms/${ contentKey }`))
    // If the PR doesn't exist, then this has already been deleted -
    // deletion should be idempotent, so we can consider this a
    // success.
    .catch((err) => {
      if (err.message === "Reference does not exist") {
        return Promise.resolve();
      }
      return Promise.reject(err);
    });
  }

  publishUnpublishedEntry(collection, slug) {
    const contentKey = slug;
    return this.retrieveMetadata(contentKey)
    .then(metadata => this.mergePR(metadata.pr, metadata.objects))
    .then(() => this.deleteBranch(`cms/${ contentKey }`));
  }


  createRef(type, name, sha) {
    return this.request(`${ this.repoURL }/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/${ type }/${ name }`, sha }),
    });
  }

  patchRef(type, name, sha) {
    return this.request(`${ this.repoURL }/git/refs/${ type }/${ encodeURIComponent(name) }`, {
      method: "PATCH",
      body: JSON.stringify({ sha }),
    });
  }

  deleteRef(type, name, sha) {
    return this.request(`${ this.repoURL }/git/refs/${ type }/${ encodeURIComponent(name) }`, {
      method: 'DELETE',
    });
  }

  getBranch(branch = this.branch) {
    return this.request(`${ this.repoURL }/branches/${ encodeURIComponent(branch) }`);
  }

  createBranch(branchName, sha) {
    return this.createRef("heads", branchName, sha);
  }

  patchBranch(branchName, sha) {
    return this.patchRef("heads", branchName, sha);
  }

  deleteBranch(branchName) {
    return this.deleteRef("heads", branchName);
  }

  createPR(title, head, base = this.branch) {
    const body = "Automatically generated by Netlify CMS";
    return this.request(`${ this.repoURL }/pulls`, {
      method: "POST",
      body: JSON.stringify({ title, body, head, base }),
    });
  }

  closePR(pullrequest, objects) {
    const prNumber = pullrequest.number;
    console.log("%c Deleting PR", "line-height: 30px;text-align: center;font-weight: bold"); // eslint-disable-line
    return this.request(`${ this.repoURL }/pulls/${ prNumber }`, {
      method: "PATCH",
      body: JSON.stringify({
        state: closed,
      }),
    });
  }

  mergePR(pullrequest, objects) {
    const headSha = pullrequest.head;
    const prNumber = pullrequest.number;
    console.log("%c Merging PR", "line-height: 30px;text-align: center;font-weight: bold"); // eslint-disable-line
    return this.request(`${ this.repoURL }/pulls/${ prNumber }/merge`, {
      method: "PUT",
      body: JSON.stringify({
        commit_message: "Automatically generated. Merged on Netlify CMS.",
        sha: headSha,
      }),
    })
    .catch((error) => {
      if (error instanceof APIError && error.status === 405) {
        this.forceMergePR(pullrequest, objects);
      } else {
        throw error;
      }
    });
  }

  forceMergePR(pullrequest, objects) {
    const files = objects.files.concat(objects.entry);
    const fileTree = this.composeFileTree(files);
    const commitMessage = `\
Automatically generated. Merged on Netlify CMS

Force merge of:
${ files.map(file => `* "${ file.path }"`).join("\n") }\
`;
    console.log("%c Automatic merge not possible - Forcing merge.", "line-height: 30px;text-align: center;font-weight: bold"); // eslint-disable-line
    return this.getBranch()
    .then(branchData => this.updateTree(branchData.commit.sha, "/", fileTree))
    .then(changeTree => this.commit(commitMessage, changeTree))
    .then(response => this.patchBranch(this.branch, response.sha));
  }

  getTree(sha) {
    return sha ? this.request(`${ this.repoURL }/git/trees/${ sha }`) : Promise.resolve({ tree: [] });
  }

  toBase64(str) {
    return Promise.resolve(Base64.encode(str));
  }

  uploadBlob(item) {
    const content = item instanceof AssetProxy ? item.toBase64() : this.toBase64(item.raw);

    return content.then(contentBase64 => this.request(`${ this.repoURL }/git/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: contentBase64,
        encoding: "base64",
      }),
    })).then(response => Object.assign({}, item, {
      sha: response.sha,
      uploaded: true,
    }));
  }

  isFile(obj) {
    return obj.file;
  }

  updateTree(sha, path, fileTree) {
    return this.getTree(sha)
      .then(({ tree: dirContents }) => {
        const updatedItems = dirContents.filter(item => fileTree[item.path]);
        const added = zipObject(updatedItems.map(item => item.path), Array(updatedItems.length).fill(true));
        const [updatedFiles, updatedDirs] = partition(updatedItems, this.isFile);
        const updatePromises = [
          ...updatedDirs.map(dir => this.updateTree(dir.sha, dir.path, fileTree[dir.path])),
          ...updatedFiles.map(file => ({ ...pick(file, ['path', 'mode', 'type']), sha: fileTree[file.path].sha })),
        ];

        const newItems = entries(fileTree).filter(([filename]) => !added[filename]);
        const [newFiles, newDirs] = partition(newItems, ([, file]) => this.isFile(file));
        const newPromises = [
          ...newDirs.map(([dirName, dir]) => this.updateTree(null, dirName, dir)),
          ...newFiles.map(([fileName, file]) => ({ path: fileName, mode: "100644", type: "blob", sha: file.sha })),
        ];

        const updates = [...updatePromises, ...newPromises];
        return Promise.all(updates)
          .then(resolvedUpdates => this.request(`${ this.repoURL }/git/trees`, {
            method: "POST",
            body: JSON.stringify({ base_tree: sha, tree: updates }),
          })).then(response => ({ path, mode: "040000", type: "tree", sha: response.sha, parentSha: sha }));
      });
  }

  commit(message, changeTree) {
    const tree = changeTree.sha;
    const parents = changeTree.parentSha ? [changeTree.parentSha] : [];
    return this.request(`${ this.repoURL }/git/commits`, {
      method: "POST",
      body: JSON.stringify({ message, tree, parents }),
    });
  }
}
