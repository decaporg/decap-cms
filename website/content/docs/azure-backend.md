---
group: Accounts
weight: 20
title: Azure
---
For repositories stored on Azure, the `azure` backend allows CMS users to log in directly with their Azure account. Note that all users must have write access to your content repository for this to work.

To enable it:

1. Follow the authentication provider setup steps in the [Netlify docs](https://www.netlify.com/docs/authentication-providers/#using-an-authentication-provider).
2. Add the following lines to your Netlify CMS `config.yml` file:

```yaml
  backend:
    name: azure
    repo: {org}/{project}/{repo} # path to the Azure repo you want to target
```

You will also need the `preview_context` in order to use the editorial workflow.


### Create an app in AAD (Azure Active Directory)
You will need the `appId` and `tenantId` for your git repository hosted in Azure DevOps.

Here are some links to get you started:
[Create an Azure Devops Project](https://docs.microsoft.com/en-us/azure/devops/organizations/projects/create-project?view=azure-devops&tabs=preview-page)
[Create a new Git Repo](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-new-repo?view=azure-devops)
[Add an application to AAD](https://docs.microsoft.com/en-us/azure/active-directory/manage-apps/add-application-portal)


#### Step-by-step
_NOTE:_ The following step-by-step was written by an early contributor to the azure-backend code and has not been verified, but it seems accurate and may be more direct than digging through all of the Azure documentation.
  1. Sign into https://portal.azure.com
  2. Search for "Azure Active Directory" (also known as AAD)
      1. Double check that you see the tenant associated with your Azure DevOps instance!
      2. If not, use the directory switcher in the top bar to go to the right directory.
  3. In the Azure AD blade, find "App Registrations".
  4. Click "New registration"
  5. Enter a display name, for example: `Netlify CMS for Azure DevOps`
  6. Choose "Single tenant" mode, (multi-tenant hasn't been tested/here be dragons)
  7. Enter your redirect URL, e.g. http://localhost:8080
  8. Press "OK" to create the app
  9. Go to "API permissions"
      1. Click "Add a permission"
      2. Click "Azure DevOps"
      3. Under "Delegated permissions", check "user_impersonation"
      4. Click "Add permissions"
  10. To save users having to consent, hit "Grant admin consent for (your tenant)"
  11. Go to "Authentication"
      1. Under "Web", find the "Implicit grant" section
      2. Check "Access tokens" and "Identity tokens"
      3. Enter "https://dev.azure.com/(yourorgname) in the redirect URIs list (*Note to self: check this is necessary!*)
      4. Click "Save"
  12. Go to "Overview"
      1. Note the "Application (client) ID" for the app_id config.yml setting.
      2. Note the "Directory (tenant) ID" to append to the identity_url setting.

When the dev environment starts, hit "Login" and sign in with an Azure AD account that has access to the Azure DevOps repo!


```yaml
  backend:
    name: azure
    repo: {org}/{project}/{repo}
    identity_url: https://login.microsoftonline.com/{tenantId}
    app_id: {appId}
    preview_context: '-preview'
```


| setting      | description | example |
|--------------|-----------------------------------------------------------------------------|----------------------------------------|
| name         | Fixed: must be `azure`                                                      | `azure`                                |
| branch       | Usually `master` - don't change unless you know exactly what you are doing! | `master`                               |
| repo         | Comprising your Azure DevOps organisation name, project, and repo           | `acme/project/jekyll`                  |
| identity_url | OAuth identity endpoint: standard Microsoft, plus tenant ID                 | `https://login.microsoftonline.com/e38b796f-d5df-4529-82c3-345c0b37e406` |
| app_id       | Follow instructions above to create an app, then add its client ID here     | `e38b796f-d5df-4529-82c3-345c0b37e406` |
| preview_context | Required for editorial workflow. Value should be '-preview' |     |

