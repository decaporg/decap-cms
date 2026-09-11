# Quick Start Example

This is a minimal working example for using the S3-compatible media library with Decap CMS through the backend edge proxy.

## 1) Install dependencies

```bash
npm install decap-cms-app decap-cms-media-library-s3 decap-cms-backend-turbo
```

## 2) Register the media library

In your admin entry file:

```javascript
import DecapCMS from 'decap-cms-app';
import S3MediaLibrary from 'decap-cms-media-library-s3';

DecapCMS.registerMediaLibrary(S3MediaLibrary);
```

## 3) Configure Decap backend + S3 media library

In `config.yml`:

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

media_library:
  name: s3
  config:
    public_url_prefix: https://your-public-domain-or-cdn.example.com
    root_path: /cms-media/
```

Notes:

- S3 media library config only needs public-URL/path behavior.
- Auth and site context are resolved from the active backend session.
- The bucket, endpoint, region, and AWS/R2 credentials are configured per-site in the decap-turbo
  dashboard (site variables `s3_endpoint`, `s3_region`, `s3_bucket`, `s3_access_key_id`,
  `s3_secret_access_key`, `s3_force_path_style`), not in `config.yml`.

## 4) Ensure edge function contract is available

The backend must expose:

- `https://<PROJECT_REF>.supabase.co/functions/v1/integrations/s3/...`
- `Authorization: Bearer <access_token>`
- `x-site-id: <site_uuid>`

The S3 library sends these automatically using Decap backend context.

## 5) Start the app

```bash
npm run start
```

Open your admin UI and test any `image` field.

## Troubleshooting

### Media library opens but shows auth error

- Verify your Decap user is logged in.
- Verify backend session has a valid access token.

### Missing site id error

- Verify `backend.turbo_site_id` is set.
- Verify the authenticated user has access to that site.

### Edge proxy request fails

- Verify `backend.base_url` is correct.
- Verify `functions/v1/integrations/s3` is deployed and reachable.
- Verify the site has `s3_endpoint`, `s3_bucket`, `s3_access_key_id`, and `s3_secret_access_key`
  configured.

### Files upload but images don't render / insert URLs 403

- `public_url_prefix` must point at a publicly readable bucket, custom domain, or CDN — S3/R2
  buckets are private by default.

## Next steps

- See [SETUP.md](./SETUP.md) for detailed setup.
- See [TESTING.md](./TESTING.md) for test scenarios.
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for implementation details.
