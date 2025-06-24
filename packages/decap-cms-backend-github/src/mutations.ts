import { gql } from 'graphql-tag';

import * as fragments from './fragments';

// updateRef only works for branches at the moment
export const updateBranch = gql`
  mutation updateRef($input: UpdateRefInput!) {
    updateRef(input: $input) {
      branch: ref {
        ...BranchParts
      }
    }
  }
  ${fragments.branch}
`;

// deleteRef only works for branches at the moment
const deleteRefMutationPart = `
deleteRef(input: $deleteRefInput) {
  clientMutationId
}
`;
export const deleteBranch = gql`
  mutation deleteRef($deleteRefInput: DeleteRefInput!) {
    ${deleteRefMutationPart}
  }
`;

const closePullRequestMutationPart = `
closePullRequest(input: $closePullRequestInput) {
  clientMutationId
  pullRequest {
    ...PullRequestParts
  }
}
`;

export const closePullRequest = gql`
  mutation closePullRequestAndDeleteBranch($closePullRequestInput: ClosePullRequestInput!) {
    ${closePullRequestMutationPart}
  }
  ${fragments.pullRequest}
`;

export const closePullRequestAndDeleteBranch = gql`
  mutation closePullRequestAndDeleteBranch(
    $closePullRequestInput: ClosePullRequestInput!
    $deleteRefInput: DeleteRefInput!
  ) {
    ${closePullRequestMutationPart}
    ${deleteRefMutationPart}
  }
  ${fragments.pullRequest}
`;

const createPullRequestMutationPart = `
 createPullRequest(input: $createPullRequestInput) {
  clientMutationId
  pullRequest {
    ...PullRequestParts
  }
}
 `;

export const createPullRequest = gql`
  mutation createPullRequest($createPullRequestInput: CreatePullRequestInput!) {
    ${createPullRequestMutationPart}
  }
  ${fragments.pullRequest}
`;

export const createBranch = gql`
  mutation createBranch($createRefInput: CreateRefInput!) {
    createRef(input: $createRefInput) {
      branch: ref {
        ...BranchParts
      }
    }
  }
  ${fragments.branch}
`;

// createRef only works for branches at the moment
export const createBranchAndPullRequest = gql`
  mutation createBranchAndPullRequest(
    $createRefInput: CreateRefInput!
    $createPullRequestInput: CreatePullRequestInput!
  ) {
    createRef(input: $createRefInput) {
      branch: ref {
        ...BranchParts
      }
    }
    ${createPullRequestMutationPart}
  }
  ${fragments.branch}
  ${fragments.pullRequest}
`;

export const reopenPullRequest = gql`
  mutation reopenPullRequest($reopenPullRequestInput: ReopenPullRequestInput!) {
    reopenPullRequest(input: $reopenPullRequestInput) {
      clientMutationId
      pullRequest {
        ...PullRequestParts
      }
    }
  }
  ${fragments.pullRequest}
`;
