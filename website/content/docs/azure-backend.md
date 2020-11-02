---
group: Accounts
weight: 20
title: Azure
---
For repositories stored on Azure, the `azure` backend allows CMS users to log in directly with their Azure account. Note that all users must have write access to your content repository for this to work.

In order to get Netlify-CMS working with Azure DevOps, you need a `tenantId` and an `appId`.

1. If you do not have an Azure account, [create one here](https://azure.microsoft.com/en-us/free/?WT.mc_id=A261C142F)
2. If you do not have an Azure Active Directory Tenant Id, [set one up here](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-create-new-tenant)
3. [Register an application with Azure AD and create a service principal](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal#register-an-application-with-azure-ad-and-create-a-service-principal)
4. Add the following lines to your Netlify CMS `config.yml` file:

```yaml
  backend:
    name: azure
    branch: master
    repo: organization/project/repo # replace with actual path
    tenant_id: tenantId # replace with your tenantId
    app_id: appId # replace with your appId
    api_version: '6.0' # or '5.1`
```

#### Troubleshooting Tips:

We could not find specific instructions for the following steps in Microsoft's Azure documentation. If someone finds it, please replace this section with the link. Make sure you check your API permissions, grant admin consent for your tenant and implicitly grant authentication with access tokens and identity tokens in [Azure Portal](https://portal.azure.com)

  1. Review "API permissions"
      1. Click "Add a permission"
      2. Click "Azure DevOps"
      3. Under "Delegated permissions", make sure "user_impersonation" is checked
      4. If it is not, select it and click "Add permissions"
  2. To bypass users always having to give consent, click "Grant admin consent for (your tenant)"
  3. Review "Authentication"
      1. Under "Web", find the "Implicit grant" section
      2. Check "Access tokens" and "Identity tokens"
      3. Enter "https://dev.azure.com/(yourorgname) in the redirect URIs list (*Note to self: check this is necessary!*)
      4. Click "Save"

#### Additional Useful Information:

 - [Quickstart: register a new application in Azure Active Directory](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
 - Make sure you use [single tenant mode](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-modify-supported-accounts) and configure a redirect URI (e.g. http://localhost:8080)
 - [Read more on User Permissions](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent)
 - [Read more on App Objects and Service Principals](https://docs.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals)
