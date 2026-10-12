# Decap CMS Media Library — S3-compatible storage

> **Beta.** The configuration and behaviour of this package may change in a minor release. It will be replaced by a media library rebuilt inside Decap CMS core, and this package retired; the migration will be documented when that ships. Your files live in your own bucket and inserted URLs point at your public domain, so neither depends on this package.

A media library for sites on [Decap Turbo](https://decapcms.org/docs/turbo-overview/) that stores uploads in an S3-compatible bucket: AWS S3, Cloudflare R2, Bunny Storage, Backblaze B2, DigitalOcean Spaces, Wasabi, MinIO and others. Requests go through Turbo's `integrations` edge function, which signs them with the site's credentials, so storage credentials never reach the browser.

Requires the `turbo-github` or `turbo-gitlab` backend and a Turbo plan with the media library (Pro and above). Product documentation: [Media library](https://decapcms.org/docs/turbo-media-proxy/).

## Setup

### 1. Site variables

On the site's **Variables** tab in Turbo, not in `config.yml`:

| Key | Secret | Value |
|---|---|---|
| `s3_endpoint` | No | S3 API endpoint, e.g. `https://<account-id>.r2.cloudflarestorage.com` or `https://s3.<region>.amazonaws.com` |
| `s3_region` | No | Region to sign for; `auto` for R2 |
| `s3_bucket` | No | Bucket name |
| `s3_access_key_id` | No | Access key ID |
| `s3_secret_access_key` | Yes | Secret access key |
| `s3_force_path_style` | No | `true` for most providers, including R2, Bunny and MinIO; `false` usually works on AWS |

### 2. A public URL for the bucket

Buckets are private by default, and this library does not generate presigned URLs for viewing. Serve the bucket publicly through public read access, a custom domain (for example an R2 custom domain) or a CDN, and use that address as `public_url_prefix`.

### 3. `config.yml`

```yaml
backend:
  name: turbo-github # or turbo-gitlab
  turbo_site_id: your-site-id

media_library:
  name: s3
  config:
    public_url_prefix: https://media.example.com
```

| Option | Required | |
|---|---|---|
| `public_url_prefix` | Yes | Prefix for inserted asset URLs. Missing it throws on load. |
| `root_path` | No | Folder the browser opens in. Default `/`. |
| `max_file_size` | No | Upload limit in bytes. Default 50 MB. |
| `multiple` | No | Allow inserting several files at once. Default `false`. |

### 4. Registration

The `decap-cms` bundle (the script-tag build) registers this library already. With `decap-cms-app`, register it yourself:

```js
import CMS from 'decap-cms-app';
import S3MediaLibrary from 'decap-cms-media-library-s3';

CMS.registerMediaLibrary(S3MediaLibrary);
```

## How it works

Core passes the library the backend config, the current access token and the site ID through `getMediaLibraryContext`. The library calls `<base_url>/functions/v1/integrations/s3/<key>` with `Authorization: Bearer <access token>` and `x-site-id: <site id>`; `base_url` comes from the Turbo backend's preloaded config. The function checks the user's site membership and plan, reads the site's `s3_*` variables, signs the request with SigV4 and forwards it. The destination host comes only from the site's own `s3_endpoint`, never from the request.

- Listing uses `ListObjectsV2` with `delimiter=/` and follows continuation tokens until the listing is complete. Folders are key prefixes: deleting the last object in one makes it disappear, as in S3 itself.
- Uploads are buffered in the edge function before forwarding, because S3 and R2 require a real `Content-Length` and reject chunked bodies with 411. `max_file_size` bounds the buffer.
- An upload does not insert or close the dialog. New files are pre-selected, and **Insert** confirms them.

Source: `src/index.js` (entry, context resolution), `src/api/client.ts` (HTTP and XML parsing), `src/api/fileManager.ts` (paths to keys, public URLs), `src/components/S3Widget.tsx` (the dialog).

## Limitations

- No search, image transformations, folder creation, move or rename.
- Every upload passes through the edge function.
- Requires a public URL for the bucket (see above).

## Troubleshooting

| Message | Cause |
|---|---|
| `public_url_prefix is required in media_library config` | Add it under `media_library.config`. |
| `Session token not found. Please log in again.` | Log in again. |
| `Active site id is missing in backend configuration.` | `turbo_site_id` is not set. |
| `Backend base URL is missing. Configure backend.base_url.` | The backend is not a Turbo backend, or its config did not load. |
| 403 with `media_proxy_requires_paid_plan` | The organization's plan does not include the media library. |
| 403 otherwise | The user is not a member of the site. |
| 500 `Missing S3 storage configuration for site` | One of `s3_endpoint`, `s3_bucket`, `s3_access_key_id`, `s3_secret_access_key` is not set. |
| Inserted images do not load | The bucket is not publicly readable at `public_url_prefix`. |

## Development

```sh
pnpm exec jest packages/decap-cms-media-library-s3
```

When changing the client or the `s3` adapter, test browse (including a listing over 1,000 keys), upload at `max_file_size`, single and multiple insert, delete, and the error paths above against at least Cloudflare R2 (`s3_region: auto`) and a path-style provider such as MinIO. When reporting an issue, include the browser, the redacted media config, and the response from `/functions/v1/integrations/s3/*`.

## License

MIT
