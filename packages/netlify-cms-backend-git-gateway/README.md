# Git gateway

This is `all git backends with Netlify` file manager.

## Has `Api`, `Backend` and `AuthenticationPage`.

`Api` and `Backend` from backend-[github](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/README.md)/[gitlab](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-gitlab/README.md)/[bitbacket](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-bitbacket/README.md) extended with Netlify-specific `LargeMedia(LFS)` and `JWT` auth.

`Backend` is domain-specific file manager based on `Api`.

`AuthenticationPage` is component for login by:
- `window.netlifyIdentity`
- or [GoTrue](https://github.com/netlify/gotrue-js) with `config.backend.identity_url` from `Backend`.

Look at tests or types for more info.

## What `domain-specific file manager` mean?

Look at [lib-util](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-lib-util/README.md) for interface description.

