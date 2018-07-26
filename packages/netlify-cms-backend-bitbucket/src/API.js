import { flow, has } from "lodash";
import {
  localForage,
  unsentRequest,
  responseParser,
  then,
  basename,
  Cursor,
  APIError
} from "netlify-cms-lib-util";

export default class API {
  constructor(config) {
    this.api_root = config.api_root || "https://api.bitbucket.org/2.0";
    this.branch = config.branch || "master";
    this.repo = config.repo || "";
    this.requestFunction = config.requestFunction || unsentRequest.performRequest;
    // Allow overriding this.hasWriteAccess
    this.hasWriteAccess = config.hasWriteAccess || this.hasWriteAccess;
    this.repoURL = this.repo ? `/repositories/${ this.repo }` : "";
  }

  buildRequest = req => flow([
    unsentRequest.withRoot(this.api_root),
    unsentRequest.withTimestamp,
  ])(req);

  request = req => flow([
    this.buildRequest,
    this.requestFunction,
    p => p.catch(err => Promise.reject(new APIError(err.message, null, "BitBucket"))),
  ])(req);

  requestJSON = req => flow([
    unsentRequest.withDefaultHeaders({ "Content-Type": "application/json" }),
    this.request,
    then(responseParser({ format: "json" })),
    p => p.catch(err => Promise.reject(new APIError(err.message, null, "BitBucket"))),
  ])(req);
  requestText = req => flow([
    unsentRequest.withDefaultHeaders({ "Content-Type": "text/plain" }),
    this.request,
    then(responseParser({ format: "text" })),
    p => p.catch(err => Promise.reject(new APIError(err.message, null, "BitBucket"))),
  ])(req);

  user = () => this.request("/user");
  hasWriteAccess = user => this.request(this.repoURL).then(res => res.ok);

  isFile = ({ type }) => type === "commit_file";
  processFile = file => ({
    ...file,
    name: basename(file.path),
    download_url: file.links.self.href,

    // BitBucket does not return file SHAs, but it does give us the
    // commit SHA. Since the commit SHA will change if any files do,
    // we can construct an ID using the commit SHA and the file path
    // that will help with caching (though not as well as a normal
    // SHA, since it will change even if the individual file itself
    // doesn't.)
    ...(file.commit && file.commit.hash
        ? { id: `${ file.commit.hash }/${ file.path }` }
        : {}),
  });
  processFiles = files => files.filter(this.isFile).map(this.processFile);

  readFile = async (path, sha, { ref = this.branch, parseText = true } = {}) => {
    const cacheKey = parseText ? `bb.${ sha }` : `bb.${ sha }.blob`;
    const cachedFile = sha ? await localForage.getItem(cacheKey) : null;
    if (cachedFile) { return cachedFile; }
    const result = await this.request({
      url: `${ this.repoURL }/src/${ ref }/${ path }`,
      cache: "no-store",
    }).then(parseText ? responseParser({ format: "text" }) : responseParser({ format: "blob" }));
    if (sha) { localForage.setItem(cacheKey, result); }
    return result;
  }

  getEntriesAndCursor = jsonResponse => {
    const { size: count, page: index, pagelen: pageSize, next, previous: prev, values: entries } = jsonResponse;
    const pageCount = (pageSize && count) ? Math.ceil(count / pageSize) : undefined;
    return {
      entries,
      cursor: Cursor.create({
        actions: [...(next ? ["next"] : []), ...(prev ? ["prev"] : [])],
        meta: { index, count, pageSize, pageCount },
        data: { links: { next, prev } },
      }),
    };
  }

  listFiles = async path => {
    const { entries, cursor } = await flow([
      // sort files by filename ascending
      unsentRequest.withParams({ sort: "-path" }),
      this.requestJSON,
      then(this.getEntriesAndCursor),
    ])(`${ this.repoURL }/src/${ this.branch }/${ path }`);
    return { entries: this.processFiles(entries), cursor };
  }

  traverseCursor = async (cursor, action) => flow([
    this.requestJSON,
    then(this.getEntriesAndCursor),
    then(({ cursor: newCursor, entries }) => ({ cursor: newCursor, entries: this.processFiles(entries) })),
  ])(cursor.data.getIn(["links", action]));

  listAllFiles = async path => {
    const { cursor: initialCursor, entries: initialEntries } = await this.listFiles(path);
    const entries = [...initialEntries];
    let currentCursor = initialCursor;
    while (currentCursor && currentCursor.actions.has("next")) {
      const { cursor: newCursor, entries: newEntries } = await this.traverseCursor(currentCursor, "next");
      entries.push(...newEntries);
      currentCursor = newCursor;
    }
    return this.processFiles(entries);
  };

  uploadBlob = async item => {
    const contentBase64 = await (has(item, 'toBase64') ? item.toBase64() : Promise.resolve(item.raw));
    const formData = new FormData();
    formData.append(item.path, contentBase64);

    return flow([
      unsentRequest.withMethod("POST"),
      unsentRequest.withBody(formData),
      this.request,
      then(() => ({ ...item, uploaded: true })),
    ])(`${ this.repoURL }/src`);
  };

  persistFiles = (files, { commitMessage, newEntry }) => Promise.all(
    files.filter(({ uploaded }) => !uploaded).map(this.uploadBlob)
  );

  deleteFile = (path, message, options={}) => {
    const branch = options.branch || this.branch;
    const body = new FormData();
    body.append('files', path);
    if (message && message !== "") {
      body.append("message", message);
    }
    return flow([
      unsentRequest.withMethod("POST"),
      unsentRequest.withBody(body),
      this.request,
    ])(`${ this.repoURL }/src`);
  };
}
