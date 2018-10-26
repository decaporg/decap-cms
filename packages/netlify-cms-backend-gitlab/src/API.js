import { localForage, then, unsentRequest } from 'netlify-cms-lib-util';
import { Base64 } from 'js-base64';
import { fromJS, List, Map } from 'immutable';
import { flow, get, partial, result, uniq } from 'lodash';
import { filterPromises, resolvePromiseProperties } from 'netlify-cms-lib-util';
import { APIError, Cursor, EditorialWorkflowError } from 'netlify-cms-lib-util';

const CMS_BRANCH_PREFIX = 'cms/';
const CMS_METADATA_BRANCH = '_netlify_cms';

export default class API {
  constructor(config) {
    this.api_root = config.api_root || 'https://gitlab.com/api/v4';
    this.token = config.token || false;
    this.branch = config.branch || 'master';
    this.repo = config.repo || '';
    this.repoURL = `/projects/${encodeURIComponent(this.repo)}`;
    this.squash_merges = config.squash_merges || false;
    this.initialWorkflowStatus = config.initialWorkflowStatus;
  }

  withAuthorizationHeaders = req =>
    unsentRequest.withHeaders(this.token ? { Authorization: `Bearer ${this.token}` } : {}, req);

  withBody = body => req =>
    flow(
      body
        ? [
            r => unsentRequest.withHeaders({ 'Content-Type': 'application/json' }, r),
            r => unsentRequest.withBody(JSON.stringify(body), r),
          ]
        : [],
    )(req);

  buildRequest = req =>
    flow([
      unsentRequest.withRoot(this.api_root),
      unsentRequest.withTimestamp,
      this.withAuthorizationHeaders,
      this.withBody(req.body),
    ])(req);

  request = async req =>
    flow([
      this.buildRequest,
      unsentRequest.performRequest,
      p => p.catch(err => Promise.reject(new APIError(err.message, null, 'GitLab'))),
    ])(req);

  catchFormatErrors = (format, formatter) => res => {
    try {
      return formatter(res);
    } catch (err) {
      throw new Error(
        `Response cannot be parsed into the expected format (${format}): ${err.message}`,
      );
    }
  };

  responseFormats = fromJS({
    json: async res => {
      const contentType = res.headers.get('Content-Type');
      if (contentType !== 'application/json' && contentType !== 'text/json') {
        throw new Error(`${contentType} is not a valid JSON Content-Type`);
      }
      return res.json();
    },
    text: async res => res.text(),
    blob: async res => res.blob(),
  }).mapEntries(([format, formatter]) => [format, this.catchFormatErrors(format, formatter)]);

  parseResponse = async (res, { expectingOk = true, expectingFormat = 'text' }) => {
    let body;
    try {
      const formatter = this.responseFormats.get(expectingFormat, false);
      if (!formatter) {
        throw new Error(`${expectingFormat} is not a supported response format.`);
      }
      body = await formatter(res);
    } catch (err) {
      throw new APIError(err.message, res.status, 'GitLab');
    }
    if (expectingOk && !res.ok) {
      const isJSON = expectingFormat === 'json';
      throw new APIError(isJSON && body.message ? body.message : body, res.status, 'GitLab');
    }
    return body;
  };

  responseToJSON = res => this.parseResponse(res, { expectingFormat: 'json' });
  responseToBlob = res => this.parseResponse(res, { expectingFormat: 'blob' });
  responseToText = res => this.parseResponse(res, { expectingFormat: 'text' });

  requestJSON = req => this.request(req).then(this.responseToJSON);
  requestBlob = req => this.request(req).then(this.responseToBlob);
  requestText = req => this.request(req).then(this.responseToText);

  toBase64 = str => Promise.resolve(Base64.encode(str));
  fromBase64 = str => Promise.resolve(Base64.decode(str));

  user = () => this.requestJSON('/user');

  WRITE_ACCESS = 30;
  hasWriteAccess = () =>
    this.requestJSON(this.repoURL).then(({ permissions }) => {
      const { project_access, group_access } = permissions;
      if (project_access && project_access.access_level >= this.WRITE_ACCESS) {
        return true;
      }
      if (group_access && group_access.access_level >= this.WRITE_ACCESS) {
        return true;
      }
      return false;
    });

  readFile(path, sha, { ref = this.branch, parseText = true } = {}) {
    if (sha) {
      return this.getBlob(sha, path, ref, parseText);
    } else {
      return this.fetchBlob(path, ref, parseText);
    }
  }

  getBlob(sha, path, ref, parseText) {
    const cacheKey = parseText ? `gl.${sha}` : `gl.${sha}.blob`;
    return localForage.getItem(cacheKey).then(cached => {
      if (cached) {
        return cached;
      }

      return this.fetchBlob(path, ref, parseText).then(result => {
        localForage.setItem(cacheKey, result);
        return result;
      });
    });
  }

  fetchBlob(path, ref, parseText) {
    return flow([parseText ? this.requestText : this.requestBlob])({
      url: `${this.repoURL}/repository/files/${encodeURIComponent(path)}/raw`,
      params: { ref },
      cache: 'no-store',
    });
  }

  getCursorFromHeaders = headers => {
    // indices and page counts are assumed to be zero-based, but the
    // indices and page counts returned from GitLab are one-based
    const index = parseInt(headers.get('X-Page'), 10) - 1;
    const pageCount = parseInt(headers.get('X-Total-Pages'), 10) - 1;
    const pageSize = parseInt(headers.get('X-Per-Page'), 10);
    const count = parseInt(headers.get('X-Total'), 10);
    const linksRaw = headers.get('Link');
    const links = List(linksRaw.split(','))
      .map(str => str.trim().split(';'))
      .map(([linkStr, keyStr]) => [
        keyStr.match(/rel="(.*?)"/)[1],
        unsentRequest.fromURL(
          linkStr
            .trim()
            .match(/<(.*?)>/)[1]
            .replace(/\+/g, '%20'),
        ),
      ])
      .update(list => Map(list));
    const actions = links
      .keySeq()
      .flatMap(key =>
        (key === 'prev' && index > 0) ||
        (key === 'next' && index < pageCount) ||
        (key === 'first' && index > 0) ||
        (key === 'last' && index < pageCount)
          ? [key]
          : [],
      );
    return Cursor.create({
      actions,
      meta: { index, count, pageSize, pageCount },
      data: { links },
    });
  };

  getCursor = ({ headers }) => this.getCursorFromHeaders(headers);

  // Gets a cursor without retrieving the entries by using a HEAD
  // request
  fetchCursor = req =>
    flow([unsentRequest.withMethod('HEAD'), this.request, then(this.getCursor)])(req);
  fetchCursorAndEntries = req =>
    flow([
      unsentRequest.withMethod('GET'),
      this.request,
      p => Promise.all([p.then(this.getCursor), p.then(this.responseToJSON)]),
      then(([cursor, entries]) => ({ cursor, entries })),
    ])(req);
  fetchRelativeCursor = async (cursor, action) => this.fetchCursor(cursor.data.links[action]);

  reversableActions = Map({
    first: 'last',
    last: 'first',
    next: 'prev',
    prev: 'next',
  });

  reverseCursor = cursor => {
    const pageCount = cursor.meta.get('pageCount', 0);
    const currentIndex = cursor.meta.get('index', 0);
    const newIndex = pageCount - currentIndex;

    const links = cursor.data.get('links', Map());
    const reversedLinks = links.mapEntries(([k, v]) => [this.reversableActions.get(k) || k, v]);

    const reversedActions = cursor.actions.map(
      action => this.reversableActions.get(action) || action,
    );

    return cursor.updateStore(store =>
      store
        .setIn(['meta', 'index'], newIndex)
        .setIn(['data', 'links'], reversedLinks)
        .set('actions', reversedActions),
    );
  };

  // The exported listFiles and traverseCursor reverse the direction
  // of the cursors, since GitLab's pagination sorts the opposite way
  // we want to sort by default (it sorts by filename _descending_,
  // while the CMS defaults to sorting by filename _ascending_, at
  // least in the current GitHub backend). This should eventually be
  // refactored.
  listFiles = async path => {
    const firstPageCursor = await this.fetchCursor({
      url: `${this.repoURL}/repository/tree`,
      params: { path, ref: this.branch },
    });
    const lastPageLink = firstPageCursor.data.getIn(['links', 'last']);
    const { entries, cursor } = await this.fetchCursorAndEntries(lastPageLink);
    return {
      files: entries.filter(({ type }) => type === 'blob').reverse(),
      cursor: this.reverseCursor(cursor),
    };
  };

  traverseCursor = async (cursor, action) => {
    const link = cursor.data.getIn(['links', action]);
    const { entries, cursor: newCursor } = await this.fetchCursorAndEntries(link);
    return { entries: entries.reverse(), cursor: this.reverseCursor(newCursor) };
  };

  listAllFiles = async path => {
    const entries = [];
    let { cursor, entries: initialEntries } = await this.fetchCursorAndEntries({
      url: `${this.repoURL}/repository/tree`,
      // Get the maximum number of entries per page
      params: { path, ref: this.branch, per_page: 100 },
    });
    entries.push(...initialEntries);
    while (cursor && cursor.actions.has('next')) {
      const link = cursor.data.getIn(['links', 'next']);
      const { cursor: newCursor, entries: newEntries } = await this.fetchCursorAndEntries(link);
      entries.push(...newEntries);
      cursor = newCursor;
    }
    return entries.filter(({ type }) => type === 'blob');
  };

  toCommitParams(commit_message, branch, author) {
    const commitParams = { branch, commit_message };
    if (author) {
      return {
        ...commitParams,
        author_email: author.email,
        author_name: author.name,
      };
    } else {
      return commitParams;
    }
  }

  async uploadAndCommit(
    entry,
    items,
    { commitMessage, newEntry = true, branch = this.branch, author = this.commitAuthor },
  ) {
    const commitParams = this.toCommitParams(commitMessage, branch, author);
    const action = newEntry ? 'create' : 'update';
    const actions = await Promise.all(
      items.map(async item => ({
        action,
        file_path: item.path.replace(/^\//, ''),
        content: await result(item, 'toBase64', partial(this.toBase64, item.raw)),
        encoding: 'base64',
        ...(item.sha ? { last_commit_id: item.sha } : {}),
      })),
    );
    const response = await this.requestJSON({
      method: 'POST',
      url: `${this.repoURL}/repository/commits`,
      body: {
        ...commitParams,
        actions,
      },
    });
    return items.map(item => ({
      ...item,
      sha: response.id,
      uploaded: true,
    }));
  }

  persistFiles(entry, mediaFiles, options) {
    const files = entry ? [entry, ...mediaFiles] : [...mediaFiles];
    if (!options.useWorkflow) {
      return this.uploadAndCommit(entry, files, options);
    } else {
      return this.editorialWorkflowGit(entry, files, options);
    }
  }

  deleteFile(path, commitMessage, { branch = this.branch, author = this.commitAuthor }) {
    const commitParams = this.toCommitParams(commitMessage, branch, author);
    return this.request({
      method: 'DELETE',
      url: `${this.repoURL}/repository/files/${encodeURIComponent(path)}`,
      params: commitParams,
      // Note that changes to the file are allowed, so `last_commit_id` is not checked against `item.sha`.
      // last_commit_id: ???,
    });
  }

  // Metadata

  checkMetadataBranch() {
    return this.getBranch(CMS_METADATA_BRANCH).catch(error => {
      if (error instanceof APIError && error.status === 404) {
        return this.createMetadataBranch();
      }
      throw error;
    });
  }

  createMetadataBranch() {
    // The Branches API doesn't support creating orphan branches.
    // The Commits API doesn't support creating orphan branches.
    //   https://gitlab.com/gitlab-org/gitlab-ce/issues/2420 only works for empty repositories.
    throw new Error(`Not Implemented - GitLab API does not support creating orphan branches.'`);
    // TODO - rudolf - Update README / Installation and Configuration.
    // Git could be used for creating orphan branches.
    //   git checkout --orphan _netlify_cms
    //   git rm --cached *
    //   echo "# Netlify CMS\n\nThis branch is used by Netlify CMS to store metadata information for files, branches, merge requests.\n" > README.md
    //   git add README.md
    //   git commit -m "Initial commit by Netlify CMS"
    //   git push --set-upstream origin _netlify_cms
  }

  retrieveMetadata(key) {
    const metadataKey = `gl.meta.${key}`;
    const metadataPath = `${key}.json`;
    return localForage.getItem(metadataKey).then(cached => {
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }
      console.log(
        '%c Checking for MetaData files of %s',
        'line-height: 30px;text-align: center;font-weight: bold',
        key,
      );
      return this.fetchBlob(metadataPath, CMS_METADATA_BRANCH, true)
        .then(raw => JSON.parse(raw))
        .catch(error => {
          if (error instanceof APIError && error.status === 404) {
            console.log(
              '%c %s does not have metadata',
              'line-height: 30px;text-align: center;font-weight: bold',
              key,
            );
            throw error;
          }
          throw error;
        });
    });
  }

  storeMetadata(key, data, { create = false } = {}) {
    const metadataKey = `gl.meta.${key}`;
    const metadataPath = `${key}.json`;
    return this.checkMetadataBranch().then(() =>
      this.uploadAndCommit(
        null, // entry is not used
        [
          {
            path: metadataPath,
            raw: JSON.stringify(data),
          },
        ],
        {
          commitMessage: (create ? 'Create' : 'Update') + ` '${key}' metadata`,
          newEntry: create,
          branch: CMS_METADATA_BRANCH,
        },
      ).then(() =>
        localForage.setItem(metadataKey, {
          expires: Date.now() + 300000, // in 5 minutes
          data,
        }),
      ),
    );
  }

  deleteMetadata(key) {
    const metadataKey = `gl.meta.${key}`;
    const metadataPath = `${key}.json`;
    return this.deleteFile(metadataPath, `Delete '${key}' metadata`, {
      branch: CMS_METADATA_BRANCH,
    }).then(() => localForage.removeItem(metadataKey));
  }

  // Editorial Workflow

  editorialWorkflowGit(entry, items, options) {
    const branchName = this.generateBranchName(options.collectionName, entry.slug);
    const unpublished = options.unpublished || false;
    if (!unpublished) {
      // Open new editorial review workflow for this entry - create new metadata and commit to new branch
      // Note that the metadata branch is checked to fail fast and avoid inconsistent state.
      return this.checkMetadataBranch().then(() =>
        this.createBranch(branchName).then(branch =>
          this.uploadAndCommit(entry, items, { ...options, branch: branch.name }).then(
            updatedItems =>
              this.createMR(options.commitMessage, branch.name).then(mr => {
                const sha = updatedItems[0].sha;
                const filesList = updatedItems.map(item => ({ path: item.path, sha: item.sha }));
                const user = mr.author;
                const metadata = {
                  type: 'MR',
                  mr: {
                    number: mr.iid,
                    head: sha, // === mr.sha
                  },
                  user: user.name || user.username,
                  status: this.initialWorkflowStatus,
                  branch: branch.name,
                  collection: options.collectionName,
                  title: options.parsedData && options.parsedData.title,
                  description: options.parsedData && options.parsedData.description,
                  objects: {
                    // NOTE - rudolf - It looks like `entry.sha` is always `undefined`.
                    entry: { path: entry.path, sha: entry.sha },
                    files: filesList,
                  },
                  timeStamp: new Date().toISOString(),
                };
                return this.storeMetadata(branchName, metadata, { create: true });
              }),
          ),
        ),
      );
    } else {
      // Entry is already on editorial review workflow - update metadata and commit to existing branch
      return this.retrieveMetadata(branchName).then(metadata =>
        this.getBranch(branchName).then(branch =>
          this.uploadAndCommit(entry, items, { ...options, branch: branch.name }).then(
            updatedItems => {
              const sha = updatedItems[0].sha;
              const filesList = updatedItems.map(item => ({ path: item.path, sha: item.sha }));
              // TODO - rudolf - Why does it matter whether an asset store is in use?
              // if (options.hasAssetStore) {
              //   /**
              //    * If an asset store is in use, assets are always accessible, so we
              //    * can just finish the persist operation here.
              //    */
              const metadataFiles = get(metadata.objects, 'files', []);
              const files = [...metadataFiles, ...filesList];
              const updatedMetadata = {
                ...metadata,
                mr: {
                  ...metadata.mr,
                  head: sha,
                },
                title: options.parsedData && options.parsedData.title,
                description: options.parsedData && options.parsedData.description,
                objects: {
                  // NOTE - rudolf - It looks like `entry.sha` is always `undefined`.
                  entry: { path: entry.path, sha: entry.sha },
                  files: uniq(files),
                },
                timeStamp: new Date().toISOString(),
              };
              return this.storeMetadata(branchName, updatedMetadata);
              // } else {
              //   /**
              //    * If no asset store is in use, assets are being stored in the content
              //    * repo, which means pull requests opened for editorial workflow
              //    * entries must be rebased if assets have been added or removed.
              //    */
              //   return this.rebaseMR(mr.number, branchName, metadata, sha);
              // }
            },
          ),
        ),
      );
    }
  }

  listUnpublishedBranches() {
    console.log(
      '%c Checking for Unpublished entries',
      'line-height: 30px;text-align: center;font-weight: bold',
    );
    // Get branches with a `name` matching `CMS_BRANCH_PREFIX`.
    // Note that this is a substring match, so we need to check that the `branch.name` was generated by us.
    return this.requestJSON({
      url: `${this.repoURL}/repository/branches`,
      params: { search: CMS_BRANCH_PREFIX },
    })
      .then(branches =>
        branches.filter(branch => this.assertBranchName(branch.name) && !branch.merged),
      )
      .then(branches =>
        filterPromises(branches, branch =>
          // Get MRs with a `source_branch` of `branch.name`.
          // Note that this is *probably* a substring match, so we need to check that
          // the `source_branch` of at least one of the returned objects matches `branch.name`.
          this.requestJSON({
            url: `${this.repoURL}/merge_requests`,
            params: {
              state: 'opened',
              source_branch: branch.name,
              target_branch: this.branch,
            },
          }).then(mrs => mrs.some(mr => mr.source_branch === branch.name)),
        ),
      )
      .catch(error => {
        console.log(
          '%c No Unpublished entries',
          'line-height: 30px;text-align: center;font-weight: bold',
        );
        throw error;
      });
  }

  readUnpublishedBranchFile(collection, slug) {
    const branchName = this.generateBranchName(collection, slug);
    const metaDataPromise = this.retrieveMetadata(branchName).then(
      data => (data.objects.entry.path ? data : Promise.reject(null)),
    );
    return resolvePromiseProperties({
      metaData: metaDataPromise,
      fileData: metaDataPromise.then(data =>
        this.readFile(data.objects.entry.path, null, { ref: data.branch }),
      ),
      isModification: metaDataPromise.then(data =>
        this.isUnpublishedEntryModification(data.objects.entry.path, this.branch),
      ),
    }).catch(() => {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    });
  }

  isUnpublishedEntryModification(path, branch) {
    return this.readFile(path, null, { ref: branch })
      .then(() => true)
      .catch(error => {
        if (error instanceof APIError && error.status === 404) {
          return false;
        }
        throw error;
      });
  }

  updateUnpublishedEntryStatus(collection, slug, status) {
    const branchName = this.generateBranchName(collection, slug);
    return this.retrieveMetadata(branchName)
      .then(metadata => ({
        ...metadata,
        status,
      }))
      .then(updatedMetadata => this.storeMetadata(branchName, updatedMetadata));
  }

  deleteUnpublishedEntry(collection, slug) {
    const branchName = this.generateBranchName(collection, slug);
    return (
      this.retrieveMetadata(branchName)
        .then(metadata => this.closeMR(metadata.mr))
        .then(() => this.deleteBranch(branchName))
        .then(() => this.deleteMetadata(branchName))
        // If the MR doesn't exist, then this has already been deleted.
        // Deletion should be idempotent, so we can consider this a success.
        .catch(error => {
          if (error instanceof APIError && error.status === 404) {
            return Promise.resolve();
          }
          throw error;
        })
    );
  }

  publishUnpublishedEntry(collection, slug) {
    const branchName = this.generateBranchName(collection, slug);
    return this.retrieveMetadata(branchName)
      .then(metadata => this.mergeMR(metadata.mr, metadata.branch, metadata.objects))
      .then(() => this.deleteBranch(branchName))
      .then(() => this.deleteMetadata(branchName));
  }

  // Branches

  generateBranchName(collection, slug) {
    return `${CMS_BRANCH_PREFIX}${collection}/${slug}`;
  }

  deconstructBranchName(name) {
    return name
      .split(CMS_BRANCH_PREFIX)
      .pop()
      .split('/');
  }

  assertBranchName(name) {
    return name.startsWith(CMS_BRANCH_PREFIX);
  }

  getBranch(branch = this.branch) {
    return this.requestJSON(`${this.repoURL}/repository/branches/${encodeURIComponent(branch)}`);
  }

  createBranch(branch, ref = this.branch) {
    return this.requestJSON({
      method: 'POST',
      url: `${this.repoURL}/repository/branches`,
      params: { branch, ref },
    });
  }

  deleteBranch(branch) {
    return this.request({
      method: 'DELETE',
      url: `${this.repoURL}/repository/branches/${encodeURIComponent(branch)}`,
    });
  }

  // Merge Requests

  getMR(mrNumber) {
    return this.requestJSON(
      `${this.repoURL}/repository/merge_requests/${encodeURIComponent(mrNumber)}`,
    );
  }

  createMR(title, source_branch, target_branch = this.branch) {
    console.log('%c Creating MR', 'line-height: 30px;text-align: center;font-weight: bold');
    return this.requestJSON({
      method: 'POST',
      url: `${this.repoURL}/merge_requests`,
      body: {
        source_branch,
        target_branch,
        title,
        description: 'Generated by Netlify CMS',
        remove_source_branch: false,
        squash: this.squash_merges,
      },
    });
  }

  closeMR(mr) {
    const mrNumber = mr.number;
    console.log('%c Deleting MR', 'line-height: 30px;text-align: center;font-weight: bold');
    return this.requestJSON({
      method: 'PUT',
      url: `${this.repoURL}/merge_requests/${encodeURIComponent(mrNumber)}`,
      body: {
        state_event: 'close',
      },
    });
  }

  mergeMR(mr, branch, objects) {
    const mrNumber = mr.number;
    console.log('%c Merging MR', 'line-height: 30px;text-align: center;font-weight: bold');
    return this.requestJSON({
      method: 'PUT',
      url: `${this.repoURL}/merge_requests/${encodeURIComponent(mrNumber)}/merge`,
      body: {
        merge_commit_message:
          'Merged by Netlify CMS\n' + `Merge branch '${branch}' into '${this.branch}'`,
        // Note that changes to the branch are allowed, so HEAD is not checked against `mr.head`.
        // sha: mr.head,
      },
    }).catch(error => {
      if (error instanceof APIError && error.status === 405) {
        return this.forceMergeMR(mr, branch, objects);
      }
      throw error;
    });
  }

  // eslint-disable-next-line no-unused-vars
  forceMergeMR(mr, branch, objects) {
    // TODO - rudolf - Why is this needed? How are merge conflicts possible?
    throw new Error(`Not Implemented`);
  }

  // eslint-disable-next-line no-unused-vars
  rebaseMR(mrNumber, branch, metadata, sha) {
    // TODO - rudolf - Why is this needed? How are assets affected by branches?
    throw new Error(`Not Implemented`);
  }
}
