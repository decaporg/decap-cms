import isArray from "lodash/isArray";
import isEqual from "lodash/isEqual";

/*
  Cursors are POJOs with a few requirements:

  - They _must_ have an `actions` list. (It may be empty, but it must
    be present).

  - They _may_ include a `meta` key, which _is_ usable by the core
    code. This may contain `index` and `pageSize`, which should both
    be numbers.

    `meta` is for user-visible information that is _not_ guaranteed to
    exist. It should not be required or used to implement pagination
    functionality, only for optional display. It _may_ be used by the
    core code, but an empty or absent `meta` object _must not_ prevent
    pagination actions from working.

  - They _may_ include a value at the `data` key, which _must_ be
    serializable using JSON.stringify and JSON.parse (we may want to
    allow other types that we know how to serialize, such as
    Immutable.js `Map`s, in the future)

    `data` is for data used by the backend to implement pagination. It
    _must not_ be used directly by code receiving the cursor, and
    should be considered opaque by any code except the backend that
    created it.

  - They _must not_ include any further keys.
*/

const isSerializable = v => isEqual(v, JSON.parse(JSON.stringify(v)));
const validKeys = ({ required=[], optional=[] }, obj) =>
  obj &&
  required.every(key => !!obj[key]) &&
  Object.keys(obj).every(key => required.includes(key) || optional.includes(key));

export const validateCursor = cursor =>
  isSerializable(cursor) &&
  validKeys({ required: ["actions"], optional: ["data", "meta"] }, cursor) &&
  isArray(cursor.actions) &&
  (!cursor.meta || validKeys({ optional: ["index", "count", "pageSize", "pageCount"] }, cursor.meta));

export const invalidCursorError = cursor => new Error("Invalid cursor returned!");

// This is a temporary hack to allow cursors to be added to the
// interface between backend.js and backends without modifying old
// backends at all. This should be removed in favor of wrapping old
// backends with a compatibility layer, as part of the backend API
// refactor.
export const CURSOR_COMPATIBILITY_SYMBOL = Symbol("cursor key for compatibility with old backends");
