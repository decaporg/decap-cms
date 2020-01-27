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
  ImplementationFile as IF,
  DisplayURLObject as DUO,
  DisplayURL as DU,
  Credentials as Cred,
  User as U,
  Entry as E,
  PersistOptions as PO,
  AssetProxy as AP,
  entriesByFiles,
  entriesByFolder,
  unpublishedEntries,
  getMediaDisplayURL,
  getMediaAsBlob,
  runWithLock,
  Config as C,
  UnpublishedEntryMediaFile as UEMF,
} from './implementation';
import {
  readFile,
  CMS_BRANCH_PREFIX,
  generateContentKey,
  isCMSLabel,
  labelToStatus,
  statusToLabel,
  DEFAULT_PR_BODY,
  MERGE_COMMIT_MESSAGE,
  isPreviewContext,
  getPreviewStatus,
  PreviewState,
  FetchError as FE,
  parseContentKey,
  branchFromContentKey,
  contentKeyFromBranch,
  COMBINE_COLLECTIONS,
  COMBINE_SLUG,
  COMBINE_PR_TITLE,
  isCombineKey,
  isBinaryFile,
} from './API';
import {
  createPointerFile,
  getLargeMediaFilteredMediaFiles,
  getLargeMediaPatternsFromGitAttributesFile,
  parsePointerFile,
  getPointerFileForMediaFileObj,
  PointerFile as PF,
} from './git-lfs';

export type AsyncLock = AL;
export type Implementation = I;
export type ImplementationEntry = IE;
export type ImplementationMediaFile = IMF;
export type ImplementationFile = IF;
export type DisplayURL = DU;
export type DisplayURLObject = DUO;
export type Credentials = Cred;
export type User = U;
export type Entry = E;
export type UnpublishedEntryMediaFile = UEMF;
export type PersistOptions = PO;
export type AssetProxy = AP;
export type ApiRequest =
  | {
      url: string;
      params?: Record<string, string | boolean | number>;
      method?: 'POST' | 'PUT' | 'DELETE' | 'HEAD';
      headers?: Record<string, string>;
      body?: string | FormData;
      cache?: 'no-store';
    }
  | string;
export type Config = C;
export type FetchError = FE;
export type PointerFile = PF;

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
  CMS_BRANCH_PREFIX,
  generateContentKey,
  isCMSLabel,
  labelToStatus,
  statusToLabel,
  DEFAULT_PR_BODY,
  MERGE_COMMIT_MESSAGE,
  isPreviewContext,
  getPreviewStatus,
  runWithLock,
  PreviewState,
  parseContentKey,
  createPointerFile,
  getLargeMediaFilteredMediaFiles,
  getLargeMediaPatternsFromGitAttributesFile,
  parsePointerFile,
  getPointerFileForMediaFileObj,
  branchFromContentKey,
  contentKeyFromBranch,
  COMBINE_COLLECTIONS,
  COMBINE_SLUG,
  COMBINE_PR_TITLE,
  isCombineKey,
  isBinaryFile,
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
  CMS_BRANCH_PREFIX,
  generateContentKey,
  isCMSLabel,
  labelToStatus,
  statusToLabel,
  DEFAULT_PR_BODY,
  MERGE_COMMIT_MESSAGE,
  isPreviewContext,
  getPreviewStatus,
  runWithLock,
  PreviewState,
  parseContentKey,
  createPointerFile,
  getLargeMediaFilteredMediaFiles,
  getLargeMediaPatternsFromGitAttributesFile,
  parsePointerFile,
  getPointerFileForMediaFileObj,
  branchFromContentKey,
  contentKeyFromBranch,
  COMBINE_COLLECTIONS,
  COMBINE_SLUG,
  COMBINE_PR_TITLE,
  isCombineKey,
  isBinaryFile,
};
