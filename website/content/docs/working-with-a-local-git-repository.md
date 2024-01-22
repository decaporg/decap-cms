---
group: Accounts
weight: 70
title: Working with a Local Git Repository
---
You can connect Decap CMS to a local Git repository, instead of working with a live repo.

1. Navigate to a local Git repository configured with the CMS.
2. Add the top-level property `local_backend` configuration to your `config.yml`:

```yaml
# when using the default proxy server port
local_backend: true

backend:
  name: git-gateway
```

3. Run `npx decap-server` from the root directory of the above repository.

   * If the default port (8081) is in use, the proxy server won't start and you will see an error message. In this case, follow [these steps](#configure-the-decap-server-port-number) before proceeding.
4. Start your local development server (e.g. run `gatsby develop`).
5. Open `http://localhost:<port>/admin` to verify that your can administer your content locally. Replace `<port>` with the port of your local development server. For example Gatsby's default port is `8000`

**Note:** `decap-server` runs an unauthenticated express server. As any client can send requests to the server, it should only be used for local development. Also note that `editorial_workflow` is not supported in this environment.

### Configure the Decap CMS proxy server port number

1. Create a `.env` file in the project's root folder and define the PORT you'd like the proxy server to use

```ini
PORT=8082
```

2. Update the `local_backend` object in `config.yml` and specify a `url` property to use your custom port number

```yaml
backend:
  name: git-gateway

local_backend:
  # when using a custom proxy server port
  url: http://localhost:8082/api/v1
  # when accessing the local site from a host other than 'localhost' or '127.0.0.1'
  allowed_hosts: ['192.168.0.1']
```