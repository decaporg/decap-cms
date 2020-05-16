---
title: Overview
weight: 1
group: accounts
---

A backend is JavaScript code that allows Netlify CMS to communicate with a service that stores content - typically a Git host like GitHub or GitLab. It provides functions that Netlify CMS can use to do things like read and update files using API's provided by the service.

## Backend Configuration

Individual backends should provide their own configuration documentation, but there are some configuration options that are common to multiple backends. A full reference is below. Note that these are properties of the `backend` field, and should be nested under that field.

| Field           | Default                                                        | Description                                                                                                                                          |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo`          | none                                                           | **Required** for `github`, `gitlab`, and `bitbucket` backends; ignored by `git-gateway`. Follows the pattern `[org-or-username]/[repo-name]`.                                    |
| `branch`        | `master`                                                       | The branch where published content is stored. All CMS commits and PRs are made to this branch.                                                       |
| `api_root`      | `https://api.github.com` (GitHub), `https://gitlab.com/api/v4` (GitLab), or `https://api.bitbucket.org/2.0` (Bitbucket)  | The API endpoint. Only necessary in certain cases, like with GitHub Enterprise or self-hosted GitLab.                                                                      |
| `site_domain`   | `location.hostname` (or `cms.netlify.com` when on `localhost`) | Sets the `site_id` query param sent to the API endpoint. Non-Netlify auth setups will often need to set this for local development to work properly. |
| `base_url`      | `https://api.netlify.com` (GitHub, Bitbucket) or `https://gitlab.com` (GitLab)                                     | OAuth client hostname (just the base domain, no path). **Required** when using an external OAuth server or self-hosted GitLab.                               |
| `auth_endpoint` | `auth` (GitHub, Bitbucket) or `oauth/authorize` (GitLab)                  | Path to append to `base_url` for authentication requests. Optional.                                                                                  |

## Creating a New Backend

Anyone can write a backend, but we don't yet have a finalized and documented API. If you would like to write your own backend for a service that does not have one currently, we recommend using the [GitHub backend](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github) as a reference for API and best practices.
