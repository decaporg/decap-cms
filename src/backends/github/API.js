import LocalForage from "localforage";
import { Base64 } from "js-base64";
import _ from "lodash";
import { filterPromises, resolvePromiseProperties } from "../../lib/promiseHelper";
import AssetProxy from "../../valueObjects/AssetProxy";
import { SIMPLE, EDITORIAL_WORKFLOW, status } from "../../constants/publishModes";
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

  requestHeaders(headers = {}) {
    const baseHeader = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (this.token) {
      baseHeader.Authorization = `token ${ this.token }`;
      return baseHeader;
    }

    return baseHeader;
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
    const cacheBuster = new Date().getTime();
    const params = [`ts=${cacheBuster}`];
    if (options.params) {
      for (const key in options.params) {
        params.push(`${ key }=${ encodeURIComponent(options.params[key]) }`);
      }
    }
    if (params.length) {
      path += `?${ params.join("&") }`;
    }
    return this.api_root + path;
  }

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    let responseStatus;
    return fetch(url, { ...options, headers }).then((response) => {
      responseStatus = response.status;
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }
      return response.text();
    })
    .catch((error) => {
      throw new APIError(error.message, responseStatus, 'GitHub');
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
        raw: "# Netlify CMS\n\nThis tree is used by the Netlify CMS to store metadata information for specific files and branches.",
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
      const fileTree = {
        [`${ key }.json`]: {
          path: `${ key }.json`,
          raw: JSON.stringify(data),
          file: true,
        },
      };

      return this.uploadBlob(fileTree[`${ key }.json`])
      .then(item => this.updateTree(branchData.sha, "/", fileTree))
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
    .then(files => {
      if (!Array.isArray(files)) {
        throw new Error(`Cannot list files, path ${path} is not a directory but a ${files.type}`);
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
    .then(data => true)
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
      return this.request(`${ this.repoURL }/pulls?head=${ branchName }&state=open`)
        .then(prs => prs.some(pr => pr.head.ref === branchName));
    }))
    .catch((error) => {
      console.log("%c No Unpublished entries", "line-height: 30px;text-align: center;font-weight: bold"); // eslint-disable-line
      throw error;
    });
  }

  composeFileTree(files) {
    let filename;
    let part;
    let parts;
    let subtree;
    const fileTree = {};

    files.forEach((file) => {
      if (file.uploaded) { return; }
      parts = file.path.split("/").filter(part => part);
      filename = parts.pop();
      subtree = fileTree;
      while (part = parts.shift()) {
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
    const files = mediaFiles.concat(entry);
    

    files.forEach((file) => {
      if (file.uploaded) { return; }
      uploadPromises.push(this.uploadBlob(file));
    });

    const fileTree = this.composeFileTree(files);

    return Promise.all(uploadPromises).then(() => {
      if (!options.mode || (options.mode && options.mode === SIMPLE)) {
        return this.getBranch()
        .then(branchData => this.updateTree(branchData.commit.sha, "/", fileTree))
        .then(changeTree => this.commit(options.commitMessage, changeTree))
        .then(response => this.patchBranch(this.branch, response.sha));
      } else if (options.mode && options.mode === EDITORIAL_WORKFLOW) {
        const mediaFilesList = mediaFiles.map(file => ({ path: file.path, sha: file.sha }));
        return this.editorialWorkflowGit(fileTree, entry, mediaFilesList, options);
      }
    });
  }

  editorialWorkflowGit(fileTree, entry, filesList, options) {
    const contentKey = entry.slug;
    const branchName = `cms/${ contentKey }`;
    const unpublished = options.unpublished || false;
    if (!unpublished) {
      // Open new editorial review workflow for this entry - Create new metadata and commit to new branch`
      const contentKey = entry.slug;
      const branchName = `cms/${ contentKey }`;

      return this.getBranch()
      .then(branchData => this.updateTree(branchData.commit.sha, "/", fileTree))
      .then(changeTree => this.commit(options.commitMessage, changeTree))
      .then(commitResponse => this.createBranch(branchName, commitResponse.sha))
      .then(branchResponse => this.createPR(options.commitMessage, branchName))
      .then(prResponse => this.user().then(user => user.name ? user.name : user.login)
        .then(username => this.storeMetadata(contentKey, {
          type: "PR",
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
            entry: {
              path: entry.path,
              sha: entry.sha,
            },
            files: filesList,
          },
          timeStamp: new Date().toISOString(),
        }
        )));
    } else {
      // Entry is already on editorial review workflow - just update metadata and commit to existing branch
      return this.getBranch(branchName)
      .then(branchData => this.updateTree(branchData.commit.sha, "/", fileTree))
      .then(changeTree => this.commit(options.commitMessage, changeTree))
      .then((response) => {
        const contentKey = entry.slug;
        const branchName = `cms/${ contentKey }`;
        return this.user().then(user => user.name ? user.name : user.login)
        .then(username => this.retrieveMetadata(contentKey))
        .then((metadata) => {
          let files = metadata.objects && metadata.objects.files || [];
          files = files.concat(filesList);
          const updatedPR = metadata.pr;
          updatedPR.head = response.sha;
          return {
            ...metadata,
            pr: updatedPR,
            title: options.parsedData && options.parsedData.title,
            description: options.parsedData && options.parsedData.description,
            objects: {
              entry: {
                path: entry.path,
                sha: entry.sha,
              },
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
    .then(metadata => ({
      ...metadata,
      status,
    }))
    .then(updatedMetadata => this.storeMetadata(contentKey, updatedMetadata));
  }

  deleteUnpublishedEntry(collection, slug) {
    const contentKey = slug;
    let prNumber; 
    return this.retrieveMetadata(contentKey)
    .then(metadata => this.closePR(metadata.pr, metadata.objects))
    .then(() => this.deleteBranch(`cms/${ contentKey }`));
  }

  publishUnpublishedEntry(collection, slug) {
    const contentKey = slug;
    let prNumber;
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
      method: "DELETE",
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
    const headSha = pullrequest.head;
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
    let commitMessage = "Automatically generated. Merged on Netlify CMS\n\nForce merge of:";
    files.forEach((file) => {
      commitMessage += `\n* "${ file.path }"`;
    });
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
    return Promise.resolve(
      Base64.encode(str)
    );
  }

  uploadBlob(item) {
    const content = item instanceof AssetProxy ? item.toBase64() : this.toBase64(item.raw);

    return content.then(contentBase64 => this.request(`${ this.repoURL }/git/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: contentBase64,
        encoding: "base64",
      }),
    }).then((response) => {
      item.sha = response.sha;
      item.uploaded = true;
      return item;
    }));
  }

  updateTree(sha, path, fileTree) {
    return this.getTree(sha)
      .then((tree) => {
        let obj;
        let filename;
        let fileOrDir;
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
              { path: filename, mode: "100644", type: "blob", sha: fileOrDir.sha } :
              this.updateTree(null, filename, fileOrDir)
          );
        }
        return Promise.all(updates)
          .then(updates => this.request(`${ this.repoURL }/git/trees`, {
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
