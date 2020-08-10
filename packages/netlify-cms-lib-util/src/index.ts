import APIError from './APIError';
import Cursor, { CURSOR_COMPATIBILITY_SYMBOL } from './Cursor';
import EditorialWorkflowError, { EDITORIAL_WORKFLOW_ERROR } from './EditorialWorkflowError';
import AccessTokenError from './AccessTokenError';
import localForage from './localForage';
import { isAbsolutePath, basename, fileExtensionWithSeparator, fileExtension } from './path';
import { onlySuccessfulPromises, flowAsync, then } from './promise';
import unsentRequest from './unsentRequest';
import {
  filterByExtension,
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
  UnpublishedEntryDiff as UED,
  UnpublishedEntry as UE,
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
  blobToFileObj,
  allEntriesByFolder,
  DataFile as DF,
} from './implementation';
import {
  readFile,
  readFileMetadata,
  isPreviewContext,
  getPreviewStatus,
  PreviewState,
  FetchError as FE,
  ApiRequest as AR,
  requestWithBackoff,
  throwOnConflictingBranches,
} from './API';
import {
  CMS_BRANCH_PREFIX,
  generateContentKey,
  isCMSLabel,
  labelToStatus,
  statusToLabel,
  DEFAULT_PR_BODY,
  MERGE_COMMIT_MESSAGE,
  parseContentKey,
  branchFromContentKey,
  contentKeyFromBranch,
} from './APIUtils';
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
export type UnpublishedEntryDiff = UED;
export type UnpublishedEntry = UE;
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
export type ApiRequest = AR;
export type Config = C;
export type FetchError = FE;
export type PointerFile = PF;
export type DataFile = DF;

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
  filterByExtension,
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
  readFileMetadata,
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
  blobToFileObj,
  requestWithBackoff,
  allEntriesByFolder,
  AccessTokenError,
  throwOnConflictingBranches,
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
  filterByExtension,
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
  readFileMetadata,
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
  blobToFileObj,
  requestWithBackoff,
  allEntriesByFolder,
  AccessTokenError,
  throwOnConflictingBranches,
};
