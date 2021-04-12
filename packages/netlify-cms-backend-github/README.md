# Backend Github

This is `github graphql` file manager.

## Has `scripts`, `Api`, `GraphQLApi`, `Backend` and `AuthenticationPage`.

`Api` - wrapper for github `REST-API`.

`GraphQLApi` - `Api` with `ApolloClient`.

`Scripts` create `src/fragmentTypes.js` by fetch github graphql schema.

`AuthenticationPage` is component for [lib-auth](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-auth/README.md) login by:
- netlify
- or fork repo.

`Backend` is domain-specific file manager based on `Api`.

Look at tests or types for more info.

## What `domain-specific file manager` mean?

Look at [lib-util](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-util/README.md) for interface description.
