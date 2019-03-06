import APIError from './APIError';
import Cursor, { CURSOR_COMPATIBILITY_SYMBOL } from './Cursor';
import EditorialWorkflowError, { EDITORIAL_WORKFLOW_ERROR } from './EditorialWorkflowError';
import localForage from './localForage';
import { resolvePath, basename, fileExtensionWithSeparator, fileExtension } from './path';
import { filterPromises, resolvePromiseProperties, then } from './promise';
import unsentRequest from './unsentRequest';
import { filterByPropExtension, parseResponse, responseParser } from './backendUtil';
import loadScript from './loadScript';
import getBlobSHA from './getBlobSHA';

export const NetlifyCmsLibUtil = {
  APIError,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  EditorialWorkflowError,
  EDITORIAL_WORKFLOW_ERROR,
  localForage,
  resolvePath,
  basename,
  fileExtensionWithSeparator,
  fileExtension,
  filterPromises,
  resolvePromiseProperties,
  then,
  unsentRequest,
  filterByPropExtension,
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
  basename,
  fileExtensionWithSeparator,
  fileExtension,
  filterPromises,
  resolvePromiseProperties,
  then,
  unsentRequest,
  filterByPropExtension,
  parseResponse,
  responseParser,
  loadScript,
  getBlobSHA,
};
