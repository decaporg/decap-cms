import { gql } from 'graphql-tag';
import { oneLine } from 'common-tags';

export const files = gql`
  query files($repo: ID!, $branch: String!, $path: String!, $recursive: Boolean!, $cursor: String) {
    project(fullPath: $repo) {
      repository {
        tree(ref: $branch, path: $path, recursive: $recursive) {
          blobs(after: $cursor) {
            nodes {
              type
              id: sha
              path
              name
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    }
  }
`;

export const blobs = gql`
  query blobs($repo: ID!, $branch: String!, $paths: [String!]!) {
    project(fullPath: $repo) {
      repository {
        blobs(ref: $branch, paths: $paths) {
          nodes {
            id
            data: rawBlob
          }
        }
      }
    }
  }
`;

export function lastCommits(paths: string[]) {
  const tree = paths
    .map(
      (path, index) => oneLine`
    tree${index}: tree(ref: $branch, path: "${path}") {
      lastCommit {
        authorName
        authoredDate
        author {
          id
          username
          name
          publicEmail
        }
      }
    }
  `,
    )
    .join('\n');

  const query = gql`
  query lastCommits($repo: ID!, $branch: String!) {
    project(fullPath: $repo) {
      repository {
        ${tree}
      }
    }
  }
`;

  return query;
}
