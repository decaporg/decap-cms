"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.files = exports.blobs = void 0;
exports.lastCommits = lastCommits;
var _graphqlTag = require("graphql-tag");
var _commonTags = require("common-tags");
const files = (0, _graphqlTag.gql)`
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
exports.files = files;
const blobs = (0, _graphqlTag.gql)`
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
exports.blobs = blobs;
function lastCommits(paths) {
  const tree = paths.map((path, index) => (0, _commonTags.oneLine)`
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
  `).join('\n');
  const query = (0, _graphqlTag.gql)`
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