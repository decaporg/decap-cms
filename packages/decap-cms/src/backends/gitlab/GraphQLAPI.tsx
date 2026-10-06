import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';

import { rawContent } from '@/lib/backend/index';
import { unsentRequest } from '@/lib/util/index';
import API from './API';
import * as queries from './queries';

import type { BackendEntry, BackendFileRef } from '@/lib/backend/index';
import type { ApiRequest } from '@/lib/util/index';
import type { Config, FileEntry } from './API';

const NO_CACHE = 'no-cache';

function batch<T>(items: T[], maxPerBatch: number, action: (items: T[]) => void) {
  for (let index = 0; index < items.length; index = index + maxPerBatch) {
    const itemsSlice = items.slice(index, index + maxPerBatch);
    action(itemsSlice);
  }
}

export default class GraphQLAPI extends API {
  graphQLClient: ApolloClient;

  constructor(config: Config) {
    super(config);
    this.graphQLClient = this.getApolloClient();
  }

  getApolloClient() {
    const authLink = new SetContextLink(({ headers }) => {
      return {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...headers,
          authorization: this.token ? `Bearer ${this.token}` : '',
        },
      };
    });
    // Send GraphQL through the backend's request function when there is one,
    // so an expired PKCE token gets the same refresh-and-retry as REST calls.
    // That function sets the Authorization header itself, so drop the one
    // above: Apollo lowercases header names, and sending both would merge them
    // into a single invalid value.
    const requestFunction = this.requestFunction;
    const httpLink = new HttpLink({
      uri: this.graphQLAPIRoot,
      ...(requestFunction && {
        fetch: ((input: RequestInfo | URL, init?: RequestInit) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
          const headers = Object.fromEntries(
            Object.entries((init?.headers ?? {}) as Record<string, string>).filter(
              ([name]) => name.toLowerCase() !== 'authorization',
            ),
          );
          return requestFunction(unsentRequest.fromFetchArguments(url, { ...init, headers }) as ApiRequest);
        }) as typeof fetch,
      }),
    });
    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
      // don't append the extensions.clientLibrary telemetry blob to requests
      enhancedClientAwareness: { transport: false },
    });
  }

  reset() {
    return this.graphQLClient.resetStore();
  }

  listAllFilesGraphQL = async (path: string, recursive: boolean, branch: string) => {
    const files: FileEntry[] = [];
    let blobsPaths;
    let cursor;
    do {
      blobsPaths = await this.graphQLClient.query<any>({
        query: queries.files,
        variables: { repo: this.repo, branch, path, recursive, cursor },
        // mirrors the old client-wide defaultOptions; v4 gates typed
        // defaultOptions behind a module augmentation we don't want to ship
        fetchPolicy: NO_CACHE,
        errorPolicy: 'all',
      });
      files.push(...blobsPaths.data.project.repository.tree.blobs.nodes);
      cursor = blobsPaths.data.project.repository.tree.blobs.pageInfo.endCursor;
    } while (blobsPaths.data.project.repository.tree.blobs.pageInfo.hasNextPage);

    return files;
  };

  /**
   * Content and authorship come from two independent batched queries, and
   * neither response can be trusted to line up positionally with the files
   * that were asked for: GitLab omits blobs it cannot resolve, and a tree can
   * report a null `lastCommit`. Joining by array index therefore slides every
   * later file onto the previous one's content or author. Both halves are
   * keyed by path instead, which is what actually identifies a file.
   */
  readFilesGraphQL = async (files: BackendFileRef[]) => {
    const paths = files.map(({ path }) => path);

    type BlobResult = {
      project: { repository: { blobs: { nodes: { id: string, path: string, data: string }[] } } },
    };

    const blobPromises: Promise<ApolloClient.QueryResult<BlobResult>>[] = [];
    batch(paths, 90, slice => {
      blobPromises.push(
        this.graphQLClient.query<BlobResult>({
          query: queries.blobs,
          variables: {
            repo: this.repo,
            branch: this.branch,
            paths: slice,
          },
          fetchPolicy: 'cache-first',
          errorPolicy: 'all',
        }),
      );
    });

    type LastCommit = {
      id: string,
      authoredDate: string,
      authorName: string,
      author?: {
        name: string,
        username: string,
        publicEmail: string,
      },
    };

    type CommitResult = {
      project: {
        repository: Record<string, { lastCommit: LastCommit | null } | null>,
      },
    };

    // `lastCommits` aliases one `tree<n>` field per path in the slice, so the
    // slice is what maps an alias back to its path. Keep them together rather
    // than reading the response in object-key order.
    const commitBatches: {
      paths: string[],
      response: Promise<ApolloClient.QueryResult<CommitResult>>,
    }[] = [];
    batch(paths, 8, slice => {
      commitBatches.push({
        paths: slice,
        response: this.graphQLClient.query<CommitResult>({
          query: queries.lastCommits(slice),
          variables: {
            repo: this.repo,
            branch: this.branch,
          },
          fetchPolicy: 'cache-first',
          errorPolicy: 'all',
        }),
      });
    });

    const [blobsResults, commitsResults] = await Promise.all([
      Promise.all(blobPromises),
      Promise.all(commitBatches.map(({ response }) => response)),
    ]);

    const blobsByPath = new Map<string, string>();
    for (const result of blobsResults) {
      for (const node of result.data?.project?.repository?.blobs?.nodes ?? []) {
        blobsByPath.set(node.path, node.data);
      }
    }

    const metadataByPath = new Map<string, Partial<BackendEntry['file']>>();
    commitBatches.forEach(({ paths: batchPaths }, batchIndex) => {
      const repository = commitsResults[batchIndex]?.data?.project?.repository;
      batchPaths.forEach((path, index) => {
        const lastCommit = repository?.[`tree${index}`]?.lastCommit;
        if (!lastCommit) {
          return;
        }
        const { author, authoredDate, authorName } = lastCommit;
        const name = author?.name || author?.username || author?.publicEmail || authorName;
        metadataByPath.set(path, {
          // A commit GitLab can name nobody for yields no author at all, rather
          // than one whose name is blank: absent is what the seam says for
          // "the backend didn't attest to this".
          ...(name
            ? {
              author: {
                name,
                // GitLab usernames are stable, display names are not.
                ...(author?.username ? { id: author.username } : {}),
              },
            }
            : {}),
          updatedOn: authoredDate,
        });
      });
    });

    const filesWithData: BackendEntry[] = files.map(file => {
      const data = blobsByPath.get(file.path);
      if (data === undefined) {
        console.warn(`GitLab returned no blob for '${file.path}'; treating it as empty`);
      }
      return {
        file: {
          path: file.path,
          ...(file.id === undefined ? {} : { id: file.id }),
          ...metadataByPath.get(file.path),
        },
        content: rawContent(data ?? ''),
      };
    });
    return filesWithData;
  };

  listAllFiles = async (path: string, recursive = false, branch = this.branch) => {
    return this.listAllFilesGraphQL(path, recursive, branch);
  };
}
