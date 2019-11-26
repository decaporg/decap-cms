import APIError from './APIError';
import Cursor, { CURSOR_COMPATIBILITY_SYMBOL } from './Cursor';
import EditorialWorkflowError, { EDITORIAL_WORKFLOW_ERROR } from './EditorialWorkflowError';
import localForage from './localForage';
import {
  resolvePath,
  resolveMediaFilename,
  basename,
  fileExtensionWithSeparator,
  fileExtension,
} from './path';
import {
  filterPromises,
  filterPromisesWith,
  onlySuccessfulPromises,
  resolvePromiseProperties,
  flowAsync,
  then,
} from './promise';
import unsentRequest from './unsentRequest';
import {
  filterByPropExtension,
  getAllResponses,
  parseLinkHeader,
  parseResponse,
  responseParser,
} from './backendUtil';
import loadScript from './loadScript';
import getBlobSHA from './getBlobSHA';
import { asyncLock } from './asyncLock';

export const NetlifyCmsLibUtil = {
  APIError,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  EditorialWorkflowError,
  EDITORIAL_WORKFLOW_ERROR,
  localForage,
  resolvePath,
  resolveMediaFilename,
  basename,
  fileExtensionWithSeparator,
  fileExtension,
  filterPromises,
  filterPromisesWith,
  onlySuccessfulPromises,
  resolvePromiseProperties,
  flowAsync,
  then,
  unsentRequest,
  filterByPropExtension,
  parseLinkHeader,
  parseResponse,
  responseParser,
  loadScript,
  getBlobSHA,
};
export {
  APIError,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  EditorialWorkflowError,
  EDITORIAL_WORKFLOW_ERROR,
  localForage,
  resolvePath,
  resolveMediaFilename,
  basename,
  fileExtensionWithSeparator,
  fileExtension,
  filterPromises,
  filterPromisesWith,
  onlySuccessfulPromises,
  resolvePromiseProperties,
  flowAsync,
  then,
  unsentRequest,
  filterByPropExtension,
  parseLinkHeader,
  getAllResponses,
  parseResponse,
  responseParser,
  loadScript,
  getBlobSHA,
  asyncLock,
};
