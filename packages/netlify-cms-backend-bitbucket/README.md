# Bitbucket backend

An abstraction layer between the CMS and [Bitbucket](https://docs.microsoft.com/en-us/rest/api/azure/devops/git/)

## Code structure

`Implementation` for [File Management System API](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-util/README.md) based on `Api` and `LargeMedia(LFS)`. With [Editorial Workflow](https://www.netlifycms.org/docs/beta-features/#gitlab-and-bitbucket-editorial-workflow-support) uses pull requests comments to track unpublished entries statuses.

`Api` - A wrapper for Bitbucket REST API.

`AuthenticationPage` - A component uses [lib-auth](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-auth/README.md) and facilitates authentication flows for:
- bitbucket
- netlify
- or custom bitbucket endpoint, from `config.backend`.

Look at tests or types for more info.
