---
group: Accounts
weight: 20
title: Azure
---

For repositories stored on Azure, the `azure` backend allows CMS users to log in directly with their Azure account. Note that all users must have write access to your content repository for this to work.

In order to get Netlify-CMS working with Azure DevOps, you need a Tenant Id and an Application Id.

1. If you do not have an Azure account, [create one here](https://azure.microsoft.com/en-us/free/?WT.mc_id=A261C142F) and make sure to have a credit card linked to the account.
2. If you do not have an Azure Active Directory Tenant Id, [set one up here](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-create-new-tenant).
3. [Register an application with Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app). Configure it as a Single tenant Web application and add a redirect URI (e.g. `http://localhost:8080/`)
4. Add the `Azure DevOps->user_impersonation` [permission](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-configure-app-access-web-apis#add-permissions-to-access-your-web-api) for the created application.
5. [Grant admin consent](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-configure-app-access-web-apis#admin-consent-button) for the application.
6. Under `Authentication->Implicit grant` enable [Access tokens](https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens) for the application and click `Save`.
7. Verify your Azure DevOps organization is connected to the same directory as your tenant under: `https://dev.azure.com/<organization>/_settings/organizationAad`
8. Add the following lines to your Netlify CMS `config.yml` file:

```yaml
backend:
  name: azure
  repo: organization/project/repo # replace with actual path
  tenant_id: tenantId # replace with your tenantId
  app_id: appId # replace with your appId
```

### Limitations

1. Pagination is not supported so some endpoints might return missing data

2. Nested collection are partially supported as Azure doesn't allow [renaming and editing](https://docs.microsoft.com/en-us/rest/api/azure/devops/git/pushes/create?view=azure-devops-rest-6.1&source=docs#rename-a-file) in a single operation
