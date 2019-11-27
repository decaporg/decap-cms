import { ApolloClient } from 'apollo-client';
import {
  InMemoryCache,
  defaultDataIdFromObject,
  IntrospectionFragmentMatcher,
} from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { APIError, EditorialWorkflowError } from 'netlify-cms-lib-util';
import introspectionQueryResultData from './fragmentTypes';
import API from './API';
import * as queries from './queries';
import * as mutations from './mutations';

const NO_CACHE = 'no-cache';
const CACHE_FIRST = 'cache-first';

const TREE_ENTRY_TYPE_TO_MODE = {
  blob: '100644',
  tree: '040000',
  commit: '160000',
};

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData,
});

export default class GraphQLAPI extends API {
  constructor(config) {
    super(config);

    const [repoParts, originRepoParts] = [this.repo.split('/'), this.originRepo.split('/')];
    this.repo_owner = repoParts[0];
    this.repo_name = repoParts[1];

    this.origin_repo_owner = originRepoParts[0];
    this.origin_repo_name = originRepoParts[1];

    this.client = this.getApolloClient();
  }

  getApolloClient() {
    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          authorization: this.token ? `token ${this.token}` : '',
        },
      };
    });
    const httpLink = createHttpLink({ uri: `${this.api_root}/graphql` });
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

  async getRepository(owner, name) {
    const { data } = await this.query({
      query: queries.repository,
      variables: { owner, name },
      fetchPolicy: CACHE_FIRST, // repository id doesn't change
    });
    return data.repository;
  }

  query(options = {}) {
    return this.client.query(options).catch(error => {
      throw new APIError(error.message, 500, 'GitHub');
    });
  }

  mutate(options = {}) {
    return this.client.mutate(options).catch(error => {
      throw new APIError(error.message, 500, 'GitHub');
    });
  }

  async hasWriteAccess() {
    const { repo_owner: owner, repo_name: name } = this;
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

  async retrieveBlobObject(owner, name, expression, options = {}) {
    const { data } = await this.query({
      query: queries.blob,
      variables: { owner, name, expression },
      ...options,
    });
    // https://developer.github.com/v4/object/blob/
    if (data.repository.object) {
      const { is_binary, text } = data.repository.object;
      return { is_null: false, is_binary, text };
    } else {
      return { is_null: true };
    }
  }

  getOwnerAndNameFromRepoUrl(repoURL) {
    let { repo_owner: owner, repo_name: name } = this;

    if (repoURL === this.originRepoURL) {
      ({ origin_repo_owner: owner, origin_repo_name: name } = this);
    }

    return { owner, name };
  }

  async retrieveContent(path, branch, repoURL) {
    const { owner, name } = this.getOwnerAndNameFromRepoUrl(repoURL);
    const { is_null, is_binary, text } = await this.retrieveBlobObject(
      owner,
      name,
      `${branch}:${path}`,
    );
    if (is_null) {
      throw new APIError('Not Found', 404, 'GitHub');
    } else if (!is_binary) {
      return text;
    } else {
      return super.retrieveContent(path, branch, repoURL);
    }
  }

  async fetchBlobContent(sha, repoURL) {
    const { owner, name } = this.getOwnerAndNameFromRepoUrl(repoURL);
    const { is_null, is_binary, text } = await this.retrieveBlobObject(
      owner,
      name,
      sha,
      { fetchPolicy: CACHE_FIRST }, // blob sha is derived from file content
    );

    if (is_null) {
      throw new APIError('Not Found', 404, 'GitHub');
    } else if (!is_binary) {
      return text;
    } else {
      return super.fetchBlobContent(sha, repoURL);
    }
  }

  async getStatuses(sha) {
    const { origin_repo_owner: owner, origin_repo_name: name } = this;
    const { data } = await this.query({ query: queries.statues, variables: { owner, name, sha } });
    if (data.repository.object) {
      const { status } = data.repository.object;
      const { contexts } = status || { contexts: [] };
      return contexts;
    } else {
      return [];
    }
  }

  getAllFiles(entries, path) {
    const allFiles = entries.reduce((acc, item) => {
      if (item.type === 'tree') {
        return [...acc, ...this.getAllFiles(item.object.entries, `${path}/${item.name}`)];
      } else if (item.type === 'blob') {
        return [
          ...acc,
          {
            ...item,
            path: `${path}/${item.name}`,
            size: item.blob && item.blob.size,
          },
        ];
      }

      return acc;
    }, []);
    return allFiles;
  }

  async listFiles(path, { repoURL = this.repoURL, branch = this.branch } = {}) {
    const { owner, name } = this.getOwnerAndNameFromRepoUrl(repoURL);
    const { data } = await this.query({
      query: queries.files,
      variables: { owner, name, expression: `${branch}:${path}` },
    });

    if (data.repository.object) {
      const allFiles = this.getAllFiles(data.repository.object.entries, path);
      return allFiles;
    } else {
      throw new APIError('Not Found', 404, 'GitHub');
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
    const { repo_owner: owner, repo_name: name } = this;
    const { data } = await this.query({
      query: queries.unpublishedPrBranches,
      variables: { owner, name },
    });
    const { nodes } = data.repository.refs;
    if (nodes.length > 0) {
      const branches = [];
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

  async readUnpublishedBranchFile(contentKey) {
    // retrieveMetadata(contentKey) rejects in case of no metadata
    const metaData = await this.retrieveMetadata(contentKey).catch(() => null);
    if (metaData && metaData.objects && metaData.objects.entry && metaData.objects.entry.path) {
      const { path } = metaData.objects.entry;
      const { repo_owner: headOwner, repo_name: headRepoName } = this;
      const { origin_repo_owner: baseOwner, origin_repo_name: baseRepoName } = this;

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
      };
      return result;
    } else {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }
  }

  getBranchQualifiedName(branch) {
    return `refs/heads/${branch}`;
  }

  getBranchQuery(branch) {
    const { repo_owner: owner, repo_name: name } = this;

    return {
      query: queries.branch,
      variables: {
        owner,
        name,
        qualifiedName: this.getBranchQualifiedName(branch),
      },
    };
  }

  async getBranch(branch = this.branch) {
    // don't cache base branch to always get the latest data
    const fetchPolicy = branch === this.branch ? NO_CACHE : CACHE_FIRST;
    const { data } = await this.query({
      ...this.getBranchQuery(branch),
      fetchPolicy,
    });
    return data.repository.branch;
  }

  async patchRef(type, name, sha, opts = {}) {
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
    return data.updateRef.branch;
  }

  async deleteBranch(branchName) {
    const branch = await this.getBranch(branchName);
    const { data } = await this.mutate({
      mutation: mutations.deleteBranch,
      variables: {
        deleteRefInput: { refId: branch.id },
      },
      update: store => store.data.delete(defaultDataIdFromObject(branch)),
    });

    return data.deleteRef;
  }

  getPullRequestQuery(number) {
    const { origin_repo_owner: owner, origin_repo_name: name } = this;

    return {
      query: queries.pullRequest,
      variables: { owner, name, number },
    };
  }

  async getPullRequest(number) {
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

  getPullRequestAndBranchQuery(branch, number) {
    const { repo_owner: owner, repo_name: name } = this;
    const { origin_repo_owner: origin_owner, origin_repo_name: origin_name } = this;

    return {
      query: queries.pullRequestAndBranch,
      variables: {
        owner,
        name,
        origin_owner,
        origin_name,
        number,
        qualifiedName: this.getBranchQualifiedName(branch),
      },
    };
  }

  async getPullRequestAndBranch(branch, number) {
    const { data } = await this.query({
      ...this.getPullRequestAndBranchQuery(branch, number),
      fetchPolicy: CACHE_FIRST,
    });

    const { repository, origin } = data;
    return { branch: repository.branch, pullRequest: origin.pullRequest };
  }

  async openPR({ number }) {
    const pullRequest = await this.getPullRequest(number);

    const { data } = await this.mutate({
      mutation: mutations.reopenPullRequest,
      variables: {
        reopenPullRequestInput: { pullRequestId: pullRequest.id },
      },
      update: (store, { data: mutationResult }) => {
        const { pullRequest } = mutationResult.reopenPullRequest;
        const pullRequestData = { repository: { ...pullRequest.repository, pullRequest } };

        store.writeQuery({
          ...this.getPullRequestQuery(pullRequest.number),
          data: pullRequestData,
        });
      },
    });

    return data.closePullRequest;
  }

  async closePR({ number }) {
    const pullRequest = await this.getPullRequest(number);

    const { data } = await this.mutate({
      mutation: mutations.closePullRequest,
      variables: {
        closePullRequestInput: { pullRequestId: pullRequest.id },
      },
      update: (store, { data: mutationResult }) => {
        const { pullRequest } = mutationResult.closePullRequest;
        const pullRequestData = { repository: { ...pullRequest.repository, pullRequest } };

        store.writeQuery({
          ...this.getPullRequestQuery(pullRequest.number),
          data: pullRequestData,
        });
      },
    });

    return data.closePullRequest;
  }

  async deleteUnpublishedEntry(collectionName, slug) {
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
          update: store => {
            store.data.delete(defaultDataIdFromObject(branch));
            store.data.delete(defaultDataIdFromObject(pullRequest));
          },
        });

        return data.closePullRequest;
      } else {
        return await this.deleteBranch(branchName);
      }
    } catch (e) {
      const { graphQLErrors } = e;
      if (graphQLErrors && graphQLErrors.length > 0) {
        const branchNotFound = graphQLErrors.some(e => e.type === 'NOT_FOUND');
        if (branchNotFound) {
          return;
        }
      }
      throw e;
    }
  }

  async createPR(title, head) {
    const [repository, headReference] = await Promise.all([
      this.getRepository(this.origin_repo_owner, this.origin_repo_name),
      this.useOpenAuthoring ? `${(await this.user()).login}:${head}` : head,
    ]);
    const { data } = await this.mutate({
      mutation: mutations.createPullRequest,
      variables: {
        createPullRequestInput: {
          baseRefName: this.branch,
          body: API.DEFAULT_PR_BODY,
          title,
          headRefName: headReference,
          repositoryId: repository.id,
        },
      },
      update: (store, { data: mutationResult }) => {
        const { pullRequest } = mutationResult.createPullRequest;
        const pullRequestData = { repository: { ...pullRequest.repository, pullRequest } };

        store.writeQuery({
          ...this.getPullRequestQuery(pullRequest.number),
          data: pullRequestData,
        });
      },
    });
    const { pullRequest } = data.createPullRequest;
    return { ...pullRequest, head: { sha: pullRequest.headRefOid } };
  }

  async createBranch(branchName, sha) {
    const repository = await this.getRepository(this.repo_owner, this.repo_name);
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
        const { branch } = mutationResult.createRef;
        const branchData = { repository: { ...branch.repository, branch } };

        store.writeQuery({
          ...this.getBranchQuery(branchName),
          data: branchData,
        });
      },
    });
    const { branch } = data.createRef;
    return { ...branch, ref: `${branch.prefix}${branch.name}` };
  }

  async createBranchAndPullRequest(branchName, sha, title) {
    const repository = await this.getRepository(this.origin_repo_owner, this.origin_repo_name);
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
          body: API.DEFAULT_PR_BODY,
          title,
          headRefName: branchName,
          repositoryId: repository.id,
        },
      },
      update: (store, { data: mutationResult }) => {
        const { branch } = mutationResult.createRef;
        const { pullRequest } = mutationResult.createPullRequest;
        const branchData = { repository: { ...branch.repository, branch } };
        const pullRequestData = {
          repository: { ...pullRequest.repository, branch },
          origin: { ...pullRequest.repository, pullRequest },
        };

        store.writeQuery({
          ...this.getBranchQuery(branchName),
          data: branchData,
        });

        store.writeQuery({
          ...this.getPullRequestAndBranchQuery(branchName, pullRequest.number),
          data: pullRequestData,
        });
      },
    });
    const { pullRequest } = data.createPullRequest;
    return { ...pullRequest, head: { sha: pullRequest.headRefOid } };
  }

  async getTree(sha) {
    if (!sha) {
      return Promise.resolve({ tree: [] });
    }

    const { repo_owner: owner, repo_name: name } = this;
    const variables = {
      owner,
      name,
      sha,
    };

    // sha can be either for a commit or a tree
    const [commitTree, tree] = await Promise.all([
      this.client.query({
        query: queries.commitTree,
        variables,
        fetchPolicy: CACHE_FIRST,
      }),
      this.client.query({
        query: queries.tree,
        variables,
        fetchPolicy: CACHE_FIRST,
      }),
    ]);

    let entries = null;

    if (commitTree.data.repository.commit.tree) {
      ({ entries, sha } = commitTree.data.repository.commit.tree);
    }

    if (tree.data.repository.tree.entries) {
      ({ entries, sha } = tree.data.repository.tree);
    }

    if (entries) {
      return { sha, tree: entries.map(e => ({ ...e, mode: TREE_ENTRY_TYPE_TO_MODE[e.type] })) };
    }

    return Promise.reject('Could not get tree');
  }

  async getPullRequestCommits(number) {
    const { origin_repo_owner: owner, origin_repo_name: name } = this;
    const { data } = await this.query({
      query: queries.pullRequestCommits,
      variables: { owner, name, number },
    });
    const { nodes } = data.repository.pullRequest.commits;
    const commits = nodes.map(n => ({ ...n.commit, parents: n.commit.parents.nodes }));

    return commits;
  }

  async getFileSha(path, branch) {
    const { repo_owner: owner, repo_name: name } = this;
    const { data } = await this.query({
      query: queries.fileSha,
      variables: { owner, name, expression: `${branch}:${path}` },
    });

    return data.repository.file.sha;
  }
}
