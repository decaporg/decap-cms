import { ApolloClient, QueryOptions, MutationOptions, OperationVariables } from 'apollo-client';
import {
  InMemoryCache,
  defaultDataIdFromObject,
  IntrospectionFragmentMatcher,
  NormalizedCacheObject,
} from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import {
  APIError,
  EditorialWorkflowError,
  readFile,
  localForage,
  DEFAULT_PR_BODY,
} from 'netlify-cms-lib-util';
import introspectionQueryResultData from './fragmentTypes';
import API, { Config, BlobArgs, PR, API_NAME } from './API';
import * as queries from './queries';
import * as mutations from './mutations';
import { GraphQLError } from 'graphql';

const NO_CACHE = 'no-cache';
const CACHE_FIRST = 'cache-first';

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData,
});

interface TreeEntry {
  object?: {
    entries: TreeEntry[];
  };
  type: 'blob' | 'tree';
  name: string;
  sha: string;
  blob?: {
    size: number;
  };
}

interface TreeFile {
  path: string;
  id: string;
  size: number;
  type: string;
  name: string;
}

type Error = GraphQLError & { type: string };

export default class GraphQLAPI extends API {
  repoOwner: string;
  repoName: string;
  originRepoOwner: string;
  originRepoName: string;
  client: ApolloClient<NormalizedCacheObject>;

  constructor(config: Config) {
    super(config);

    const [repoParts, originRepoParts] = [this.repo.split('/'), this.originRepo.split('/')];
    this.repoOwner = repoParts[0];
    this.repoName = repoParts[1];

    this.originRepoOwner = originRepoParts[0];
    this.originRepoName = originRepoParts[1];

    this.client = this.getApolloClient();
  }

  getApolloClient() {
    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...headers,
          authorization: this.token ? `token ${this.token}` : '',
        },
      };
    });
    const httpLink = createHttpLink({ uri: `${this.apiRoot}/graphql` });
    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache({ fragmentMatcher }),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: NO_CACHE,
          errorPolicy: 'ignore',
        },
        query: {
          fetchPolicy: NO_CACHE,
          errorPolicy: 'all',
        },
      },
    });
  }

  reset() {
    return this.client.resetStore();
  }

  async getRepository(owner: string, name: string) {
    const { data } = await this.query({
      query: queries.repository,
      variables: { owner, name },
      fetchPolicy: CACHE_FIRST, // repository id doesn't change
    });
    return data.repository;
  }

  query(options: QueryOptions<OperationVariables>) {
    return this.client.query(options).catch(error => {
      throw new APIError(error.message, 500, 'GitHub');
    });
  }

  mutate(options: MutationOptions<OperationVariables>) {
    return this.client.mutate(options).catch(error => {
      throw new APIError(error.message, 500, 'GitHub');
    });
  }

  async hasWriteAccess() {
    const { repoOwner: owner, repoName: name } = this;
    try {
      const { data } = await this.query({
        query: queries.repoPermission,
        variables: { owner, name },
        fetchPolicy: CACHE_FIRST, // we can assume permission doesn't change often
      });
      // https://developer.github.com/v4/enum/repositorypermission/
      const { viewerPermission } = data.repository;
      return ['ADMIN', 'MAINTAIN', 'WRITE'].includes(viewerPermission);
    } catch (error) {
      console.error('Problem fetching repo data from GitHub');
      throw error;
    }
  }

  async user() {
    const { data } = await this.query({
      query: queries.user,
      fetchPolicy: CACHE_FIRST, // we can assume user details don't change often
    });
    return data.viewer;
  }

  async retrieveBlobObject(owner: string, name: string, expression: string, options = {}) {
    const { data } = await this.query({
      query: queries.blob,
      variables: { owner, name, expression },
      ...options,
    });
    // https://developer.github.com/v4/object/blob/
    if (data.repository.object) {
      const { is_binary: isBinary, text } = data.repository.object;
      return { isNull: false, isBinary, text };
    } else {
      return { isNull: true };
    }
  }

  getOwnerAndNameFromRepoUrl(repoURL: string) {
    let { repoOwner: owner, repoName: name } = this;

    if (repoURL === this.originRepoURL) {
      ({ originRepoOwner: owner, originRepoName: name } = this);
    }

    return { owner, name };
  }

  async readFile(
    path: string,
    sha?: string | null,
    {
      branch = this.branch,
      repoURL = this.repoURL,
      parseText = true,
    }: {
      branch?: string;
      repoURL?: string;
      parseText?: boolean;
    } = {},
  ) {
    if (!sha) {
      sha = await this.getFileSha(path, { repoURL, branch });
    }
    const fetchContent = () => this.fetchBlobContent({ sha: sha as string, repoURL, parseText });
    const content = await readFile(sha, fetchContent, localForage, parseText);
    return content;
  }

  async fetchBlobContent({ sha, repoURL, parseText }: BlobArgs) {
    if (!parseText) {
      return super.fetchBlobContent({ sha, repoURL, parseText });
    }
    const { owner, name } = this.getOwnerAndNameFromRepoUrl(repoURL);
    const { isNull, isBinary, text } = await this.retrieveBlobObject(
      owner,
      name,
      sha,
      { fetchPolicy: CACHE_FIRST }, // blob sha is derived from file content
    );

    if (isNull) {
      throw new APIError('Not Found', 404, 'GitHub');
    } else if (!isBinary) {
      return text;
    } else {
      return super.fetchBlobContent({ sha, repoURL, parseText });
    }
  }

  async getStatuses(sha: string) {
    const { originRepoOwner: owner, originRepoName: name } = this;
    const { data } = await this.query({ query: queries.statues, variables: { owner, name, sha } });
    if (data.repository.object) {
      const { status } = data.repository.object;
      const { contexts } = status || { contexts: [] };
      return contexts;
    } else {
      return [];
    }
  }

  getAllFiles(entries: TreeEntry[], path: string) {
    const allFiles: TreeFile[] = entries.reduce((acc, item) => {
      if (item.type === 'tree') {
        const entries = item.object?.entries || [];
        return [...acc, ...this.getAllFiles(entries, `${path}/${item.name}`)];
      } else if (item.type === 'blob') {
        return [
          ...acc,
          {
            name: item.name,
            type: item.type,
            id: item.sha,
            path: `${path}/${item.name}`,
            size: item.blob ? item.blob.size : 0,
          },
        ];
      }

      return acc;
    }, [] as TreeFile[]);
    return allFiles;
  }

  async listFiles(path: string, { repoURL = this.repoURL, branch = this.branch, depth = 1 } = {}) {
    const { owner, name } = this.getOwnerAndNameFromRepoUrl(repoURL);
    const { data } = await this.query({
      query: queries.files(depth),
      variables: { owner, name, expression: `${branch}:${path}` },
    });

    if (data.repository.object) {
      const allFiles = this.getAllFiles(data.repository.object.entries, path);
      return allFiles;
    } else {
      return [];
    }
  }

  async listUnpublishedBranches() {
    if (this.useOpenAuthoring) {
      return super.listUnpublishedBranches();
    }
    console.log(
      '%c Checking for Unpublished entries',
      'line-height: 30px;text-align: center;font-weight: bold',
    );
    const { repoOwner: owner, repoName: name } = this;
    const { data } = await this.query({
      query: queries.unpublishedPrBranches,
      variables: { owner, name },
    });
    const { nodes } = data.repository.refs as {
      nodes: {
        associatedPullRequests: { nodes: { headRef: { prefix: string; name: string } }[] };
      }[];
    };
    if (nodes.length > 0) {
      const branches = [] as { ref: string }[];
      nodes.forEach(({ associatedPullRequests }) => {
        associatedPullRequests.nodes.forEach(({ headRef }) => {
          branches.push({ ref: `${headRef.prefix}${headRef.name}` });
        });
      });

      return await Promise.all(branches.map(branch => this.migrateBranch(branch)));
    } else {
      console.log(
        '%c No Unpublished entries',
        'line-height: 30px;text-align: center;font-weight: bold',
      );
      throw new APIError('Not Found', 404, 'GitHub');
    }
  }

  async readUnpublishedBranchFile(contentKey: string) {
    // retrieveMetadata(contentKey) rejects in case of no metadata
    const metaData = await this.retrieveMetadata(contentKey).catch(() => null);
    if (metaData && metaData.objects && metaData.objects.entry && metaData.objects.entry.path) {
      const { path } = metaData.objects.entry;
      const { repoOwner: headOwner, repoName: headRepoName } = this;
      const { originRepoOwner: baseOwner, originRepoName: baseRepoName } = this;

      const { data } = await this.query({
        query: queries.unpublishedBranchFile,
        variables: {
          headOwner,
          headRepoName,
          headExpression: `${metaData.branch}:${path}`,
          baseOwner,
          baseRepoName,
          baseExpression: `${this.branch}:${path}`,
        },
      });
      if (!data.head.object) {
        throw new EditorialWorkflowError('content is not under editorial workflow', true);
      }
      const result = {
        metaData,
        fileData: data.head.object.text,
        isModification: !!data.base.object,
        slug: this.slugFromContentKey(contentKey, metaData.collection),
      };
      return result;
    } else {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }
  }

  getBranchQualifiedName(branch: string) {
    return `refs/heads/${branch}`;
  }

  getBranchQuery(branch: string, owner: string, name: string) {
    return {
      query: queries.branch,
      variables: {
        owner,
        name,
        qualifiedName: this.getBranchQualifiedName(branch),
      },
    };
  }

  async getDefaultBranch() {
    const { data } = await this.query({
      ...this.getBranchQuery(this.branch, this.originRepoOwner, this.originRepoName),
    });
    return data.repository.branch;
  }

  async getBranch(branch: string) {
    const { data } = await this.query({
      ...this.getBranchQuery(branch, this.repoOwner, this.repoName),
      fetchPolicy: CACHE_FIRST,
    });
    return data.repository.branch;
  }

  async patchRef(type: string, name: string, sha: string, opts: { force?: boolean } = {}) {
    if (type !== 'heads') {
      return super.patchRef(type, name, sha, opts);
    }

    const force = opts.force || false;

    const branch = await this.getBranch(name);
    const { data } = await this.mutate({
      mutation: mutations.updateBranch,
      variables: {
        input: { oid: sha, refId: branch.id, force },
      },
    });
    return data!.updateRef.branch;
  }

  async deleteBranch(branchName: string) {
    const branch = await this.getBranch(branchName);
    const { data } = await this.mutate({
      mutation: mutations.deleteBranch,
      variables: {
        deleteRefInput: { refId: branch.id },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: (store: any) => store.data.delete(defaultDataIdFromObject(branch)),
    });

    return data!.deleteRef;
  }

  getPullRequestQuery(number: number) {
    const { originRepoOwner: owner, originRepoName: name } = this;

    return {
      query: queries.pullRequest,
      variables: { owner, name, number },
    };
  }

  async getPullRequest(number: number) {
    const { data } = await this.query({
      ...this.getPullRequestQuery(number),
      fetchPolicy: CACHE_FIRST,
    });

    // https://developer.github.com/v4/enum/pullrequeststate/
    // GraphQL state: [CLOSED, MERGED, OPEN]
    // REST API state: [closed, open]
    const state = data.repository.pullRequest.state === 'OPEN' ? 'open' : 'closed';
    return {
      ...data.repository.pullRequest,
      state,
    };
  }

  getPullRequestAndBranchQuery(branch: string, number: number) {
    const { repoOwner: owner, repoName: name } = this;
    const { originRepoOwner, originRepoName } = this;

    return {
      query: queries.pullRequestAndBranch,
      variables: {
        owner,
        name,
        originRepoOwner,
        originRepoName,
        number,
        qualifiedName: this.getBranchQualifiedName(branch),
      },
    };
  }

  async getPullRequestAndBranch(branch: string, number: number) {
    const { data } = await this.query({
      ...this.getPullRequestAndBranchQuery(branch, number),
      fetchPolicy: CACHE_FIRST,
    });

    const { repository, origin } = data;
    return { branch: repository.branch, pullRequest: origin.pullRequest };
  }

  async openPR({ number }: PR) {
    const pullRequest = await this.getPullRequest(number);

    const { data } = await this.mutate({
      mutation: mutations.reopenPullRequest,
      variables: {
        reopenPullRequestInput: { pullRequestId: pullRequest.id },
      },
      update: (store, { data: mutationResult }) => {
        const { pullRequest } = mutationResult!.reopenPullRequest;
        const pullRequestData = { repository: { ...pullRequest.repository, pullRequest } };

        store.writeQuery({
          ...this.getPullRequestQuery(pullRequest.number),
          data: pullRequestData,
        });
      },
    });

    return data!.closePullRequest;
  }

  async closePR({ number }: PR) {
    const pullRequest = await this.getPullRequest(number);

    const { data } = await this.mutate({
      mutation: mutations.closePullRequest,
      variables: {
        closePullRequestInput: { pullRequestId: pullRequest.id },
      },
      update: (store, { data: mutationResult }) => {
        const { pullRequest } = mutationResult!.closePullRequest;
        const pullRequestData = { repository: { ...pullRequest.repository, pullRequest } };

        store.writeQuery({
          ...this.getPullRequestQuery(pullRequest.number),
          data: pullRequestData,
        });
      },
    });

    return data!.closePullRequest;
  }

  async deleteUnpublishedEntry(collectionName: string, slug: string) {
    try {
      const contentKey = this.generateContentKey(collectionName, slug);
      const branchName = this.generateBranchName(contentKey);

      const metadata = await this.retrieveMetadata(contentKey);
      if (metadata && metadata.pr) {
        const { branch, pullRequest } = await this.getPullRequestAndBranch(
          branchName,
          metadata.pr.number,
        );

        const { data } = await this.mutate({
          mutation: mutations.closePullRequestAndDeleteBranch,
          variables: {
            deleteRefInput: { refId: branch.id },
            closePullRequestInput: { pullRequestId: pullRequest.id },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          update: (store: any) => {
            store.data.delete(defaultDataIdFromObject(branch));
            store.data.delete(defaultDataIdFromObject(pullRequest));
          },
        });

        return data!.closePullRequest;
      } else {
        return await this.deleteBranch(branchName);
      }
    } catch (e) {
      const { graphQLErrors } = e;
      if (graphQLErrors && graphQLErrors.length > 0) {
        const branchNotFound = graphQLErrors.some((e: Error) => e.type === 'NOT_FOUND');
        if (branchNotFound) {
          return;
        }
      }
      throw e;
    }
  }

  async createPR(title: string, head: string) {
    const [repository, headReference] = await Promise.all([
      this.getRepository(this.originRepoOwner, this.originRepoName),
      this.useOpenAuthoring ? `${(await this.user()).login}:${head}` : head,
    ]);
    const { data } = await this.mutate({
      mutation: mutations.createPullRequest,
      variables: {
        createPullRequestInput: {
          baseRefName: this.branch,
          body: DEFAULT_PR_BODY,
          title,
          headRefName: headReference,
          repositoryId: repository.id,
        },
      },
      update: (store, { data: mutationResult }) => {
        const { pullRequest } = mutationResult!.createPullRequest;
        const pullRequestData = { repository: { ...pullRequest.repository, pullRequest } };

        store.writeQuery({
          ...this.getPullRequestQuery(pullRequest.number),
          data: pullRequestData,
        });
      },
    });
    const { pullRequest } = data!.createPullRequest;
    return { ...pullRequest, head: { sha: pullRequest.headRefOid } };
  }

  async createBranch(branchName: string, sha: string) {
    const owner = this.repoOwner;
    const name = this.repoName;
    const repository = await this.getRepository(owner, name);
    const { data } = await this.mutate({
      mutation: mutations.createBranch,
      variables: {
        createRefInput: {
          name: this.getBranchQualifiedName(branchName),
          oid: sha,
          repositoryId: repository.id,
        },
      },
      update: (store, { data: mutationResult }) => {
        const { branch } = mutationResult!.createRef;
        const branchData = { repository: { ...branch.repository, branch } };

        store.writeQuery({
          ...this.getBranchQuery(branchName, owner, name),
          data: branchData,
        });
      },
    });
    const { branch } = data!.createRef;
    return { ...branch, ref: `${branch.prefix}${branch.name}` };
  }

  async createBranchAndPullRequest(branchName: string, sha: string, title: string) {
    const owner = this.originRepoOwner;
    const name = this.originRepoName;
    const repository = await this.getRepository(owner, name);
    const { data } = await this.mutate({
      mutation: mutations.createBranchAndPullRequest,
      variables: {
        createRefInput: {
          name: this.getBranchQualifiedName(branchName),
          oid: sha,
          repositoryId: repository.id,
        },
        createPullRequestInput: {
          baseRefName: this.branch,
          body: DEFAULT_PR_BODY,
          title,
          headRefName: branchName,
          repositoryId: repository.id,
        },
      },
      update: (store, { data: mutationResult }) => {
        const { branch } = mutationResult!.createRef;
        const { pullRequest } = mutationResult!.createPullRequest;
        const branchData = { repository: { ...branch.repository, branch } };
        const pullRequestData = {
          repository: { ...pullRequest.repository, branch },
          origin: { ...pullRequest.repository, pullRequest },
        };

        store.writeQuery({
          ...this.getBranchQuery(branchName, owner, name),
          data: branchData,
        });

        store.writeQuery({
          ...this.getPullRequestAndBranchQuery(branchName, pullRequest.number),
          data: pullRequestData,
        });
      },
    });
    const { pullRequest } = data!.createPullRequest;
    return { ...pullRequest, head: { sha: pullRequest.headRefOid } };
  }

  async getFileSha(path: string, { repoURL = this.repoURL, branch = this.branch } = {}) {
    const { owner, name } = this.getOwnerAndNameFromRepoUrl(repoURL);
    const { data } = await this.query({
      query: queries.fileSha,
      variables: { owner, name, expression: `${branch}:${path}` },
    });

    if (data.repository.file) {
      return data.repository.file.sha;
    }
    throw new APIError('Not Found', 404, API_NAME);
  }
}
