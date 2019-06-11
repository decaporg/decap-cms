---
title: Enable External Contributors with the Fork Workflow
group: features
---

When using the GitHub backend, you can use Netlify CMS to accept contributions from GitHub users without giving them access to your repository. When they make changes in the CMS, the CMS forks your repository for them behind the scenes, and all the changes are made to the fork. When the contributor is ready to submit their changes they can submit a pull request to your repository, which you can merge using the GitHub UI. At the same time, any contributors who _do_ have write access to the repository can continue to use the CMS normally.

## Requirements

- You must use [the GitHub backend](/docs/authentication-backends/#github-backend) (note that the Git Gateway backend does _not_ support the fork workflow, even when the underlying repo is on GitHub).

- Your repo on GitHub must be public.

## Enabling the Fork Workflow

1. [Enable the editorial workflow](/docs/configuration-options/#publish-mode) by setting `publish_mode` to `editorial_workflow` in your `config.yml`.

2. Set `fork_workflow` to `true` in the `backend` section of your `config.yml`, as follows:

    ```yaml
    backend:
      name: github
      repo: owner-name/repo-name # Path to your GitHub repository
      fork_workflow: true
    ```

## Using the Fork Workflow

When a user logs into the CMS who doesn't have write access to your repo, the CMS will ask them if it's all right to create a fork of your repo (or use their existing fork, if they already have one). They are then presented with the normal CMS interface. The published content shown is from the original repo, so it stays up-to-date as changes are made.

On the editorial workflow screen, the normal three columns will be replaced by two columns instead - "Draft" and "Ready to Review".

When they make changes to content in the CMS, the changes will be made to a branch on their fork. In the editorial workflow screen, they will only be able to see their pending changes. Once they're ready to submit their changes, they can move the card into the "Ready To Review" or "Ready to Publish" columns to create a pull request. When the pull request is merged, the CMS will delete the branch and remove the card the next time the user opens the editorial workflow screen. Fork workflow users will not be able to publish entries through the CMS.

Users who _do_ have write access to the original repository will continue to use the CMS normally. Unpublished changes made by users using the fork workflow will not be visible on the editorial workflow screen, and their unpublished changes must be merged in through the GitHub UI.

## Alternative for external contributors with Git Gateway

[As noted above](#requirements), the fork workflow does not work with the Git Gateway backend. However, you can use Git Gateway on a site with Netlify Identity that has open registration. This lets users create accounts on your site and log into the CMS. There are a few differences, including the following:

- Users don't need to know about GitHub or create a GitHub account. Instead, they use Netlify Identity accounts that are created on your site and managed by you.
- The CMS applies users' changes directly to your repo, not to a fork. (If you use the editorial workflow, you can use features like GitHub's protected branches or Netlify's locked deploys to prevent users from publishing directly to your site from the CMS).
- There is no distinction between users with write access to the repo and users without - all editorial workflow entries are visible from within the CMS and can be published with the CMS. (Unpublished fork workflow entries, on the other hand, are only visible to maintainers as GitHub PRs.)
