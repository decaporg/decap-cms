# Bitbucket backend

An abstraction layer between the CMS and [Bitbucket](https://docs.microsoft.com/en-us/rest/api/azure/devops/git/)

## Code structure

`Implementation` for [File Management System API](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-util/README.md) based on `Api` and `LargeMedia(LFS)`. With [Editorial Workflow](https://www.decapcms.org/docs/beta-features/#gitlab-and-bitbucket-editorial-workflow-support) uses pull requests comments to track unpublished entries statuses.

`Api` - A wrapper for Bitbucket REST API.

`AuthenticationPage` - uses [lib-auth](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-auth/README.md) to facilitate OAuth and implicit authentication.

Look at tests or types for more info.
