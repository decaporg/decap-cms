---
group: Workflow
weight: 20
title: Editorial Workflows
---

When the [Publish Mode](/docs/configuration-options/#publish-mode) is set to
enable *Editorial Workflow* in in the website's configuration, the expected
user behavior will be different depending on when backend is configured.

### Bitbucket Support

In order to track unpublished entries statuses the Bitbucket implementation uses
[pull requests comments](https://confluence.atlassian.com/bitbucketserver/commenting-on-a-pull-request-1027119882.html).

### GitLab Support

In order to track unpublished entries statuses the GitLab implementation uses
[merge requests labels](https://docs.gitlab.com/ee/user/project/labels.html).
