---
group: Add
weight: 5
title: 4. Access Your Content
---

Your site CMS is now fully configured and ready for login!

If you set your registration preference to "Invite only," invite yourself (and anyone else you choose) as a site user. To do this, select the **Identity** tab from your site dashboard, and then select the **Invite users** button. Invited users receive an email invitation with a confirmation link. Clicking the link will take you to your site with a login prompt.

If you left your site registration open, or for return visits after confirming an email invitation, access your site's CMS at `yoursite.com/admin/`.

**Note:** No matter where you access Decap CMS — whether running locally, in a staging environment, or in your published site — it always fetches and commits files in your hosted repository (for example, on GitHub), on the branch you configured in your Decap CMS `config.yml` file.

This means:

- Content fetched in the admin UI matches the content in the repository, which may be different from your locally running site.
- Content saved using the admin UI saves directly to the hosted repository, even if you're running the UI locally or in staging.
