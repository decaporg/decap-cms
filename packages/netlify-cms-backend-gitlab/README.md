# GitLab backend

An abstraction layer between the CMS and [GitLab](https://docs.gitlab.com/ee/api/README.html)

## Code structure

`Implementation` for [File Management System API](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-util/README.md) based on `Api`. With [Editorial Workflow](https://www.netlifycms.org/docs/beta-features/#gitlab-and-bitbucket-editorial-workflow-support) uses merge requests labels to track unpublished entries statuses.

`Api` - A wrapper for GitLab REST API.

`AuthenticationPage` - A component uses [lib-auth](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-auth/README.md) to facilitate OAuth, PKCE and implicit authentication.

Look at tests or types for more info.
