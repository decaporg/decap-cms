---
title: Open Authoring
group: workflow
---

**This is a [beta feature](/docs/beta-features#open-authoring).**

When using the [GitHub backend](/docs/github-backend), you can use Netlify CMS to accept contributions from GitHub users without giving them access to your repository. When they make changes in the CMS, the CMS forks your repository for them behind the scenes, and all the changes are made to the fork. When the contributor is ready to submit their changes, they can set their draft as ready for review in the CMS. This triggers a pull request to your repository, which you can merge using the GitHub UI.

At the same time, any contributors who _do_ have write access to the repository can continue to use Netlify CMS normally.

## Requirements

- You must use [the GitHub backend](/docs/github-backend).

  **Note that the [Git Gateway backend](/docs/git-gateway-backend/#git-gateway-with-netlify-identity) does _not_ support Open Authoring, even when the underlying repo is on GitHub.**

- Your repo on GitHub must be public.

## Enabling Open Authoring

1. [Enable the editorial workflow](/docs/configuration-options/#publish-mode) by setting `publish_mode` to `editorial_workflow` in your `config.yml`.

2. Set `open_authoring` to `true` in the `backend` section of your `config.yml`, as follows:

    ```yaml
    backend:
      name: github
      repo: owner-name/repo-name # Path to your GitHub repository
      open_authoring: true
    ```

## Usage

When a user logs into Netlify CMS who doesn't have write access to your repo, the CMS asks for permission to create a fork of your repo (or uses their existing fork, if they already have one). They are then presented with the normal CMS interface. The published content shown is from the original repo, so it stays up-to-date as changes are made.

On the editorial workflow screen, the normal three columns are replaced by two columns instead — "Draft" and "Ready to Review".

When they make changes to content in the CMS, the changes are made to a branch on their fork. In the editorial workflow screen, they see only their own pending changes. Once they're ready to submit their changes, they can move the card into the "Ready To Review" column to create a pull request. When the pull request is merged (by a repository maintainer via the GitHub UI), Netlify CMS deletes the branch and removes the card from the user's editorial workflow screen. Open Authoring users cannot publish entries through the CMS.

Users who _do_ have write access to the original repository continue to use the CMS normally. Unpublished changes made by users via Open Authoring are not visible on the editorial workflow screen, and their unpublished changes must be merged through the GitHub UI.

## Alternative for external contributors with Git Gateway

[As noted above](#requirements), Open Authoring does not work with the Git Gateway backend. However, you can use Git Gateway on a site with Netlify Identity that has [open registration](https://www.netlify.com/docs/identity/#adding-identity-users). This lets users create accounts on your site and log into the CMS. There are a few differences, including the following:

- Users don't need to know about GitHub or create a GitHub account. Instead, they use Netlify Identity accounts that are created on your site and managed by you.
- The CMS applies users' changes directly to your repo, not to a fork. (If you use the editorial workflow, you can use features like [GitHub's protected branches](https://help.github.com/en/articles/about-protected-branches) or [Netlify's locked deploys](https://www.netlify.com/docs/locked-deploys/) to prevent users from publishing directly to your site from the CMS.)
- There is no distinction between users with write access to the repo and users without — all editorial workflow entries are visible from within the CMS and can be published with the CMS. (Unpublished Open Authoring entries, on the other hand, are visible only to the author in the CMS UI or publicly as GitHub PRs.)

## Linking to specific entries in the CMS
Open authoring often includes some sort of "Edit this page" link on the live site. Netlify CMS supports this via the **edit** path:

```
/#/edit/{collectionName}/{entryName}
```

For the entry named "general" in the "settings" file collection
```
https://www.example.com/path-to-cms/#/edit/settings/general
```

For blog post "test.md" in the "posts" folder collection
```
https://www.example.com/path-to-cms/#/edit/posts/test
```

- **`collectionName`**: the name of the collection as entered in the CMS config.
- **`entryName`** _(for [file collections](/docs/collection-types/#file-collections)_: the `name` of the entry from the CMS config.
- **`entryName`** _(for [folder collections](/docs/collection-types/#folder-collections)_: the filename, sans extension (the slug).
