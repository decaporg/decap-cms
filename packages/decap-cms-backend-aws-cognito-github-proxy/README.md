# GitHub backend

An abstraction layer between the CMS and a proxied version of [Github](https://docs.github.com/en/rest).

## Code structure

`Implementation` - wraps [Github Backend](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-auth/README.md) for proxied version of Github.

`AuthenticationPage` -  uses [lib-auth](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-lib-auth/README.md) to create an AWS Cognito compatible generic Authentication page supporting PKCE.
