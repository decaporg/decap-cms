import APIError from './APIError';
import Cursor, { CURSOR_COMPATIBILITY_SYMBOL } from './Cursor';
import EditorialWorkflowError, { EDITORIAL_WORKFLOW_ERROR } from './EditorialWorkflowError';
import localForage from './localForage';
import { isAbsolutePath, basename, fileExtensionWithSeparator, fileExtension } from './path';
import { onlySuccessfulPromises, flowAsync, then } from './promise';
import unsentRequest from './unsentRequest';
import {
  filterByPropExtension,
  getAllResponses,
  parseLinkHeader,
  parseResponse,
  responseParser,
  getPathDepth,
} from './backendUtil';
import loadScript from './loadScript';
import getBlobSHA from './getBlobSHA';
import { asyncLock, AsyncLock as AL } from './asyncLock';
import {
  Implementation as I,
  ImplementationEntry as IE,
  ImplementationMediaFile as IMF,
  DisplayURLObject as DUO,
  DisplayURL as DU,
  Credentials as Cred,
  User as U,
  Entry as E,
  PersistOptions as PO,
  AssetProxy as AP,
  Collection as Col,
  entriesByFiles,
  entriesByFolder,
  unpublishedEntries,
  getMediaDisplayURL,
  getMediaAsBlob,
} from './implementation';
import { readFile } from './API';

export type AsyncLock = AL;
export type Implementation = I;
export type ImplementationEntry = IE;
export type ImplementationMediaFile = IMF;
export type DisplayURL = DU;
export type DisplayURLObject = DUO;
export type Credentials = Cred;
export type User = U;
export type Entry = E;
export type PersistOptions = PO;
export type AssetProxy = AP;
export type Collection = Col;
export type ApiRequest =
  | {
      url: string;
      params?: Record<string, string | boolean | number>;
      method?: 'POST';
      headers?: Record<string, string>;
      body?: string | FormData;
      cache?: 'no-store';
    }
  | string;

export const NetlifyCmsLibUtil = {
  APIError,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  EditorialWorkflowError,
  EDITORIAL_WORKFLOW_ERROR,
  localForage,
  basename,
  fileExtensionWithSeparator,
  fileExtension,
  onlySuccessfulPromises,
  flowAsync,
  then,
  unsentRequest,
  filterByPropExtension,
  parseLinkHeader,
  parseResponse,
  responseParser,
  loadScript,
  getBlobSHA,
  getPathDepth,
  entriesByFiles,
  entriesByFolder,
  unpublishedEntries,
  getMediaDisplayURL,
  getMediaAsBlob,
  readFile,
};
export {
  APIError,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  EditorialWorkflowError,
  EDITORIAL_WORKFLOW_ERROR,
  localForage,
  basename,
  fileExtensionWithSeparator,
  fileExtension,
  onlySuccessfulPromises,
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
  isAbsolutePath,
  getPathDepth,
  entriesByFiles,
  entriesByFolder,
  unpublishedEntries,
  getMediaDisplayURL,
  getMediaAsBlob,
  readFile,
};
