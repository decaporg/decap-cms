# Netlify CMS Proxy Server

Netlify CMS Proxy Server is an express server created to facilitate local development.

## How It Works

1. Navigate to a local Git repository configured with the CMS.
2. Run `npx netlify-cms-proxy-server` from the root directory of the above repository.
3. Update your `config.yml` to connect to the server:

```yaml
backend:
  name: proxy
  proxy_url: http://localhost:8081/api/v1
  branch: master # optional, defaults to master
```

4. Start you local development server (e.g. run `gatsby develop`).

## Custom Configuration

1. Create a `.env` file in the root directory of your local Git repository.
2. Update the file as follows:

```bash
# optional, defaults to current directory
GIT_REPO_DIRECTORY=FULL_PATH_TO_LOCAL_GIT_REPO
# optional, defaults to 8081
PORT=CUSTOM_PORT
```
