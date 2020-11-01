---
group: Accounts
weight: 20
title: Azure
---
For repositories stored on Azure, the `azure` backend allows CMS users to log in directly with their Azure account. Note that all users must have write access to your content repository for this to work.

To enable it:

1. Register a new application in the [Azure portal](https://docs.microsoft.com/en-us/graph/auth-register-app-v2).
Use single tenant mode and configure a redirect URL (e.g. http://localhost:8080).
2. Under `API permissions`, add the `Azure DevOps` -> `user_impersonation` permission.
3. Go to `Overview` and note the `Application (client) ID` and `Directory (tenant) ID`.
4. Add the following lines to your Netlify CMS `config.yml` file:

```yaml
  backend:
    name: azure
    repo: organization/project/repo # replace with actual path
    tenant_id: tenantId # replace tenantId
    app_id: appId # replace appId
```
