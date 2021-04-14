# Github backend

An abstraction layer between the CMS and [Github](https://docs.github.com/en/rest)

## Code structure

`Implementation` for [File Management System API](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-util/README.md) based on `Api`.

`Api` - A wrapper for Github REST API.

`GraphQLApi` - `Api` with `ApolloClient`. [Api docs](https://docs.github.com/en/graphql) and [netlify docs](https://www.netlifycms.org/docs/beta-features/#github-graphql-api).

`AuthenticationPage` -  A component uses [lib-auth](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-auth/README.md) and facilitates authentication flows for:
- netlify
- or fork repo.

`Scripts` create `src/fragmentTypes.js` by fetch Github graphql schema.

Look at tests or types for more info.
