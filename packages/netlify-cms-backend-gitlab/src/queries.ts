import { gql } from 'graphql-tag';

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
            data: rawBlob
          }
        }
      }
    }
  }
`;
