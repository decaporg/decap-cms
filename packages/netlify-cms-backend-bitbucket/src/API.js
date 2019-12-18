import { flow, get } from 'lodash';
import {
  localForage,
  unsentRequest,
  responseParser,
  then,
  basename,
  Cursor,
  APIError,
} from 'netlify-cms-lib-util';

export default class API {
  constructor(config) {
    this.api_root = config.api_root || 'https://api.bitbucket.org/2.0';
    this.branch = config.branch || 'master';
    this.repo = config.repo || '';
    this.requestFunction = config.requestFunction || unsentRequest.performRequest;
    // Allow overriding this.hasWriteAccess
    this.hasWriteAccess = config.hasWriteAccess || this.hasWriteAccess;
    this.repoURL = this.repo ? `/repositories/${this.repo}` : '';
  }

  buildRequest = req =>
    flow([unsentRequest.withRoot(this.api_root), unsentRequest.withTimestamp])(req);

  request = req =>
    flow([
      this.buildRequest,
      this.requestFunction,
      p => p.catch(err => Promise.reject(new APIError(err.message, null, 'BitBucket'))),
    ])(req);

  requestJSON = req =>
    flow([
      unsentRequest.withDefaultHeaders({ 'Content-Type': 'application/json' }),
      this.request,
      then(responseParser({ format: 'json' })),
      p => p.catch(err => Promise.reject(new APIError(err.message, null, 'BitBucket'))),
    ])(req);
  requestText = req =>
    flow([
      unsentRequest.withDefaultHeaders({ 'Content-Type': 'text/plain' }),
      this.request,
      then(responseParser({ format: 'text' })),
      p => p.catch(err => Promise.reject(new APIError(err.message, null, 'BitBucket'))),
    ])(req);

  user = () => this.requestJSON('/user');

  hasWriteAccess = async () => {
    const response = await this.request(this.repoURL);
    if (response.status === 404) {
      throw Error('Repo not found');
    }
    return response.ok;
  };

  branchCommitSha = async () => {
    const {
      target: { hash: branchSha },
    } = await this.requestJSON(`${this.repoURL}/refs/branches/${this.branch}`);
    return branchSha;
  };

  isFile = ({ type }) => type === 'commit_file';
  processFile = file => ({
    ...file,
    name: basename(file.path),

    // BitBucket does not return file SHAs, but it does give us the
    // commit SHA. Since the commit SHA will change if any files do,
    // we can construct an ID using the commit SHA and the file path
    // that will help with caching (though not as well as a normal
    // SHA, since it will change even if the individual file itself
    // doesn't.)
    ...(file.commit && file.commit.hash ? { id: `${file.commit.hash}/${file.path}` } : {}),
  });
  processFiles = files => files.filter(this.isFile).map(this.processFile);

  readFile = async (path, sha, { parseText = true } = {}) => {
    const cacheKey = parseText ? `bb.${sha}` : `bb.${sha}.blob`;
    const cachedFile = sha ? await localForage.getItem(cacheKey) : null;
    if (cachedFile) {
      return cachedFile;
    }
    const node = await this.branchCommitSha();
    const result = await this.request({
      url: `${this.repoURL}/src/${node}/${path}`,
      cache: 'no-store',
    }).then(parseText ? responseParser({ format: 'text' }) : responseParser({ format: 'blob' }));
    if (sha) {
      localForage.setItem(cacheKey, result);
    }
    return result;
  };

  getEntriesAndCursor = jsonResponse => {
    const {
      size: count,
      page: index,
      pagelen: pageSize,
      next,
      previous: prev,
      values: entries,
    } = jsonResponse;
    const pageCount = pageSize && count ? Math.ceil(count / pageSize) : undefined;
    return {
      entries,
      cursor: Cursor.create({
        actions: [...(next ? ['next'] : []), ...(prev ? ['prev'] : [])],
        meta: { index, count, pageSize, pageCount },
        data: { links: { next, prev } },
      }),
    };
  };

  listFiles = async path => {
    const node = await this.branchCommitSha();
    const { entries, cursor } = await flow([
      // sort files by filename ascending
      unsentRequest.withParams({ sort: '-path', max_depth: 10 }),
      this.requestJSON,
      then(this.getEntriesAndCursor),
    ])(`${this.repoURL}/src/${node}/${path}`);
    return { entries: this.processFiles(entries), cursor };
  };

  traverseCursor = async (cursor, action) =>
    flow([
      this.requestJSON,
      then(this.getEntriesAndCursor),
      then(({ cursor: newCursor, entries }) => ({
        cursor: newCursor,
        entries: this.processFiles(entries),
      })),
    ])(cursor.data.getIn(['links', action]));

  listAllFiles = async path => {
    const { cursor: initialCursor, entries: initialEntries } = await this.listFiles(path);
    const entries = [...initialEntries];
    let currentCursor = initialCursor;
    while (currentCursor && currentCursor.actions.has('next')) {
      const { cursor: newCursor, entries: newEntries } = await this.traverseCursor(
        currentCursor,
        'next',
      );
      entries.push(...newEntries);
      currentCursor = newCursor;
    }
    return this.processFiles(entries);
  };

  uploadBlob = async (item, { commitMessage, branch = this.branch } = {}) => {
    const contentBlob = get(item, 'fileObj', new Blob([item.raw]));
    const formData = new FormData();
    // Third param is filename header, in case path is `message`, `branch`, etc.
    formData.append(item.path, contentBlob, basename(item.path));
    formData.append('branch', branch);
    if (commitMessage) {
      formData.append('message', commitMessage);
    }
    if (this.commitAuthor) {
      const { name, email } = this.commitAuthor;
      formData.append('author', `${name} <${email}>`);
    }

    return flow([
      unsentRequest.withMethod('POST'),
      unsentRequest.withBody(formData),
      this.request,
      then(() => ({ ...item, uploaded: true })),
    ])(`${this.repoURL}/src`);
  };

  persistFiles = (files, { commitMessage }) =>
    Promise.all(
      files
        .filter(({ uploaded }) => !uploaded)
        .map(file => this.uploadBlob(file, { commitMessage })),
    );

  deleteFile = (path, message, { branch = this.branch } = {}) => {
    const body = new FormData();
    body.append('files', path);
    body.append('branch', branch);
    if (message) {
      body.append('message', message);
    }
    if (this.commitAuthor) {
      const { name, email } = this.commitAuthor;
      body.append('author', `${name} <${email}>`);
    }
    return flow([unsentRequest.withMethod('POST'), unsentRequest.withBody(body), this.request])(
      `${this.repoURL}/src`,
    );
  };
}
