import LocalForage from "Lib/LocalForage";
import { Base64 } from "js-base64";
import { fromJS, List, Map } from "immutable";
import { cond, flow, isString, partial, partialRight, pick, omit, set, update } from "lodash";
import unsentRequest from "Lib/unsentRequest";
import { then } from "Lib/promiseHelper";
import AssetProxy from "ValueObjects/AssetProxy";
import { APIError } from "ValueObjects/errors";
import Cursor from "ValueObjects/Cursor"

export default class API {
  constructor(config) {
    this.api_root = config.api_root || "https://gitlab.com/api/v4";
    this.token = config.token || false;
    this.branch = config.branch || "master";
    this.repo = config.repo || "";
    this.repoURL = `/projects/${ encodeURIComponent(this.repo) }`;
  }

  withAuthorizationHeaders = req =>
    unsentRequest.withHeaders(this.token ? { Authorization: `Bearer ${ this.token }` } : {}, req);

  buildRequest = req => flow([
    unsentRequest.withRoot(this.api_root),
    this.withAuthorizationHeaders,
    unsentRequest.withTimestamp,
  ])(req);

  request = async req => flow([
    this.buildRequest,
    unsentRequest.performRequest,
    p => p.catch(err => Promise.reject(new APIError(err.message, null, "GitLab"))),
  ])(req);

  parseResponse = async (res, { expectingOk=true, expectingFormat=false }) => {
    const contentType = res.headers.get("Content-Type");
    const isJSON = contentType === "application/json";
    let body;
    try {
      body = await ((expectingFormat === "json" || isJSON) ? res.json() : res.text());
    } catch (err) {
      throw new APIError(err.message, res.status, "GitLab");
    }
    if (expectingOk && !res.ok) {
      throw new APIError((isJSON && body.message) ? body.message : body, res.status, "GitLab");
    }
    return body;
  };

  responseToJSON = res => this.parseResponse(res, { expectingFormat: "json" });
  responseToText = res => this.parseResponse(res, { expectingFormat: "text" });
  requestJSON = req => this.request(req).then(this.responseToJSON);
  requestText = req => this.request(req).then(this.responseToText);

  user = () => this.requestJSON("/user");

  WRITE_ACCESS = 30;
  hasWriteAccess = user => this.requestJSON(this.repoURL).then(({ permissions }) => {
    const { project_access, group_access } = permissions;
    if (project_access && (project_access.access_level >= this.WRITE_ACCESS)) {
      return true;
    }
    if (group_access && (group_access.access_level >= this.WRITE_ACCESS)) {
      return true;
    }
    return false;
  });

  readFile = async (path, sha, ref=this.branch) => {
    const cachedFile = sha ? await LocalForage.getItem(`gl.${ sha }`) : null;
    if (cachedFile) { return cachedFile; }
    const result = await this.requestText({
      url: `${ this.repoURL }/repository/files/${ encodeURIComponent(path) }/raw`,
      params: { ref },
      cache: "no-store",
    });
    if (sha) { LocalForage.setItem(`gl.${ sha }`, result) }
    return result;
  };

  fileDownloadURL = (path, ref=this.branch) => unsentRequest.toURL(this.buildRequest({
    url: `${ this.repoURL }/repository/files/${ encodeURIComponent(path) }/raw`,
    params: { ref },
  }));

  getCursorFromHeaders = headers => {
    // indices and page counts are assumed to be zero-based, but the
    // indices and page counts returned from GitLab are one-based
    const index = parseInt(headers.get("X-Page"), 10) - 1;
    const pageCount = parseInt(headers.get("X-Total-Pages"), 10) - 1;
    const pageSize = parseInt(headers.get("X-Per-Page"), 10);
    const count = parseInt(headers.get("X-Total"), 10);
    const linksRaw = headers.get("Link");
    const links = List(linksRaw.split(","))
      .map(str => str.trim().split(";"))
      .map(([linkStr, keyStr]) => [
        keyStr.match(/rel="(.*?)"/)[1],
        unsentRequest.fromURL(linkStr.trim().match(/<(.*?)>/)[1]),
      ])
      .update(list => Map(list));
    const actions = links.keySeq().flatMap(key => (
      (key === "prev" && index > 0) ||
      (key === "next" && index < pageCount) ||
      (key === "first" && index > 0) ||
      (key === "last" && index < pageCount)
    ) ? [key] : []);
    return Cursor.create({
      actions,
      meta: { index, count, pageSize, pageCount },
      data: { links },
    });
  };

  getCursor = ({ headers }) => this.getCursorFromHeaders(headers);

  // Gets a cursor without retrieving the entries by using a HEAD
  // request
  fetchCursor = req => flow([unsentRequest.withMethod("HEAD"), this.request, then(this.getCursor)])(req);
  fetchCursorAndEntries = req => flow([
    unsentRequest.withMethod("GET"),
    this.request,
    p => Promise.all([p.then(this.getCursor), p.then(this.responseToJSON)]),
    then(([cursor, entries]) => ({ cursor, entries })),
  ])(req);
  fetchRelativeCursor = async (cursor, action) => this.fetchCursor(cursor.data.links[action]);

  reversableActions = Map({
    first: "last",
    last: "first",
    next: "prev",
    prev: "next",
  });

  reverseCursor = cursor => {
    const pageCount = cursor.meta.get("pageCount", 0);
    const currentIndex = cursor.meta.get("index", 0);
    const newIndex = pageCount - currentIndex;

    const links = cursor.data.get("links", Map());
    const reversedLinks = links.mapEntries(([k, v]) => [this.reversableActions.get(k) || k, v]);

    const reversedActions = cursor.actions.map(action => this.reversableActions.get(action) || action);

    return cursor.updateStore(store => store
      .setIn(["meta", "index"], newIndex)
      .setIn(["data", "links"], reversedLinks)
      .set("actions", reversedActions));
  };

  // The exported listFiles and traverseCursor reverse the direction
  // of the cursors, since GitLab's pagination sorts the opposite way
  // we want to sort by default (it sorts by filename _descending_,
  // while the CMS defaults to sorting by filename _ascending_, at
  // least in the current GitHub backend). This should eventually be
  // refactored.
  listFiles = async path => {
    const firstPageCursor = await this.fetchCursor({
      url: `${ this.repoURL }/repository/tree`,
      params: { path, ref: this.branch },
    });
    const lastPageLink = firstPageCursor.data.getIn(["links", "last"]);
    const { entries, cursor } = await this.fetchCursorAndEntries(lastPageLink);
    return { files: entries.filter(({ type }) => type === "blob").reverse(), cursor: this.reverseCursor(cursor) };
  };

  traverseCursor = async (cursor, action) => {
    const link = cursor.data.getIn(["links", action]);
    const { entries, cursor: newCursor } = await this.fetchCursorAndEntries(link);
    return { entries: entries.reverse(), cursor: this.reverseCursor(newCursor) };
  };

  listAllFiles = async path => {
    const entries = [];
    let { cursor, entries: initialEntries } = await this.fetchCursorAndEntries({
      url: `${ this.repoURL }/repository/tree`,
      // Get the maximum number of entries per page
      params: { path, ref: this.branch, per_page: 100 },
    });
    entries.push(...initialEntries);
    while (cursor && cursor.actions.has("next")) {
      const link = cursor.data.getIn(["links", "next"]);
      const { cursor: newCursor, entries: newEntries } = await this.fetchCursorAndEntries(link);
      entries.push(...newEntries);
      cursor = newCursor;
    }
    return entries.filter(({ type }) => type === "blob");
  };

  toBase64 = str => Promise.resolve(Base64.encode(str));
  fromBase64 = str => Base64.decode(str);
  uploadAndCommit = async (item, { commitMessage, updateFile = false, branch = this.branch, author = this.commitAuthor }) => {
    const content = await (item instanceof AssetProxy ? item.toBase64() : this.toBase64(item.raw));
    const file_path = item.path.replace(/^\//, "");
    const action = (updateFile ? "update" : "create");
    const encoding = "base64";
    const { name: author_name, email: author_email } = pick(author || {}, ["name", "email"]);
    const body = JSON.stringify({
      branch,
      commit_message: commitMessage,
      actions: [{ action, file_path, content, encoding }],
    });

    await this.request({
      url: `${ this.repoURL }/repository/commits`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    return { ...item, uploaded: true };
  };

  persistFiles = (files, { commitMessage, newEntry }) =>
    Promise.all(files.map(file => this.uploadAndCommit(file, { commitMessage, updateFile: newEntry === false })));

  deleteFile = (path, commit_message, options = {}) => {
    const branch = options.branch || this.branch;
    return flow([
      unsentRequest.withMethod("DELETE"),
      unsentRequest.withParams({ commit_message, branch }),
      this.request,
    ])(`${ this.repoURL }/repository/files/${ encodeURIComponent(path) }`);
  };
}
