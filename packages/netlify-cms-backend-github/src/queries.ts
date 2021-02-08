import gql from 'graphql-tag';
import { oneLine } from 'common-tags';
import * as fragments from './fragments';

export const repoPermission = gql`
  query repoPermission($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      ...RepositoryParts
      viewerPermission
    }
  }
  ${fragments.repository}
`;

export const user = gql`
  query {
    viewer {
      id
      avatar_url: avatarUrl
      name
      login
    }
  }
`;

export const blob = gql`
  query blob($owner: String!, $name: String!, $expression: String!) {
    repository(owner: $owner, name: $name) {
      ...RepositoryParts
      object(expression: $expression) {
        ... on Blob {
          ...BlobWithTextParts
        }
      }
    }
  }
  ${fragments.repository}
  ${fragments.blobWithText}
`;

export const statues = gql`
  query statues($owner: String!, $name: String!, $sha: GitObjectID!) {
    repository(owner: $owner, name: $name) {
      ...RepositoryParts
      object(oid: $sha) {
        ...ObjectParts
        ... on Commit {
          status {
            id
            contexts {
              id
              context
              state
              target_url: targetUrl
            }
          }
        }
      }
    }
  }
  ${fragments.repository}
  ${fragments.object}
`;

function buildFilesQuery(depth = 1) {
  const PLACE_HOLDER = 'PLACE_HOLDER';
  let query = oneLine`
    ...ObjectParts
    ... on Tree {
      entries {
        ...FileEntryParts
        ${PLACE_HOLDER}
      }
    }
  `;

  for (let i = 0; i < depth - 1; i++) {
    query = query.replace(
      PLACE_HOLDER,
      oneLine`
        object {
          ... on Tree {
            entries {
              ...FileEntryParts
              ${PLACE_HOLDER}
            }
          }
        }
    `,
    );
  }

  query = query.replace(PLACE_HOLDER, '');

  return query;
}

export function files(depth: number) {
  return gql`
    query files($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        ...RepositoryParts
        object(expression: $expression) {
          ${buildFilesQuery(depth)}
        }
      }
    }
    ${fragments.repository}
    ${fragments.object}
    ${fragments.fileEntry}
  `;
}

const branchQueryPart = `
branch: ref(qualifiedName: $qualifiedName) {
  ...BranchParts
}
`;

export const branch = gql`
  query branch($owner: String!, $name: String!, $qualifiedName: String!) {
    repository(owner: $owner, name: $name) {
      ...RepositoryParts
      ${branchQueryPart}
    }
  }
  ${fragments.repository}
  ${fragments.branch}
`;

export const openAuthoringBranches = gql`
  query openAuthoringBranches($owner: String!, $name: String!, $refPrefix: String!) {
    repository(owner: $owner, name: $name) {
      ...RepositoryParts
      refs(refPrefix: $refPrefix, last: 100) {
        nodes {
          ...BranchParts
        }
      }
    }
  }
  ${fragments.repository}
  ${fragments.branch}
`;

export const repository = gql`
  query repository($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      ...RepositoryParts
    }
  }
  ${fragments.repository}
`;

const pullRequestQueryPart = `
pullRequest(number: $number) {
  ...PullRequestParts
}
`;

export const pullRequest = gql`
  query pullRequest($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      id
      ${pullRequestQueryPart}
    }
  }
  ${fragments.pullRequest}
`;

export const pullRequests = gql`
  query pullRequests($owner: String!, $name: String!, $head: String, $states: [PullRequestState!]) {
    repository(owner: $owner, name: $name) {
      id
      pullRequests(last: 100, headRefName: $head, states: $states) {
        nodes {
          ...PullRequestParts
        }
      }
    }
  }
  ${fragments.pullRequest}
`;

export const pullRequestAndBranch = gql`
  query pullRequestAndBranch($owner: String!, $name: String!, $originRepoOwner: String!, $originRepoName: String!, $qualifiedName: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      ...RepositoryParts
      ${branchQueryPart}
    }
    origin: repository(owner: $originRepoOwner, name: $originRepoName) {
      ...RepositoryParts
      ${pullRequestQueryPart}
    }
  }
  ${fragments.repository}
  ${fragments.branch}
  ${fragments.pullRequest}
`;

export const fileSha = gql`
  query fileSha($owner: String!, $name: String!, $expression: String!) {
    repository(owner: $owner, name: $name) {
      ...RepositoryParts
      file: object(expression: $expression) {
        ...ObjectParts
      }
    }
  }
  ${fragments.repository}
  ${fragments.object}
`;
