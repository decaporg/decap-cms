# Improved Docs coming soon!

Netlify CMS was recently converted from a single npm package to a "monorepo" of over 20 packages.
That's over 20 Readme's! This is a work in progress.

In the meantime, you can:

1. Check out the [main readme](https://github.com/netlify/netlify-cms/#readme) or the [documentation
   site](https://www.netlifycms.org) for more info.
2. Check out the [Azure Netlify docs](../../website/content/docs/azure-backend.md)
2. Reach out to the [community chat](https://netlifycms.org/chat/) if you need help.
3. Help out and improve the readme yourself!


# netlify-cms for dev.azure.com 
Contributors Welcome!


## known issues


### working

* start and user login, return to home screen
* list existing (pre-created) entries in collections
* click one entry from that list to open editor and find content as expected
* images in media lib of type PNG
* user login via Azure is working, a very long and sane-looking token is created but any API call returns a HTML redirect to the login screen instead of the expected json output - that is an indicator that the AAD permissions for this app are still insufficient - workround is to create a PAT (Personal Access Token) in dev.azure.com and use basic auth until the token issue is fixed
* mozilla/firefox javascript always falls into the .catch-path in function 'request' for the fetch - which is likely a header/cors issue - workaround: use chrome which doesn't show this behaviour
* writing edited objects
* create new objects/posts
* upload media objects
* editorial workflow
* delete or rename

### Not working
* anything not yet explicitely mentioned as working  

