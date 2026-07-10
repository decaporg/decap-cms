# decap-cms-ui-auth

Authentication UI pages used by the decap-cms-backend-* packages.

## Common Behavior

* An authenticator must return the following fields:
  * email
  * token?
  * expires?

## Components

* **NetlifyAuthenticationPage**
    * Username and password fields that are passed to Netlify Identity.
    * Requires a static `authClient` value set before login will work, expected to be set by the backend implementation.
  * Returns object that satisfies the GitGatewayUser type (and inherited Credentials type) from Netlify
* **PKCEAuthenticationPage**
    * OAuth2 PKCE flow with optional OIDC auto-configuration.
    * Returns object that satisfies the GitGatewayUser type (and inherited Credentials type), with additional data:
        * token (part of Credentials definition): the access token
        * idToken: if available
        * claims: if available (decoded access token)
        * idClaims: if available (decoded ID token)
        * email: mapped email value from the token claims, if available
        * user_metadata.full_name: mapped value from the token claims, if available
        * user_metadata.avatar_url: mapped value from the token claims, if available

