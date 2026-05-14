# GitHub backend

An abstraction layer between the CMS and [GitHub](https://docs.github.com/en/rest)

## Code structure

`Implementation` for [File Management System API](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-util/README.md) based on `Api`.

`Api` - A wrapper for GitHub REST API.

`GraphQLApi` - `Api` with `ApolloClient`. [Api docs](https://docs.github.com/en/graphql) and [netlify docs](https://www.decapcms.org/docs/beta-features/#github-graphql-api).

`AuthenticationPage` -  uses [lib-auth](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-auth/README.md) to facilitate OAuth and implicit authentication.

`scripts` -  use `createFragmentTypes.js` to create GitHub GraphQL API fragment types.

Look at tests or types for more info.
