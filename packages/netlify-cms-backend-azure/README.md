# Azure backend

An abstraction layer between the CMS and [Azure DevOps](https://docs.microsoft.com/en-us/rest/api/azure/devops/git/)

## Code structure

`Implementation` for [File Management System API](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-util/README.md) based on `Api`.

`Api` - A wrapper for Azure REST API.

`AuthenticationPage` - A component facilitates Azure authentication flow. Uses [lib-auth](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-auth/README.md).

Look at tests or types for more info.
