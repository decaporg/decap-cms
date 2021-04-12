# Backend Gitlab

This is `gitlab REST-API` file manager.

## Has `Api`, `Backend` and `AuthenticationPage`.

`Api` - wrapper for gitlab `REST-API`.

`AuthenticationPage` is component for [lib-auth](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-auth/README.md) login by:
- gitlab
- netlify
- or custom gitlab endpoint, from `config.backend`.

`Backend` is domain-specific file manager based on `Api`.

Look at tests or types for more info.

## What `domain-specific file manager` mean?

Look at [lib-util](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-util/README.md) for interface description.
