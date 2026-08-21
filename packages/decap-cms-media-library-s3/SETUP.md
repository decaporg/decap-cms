# S3 Media Library Setup

This guide describes the current S3-compatible integration model: client requests go through the
backend edge proxy with backend-provided auth/site context, and per-site provider credentials.

## Prerequisites

- Decap CMS with `decap-turbo` backend
- Deployed `integrations` edge function (`/functions/v1/integrations/s3`)
- An S3-compatible bucket already created (AWS S3, Cloudflare R2, Backblaze B2, DigitalOcean
  Spaces, Wasabi, MinIO, Scaleway, Linode, or any other S3-compatible provider)
- A public URL path for that bucket already provisioned — a public bucket, a custom domain (e.g.
  an R2 custom domain), or a CDN in front of the bucket

## 1) Install and register

```bash
npm install decap-cms-media-library-s3
```

```javascript
import DecapCMS from 'decap-cms-app';
import S3MediaLibrary from 'decap-cms-media-library-s3';

DecapCMS.registerMediaLibrary(S3MediaLibrary);
```

## 2) Configure backend

Your backend config must include session + site context fields:

```yaml
backend:
  name: decap-turbo
  repo: owner/repo
  branch: main

  base_url: https://your-project-ref.supabase.co
  api_root: https://your-project-ref.supabase.co/functions/v1/gh
  auth_endpoint: auth/v1/authorize
  auth_token_endpoint: auth/v1/token

  app_id: your-project-ref
  anon_key: your-supabase-anon-key
  turbo_site_id: your-site-uuid
```

## 3) Configure site provider credentials (decap-turbo dashboard)

In the decap-turbo site dashboard, set these site variables (not in `config.yml`):

| Key                     | Secret? | Example                                          |
| ----------------------- | ------- | ------------------------------------------------- |
| `s3_endpoint`            | No      | `https://<account_id>.r2.cloudflarestorage.com`    |
| `s3_region`              | No      | `auto` (R2) or a real AWS region                   |
| `s3_bucket`              | No      | `my-site-media`                                    |
| `s3_access_key_id`       | No      | provider access key id                             |
| `s3_secret_access_key`   | Yes     | provider secret access key                         |
| `s3_force_path_style`    | No      | `true` for MinIO/self-hosted setups; otherwise omit |

## 4) Configure media library

```yaml
media_library:
  name: s3
  config:
    public_url_prefix: https://your-public-domain-or-cdn.example.com
    root_path: /
```

Supported S3-specific config:

- `public_url_prefix` (required)
- `root_path` (optional)
- `max_file_size` (optional, bytes, default 50MB)
- `multiple` (optional, default `false`)

## 5) Edge function expectations

Requests are sent to:

`https://<PROJECT_REF>.supabase.co/functions/v1/integrations/s3/<key>`

With headers:

- `Authorization: Bearer <access_token>`
- `x-site-id: <site_uuid>`

The library resolves both from Decap backend/auth context. The edge function resolves the site's
`s3_*` variables and signs the forwarded request with AWS SigV4 server-side.

## 6) Verify integration

- Open an `image` widget in Decap.
- Confirm files list loads.
- Upload/select/delete a test image.
- Confirm the inserted URL is publicly reachable.

## Troubleshooting

### `Session token not found`

- Log in again via Decap auth page.
- Confirm backend auth state is persisted.

### `Active site id is missing`

- Set `backend.turbo_site_id`.
- Confirm user has site membership on backend.

### `Backend base URL is missing`

- Set `backend.base_url`.

### Requests fail with 401/403

- 401: token missing/invalid
- 403: authenticated user lacks access to requested site

### Requests fail with 500 `Missing S3 storage configuration for site`

- One or more of `s3_endpoint`, `s3_bucket`, `s3_access_key_id`, `s3_secret_access_key` is not set
  for this site in the decap-turbo dashboard.

### Files upload but inserted image doesn't load

- The bucket isn't publicly readable at `public_url_prefix`. Provision a public bucket, custom
  domain, or CDN in front of it.
