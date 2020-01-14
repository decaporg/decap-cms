import gql from 'graphql-tag';

export const repository = gql`
  fragment RepositoryParts on Repository {
    id
  }
`;

export const blobWithText = gql`
  fragment BlobWithTextParts on Blob {
    id
    text
    is_binary: isBinary
  }
`;

export const object = gql`
  fragment ObjectParts on GitObject {
    id
    sha: oid
  }
`;

export const branch = gql`
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

export const pullRequest = gql`
  fragment PullRequestParts on PullRequest {
    id
    baseRefName
    body
    headRefName
    headRefOid
    number
    state
    title
    merged_at: mergedAt
    repository {
      ...RepositoryParts
    }
  }
  ${repository}
`;

export const treeEntry = gql`
  fragment TreeEntryParts on TreeEntry {
    path: name
    sha: oid
    type
    mode
  }
`;

export const fileEntry = gql`
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
