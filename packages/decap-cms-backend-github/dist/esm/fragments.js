"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.treeEntry = exports.repository = exports.pullRequest = exports.object = exports.fileEntry = exports.branch = exports.blobWithText = void 0;
var _graphqlTag = require("graphql-tag");
const repository = (0, _graphqlTag.gql)`
  fragment RepositoryParts on Repository {
    id
    isFork
  }
`;
exports.repository = repository;
const blobWithText = (0, _graphqlTag.gql)`
  fragment BlobWithTextParts on Blob {
    id
    text
    is_binary: isBinary
  }
`;
exports.blobWithText = blobWithText;
const object = (0, _graphqlTag.gql)`
  fragment ObjectParts on GitObject {
    id
    sha: oid
  }
`;
exports.object = object;
const branch = (0, _graphqlTag.gql)`
  fragment BranchParts on Ref {
    commit: target {
      ...ObjectParts
    }
    id
    name
    prefix
    repository {
      ...RepositoryParts
    }
  }
  ${object}
  ${repository}
`;
exports.branch = branch;
const pullRequest = (0, _graphqlTag.gql)`
  fragment PullRequestParts on PullRequest {
    id
    baseRefName
    baseRefOid
    body
    headRefName
    headRefOid
    number
    state
    title
    merged_at: mergedAt
    updated_at: updatedAt
    user: author {
      login
      ... on User {
        name
      }
    }
    repository {
      ...RepositoryParts
    }
    labels(last: 100) {
      nodes {
        name
      }
    }
  }
  ${repository}
`;
exports.pullRequest = pullRequest;
const treeEntry = (0, _graphqlTag.gql)`
  fragment TreeEntryParts on TreeEntry {
    path: name
    sha: oid
    type
    mode
  }
`;
exports.treeEntry = treeEntry;
const fileEntry = (0, _graphqlTag.gql)`
  fragment FileEntryParts on TreeEntry {
    name
    sha: oid
    type
    blob: object {
      ... on Blob {
        size: byteSize
      }
    }
  }
`;
exports.fileEntry = fileEntry;