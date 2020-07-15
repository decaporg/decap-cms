---
title: Known Issues and Solutions
weight: 20
group: support
---

## Background

There are a couple of issues that users face while integrating or working with Netlify CMS and while the community is doing their best fixing them, here is a list of known issues and their solutions.

## API Errors

A list of error messages and their possible cause(s) to provide more context while debugging.

#### 1. Error Message.

```
API_ERROR: {"message":"404 File Not Found"}
```

#### Possible Causes.

- The collection folder or file property is missing a value (a dedicated file or folder, can't be blank or root). The file or folder should be relative to root (so src/posts for example).
- There are subfolders within the collection folder.

#### 2. Error Message

```
API_ERROR: Not Found
```

#### Possible Cause

- The media library folder is missing, or the value of the media library property within config.yml isn't correct.

#### 3. Error Message

```
Failed to load entries: API_ERROR: Not Found
```

#### Possible Causes

- Git Gateway is not enabled: Enable Git Gateway from the Netlify Identity settings or refresh the token.
- There aren't any entries for a given collection. Not sure if we should throw this error at all actually.

#### 4. Error Message

```
Failed to
load entry: API_ERROR: Not Found
```

#### Possible Causes

- The collection folder or file property is missing a value (a dedicated file or folder, can't be blank or root). The file or folder should be relative to root (so src/posts for example).
- There aren't any entries for a given collection.

#### 5. Error Message

```
Failed to persist entry: API_ERROR: Not Found
```

#### Possible Cause

- The org account needs to grant access to your Netlify CMS instance: https://help.github.com/en/github/setting-up-and-managing-your-github-user-account/requesting-organization-approval-for-oauth-apps

#### 6. Error Message

```
Failed to persist entry: API_ERROR: Reference update failed
```

#### Possible Cause

- You're using the editorial workflow but already have a branch called cms. This error is fixed by removing the cms branch from the repo.

#### 7. Error Message

```
Failed to load settings from /.netlify/identity
```

#### Possible Cuase

- Netlify Identity isn't enabled.
- config.yml has git-gateway as a backend on a site that isn't hosted on Netlify.

## Other Issues

#### 1. Invited Users Email not Confirmed.

If you’ve invited some users and opened the invitation link from the generated emails but as they try to log in they get the following error message:

```
Email not confirmed
```

#### Possible Solutions.

- Add the identity widget to your homepage <head>. Upside of this method is that it’s fast and easy, no other configuration needed. The downside is that all of your users are downloading the widget while they might not need it. That’s kb’s wasted. Unless you’re using Netlify Identity for something else than the authentication of CMS users, utilize the next solution.

- Change the invitation emails! This takes a bit more time, but it’s probably the cleanest solution. You already have the identity widget loaded at your admin/ page, so you might as well have your users confirm their email there. Learn how to update your invitation emails [here](https://docs.netlify.com/visitor-access/identity/identity-generated-emails/#email-templates).

#### 2. Invitation Email not Recieved.

If you deployed Netlify CMS to Netlify using a template and didn't receive an invitation email after deploying the site, check your email settings to make sure that your email provider doesn't block emails from no-reply@netlify.com.

#### 3. Mobile responsiveness.

To make Netlify CMS responsive for usage on mobile, [here](https://gist.github.com/lilpolymath/51082130d316df3a938648569077c9330) is a temporary CSS solution to include to your admin/index.html below your closing </body> tag so it can overwrite netlify-generated css.

Credits to [truongoi](https://github.com/truongoi)
