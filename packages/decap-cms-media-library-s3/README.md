# Decap CMS Media Library - S3-compatible storage

A media library integration for [Decap CMS](https://decapcms.org/) to use S3-compatible object
storage — AWS S3, [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/),
Backblaze B2, DigitalOcean Spaces, Wasabi, MinIO, Scaleway Object Storage, Linode Object Storage,
and any other provider that exposes an S3 REST-compatible endpoint — through the Decap backend
edge proxy.

## Features

- Browse files and "folders" (emulated via S3 key prefixes) through your `s3` edge function
- Upload single or multiple files
- Delete files
- Image preview for supported formats
- Directory navigation with breadcrumb trail
- Client-side image filtering with `imagesOnly` support
- Server-side auth using the active CMS session + site context
- Works with any S3-compatible provider — the endpoint, region, bucket, and credentials are
  configured server-side, not in this package

## Installation

Install the package as a dependency in your Decap CMS project:

```bash
npm install decap-cms-media-library-s3
# or
yarn add decap-cms-media-library-s3
```

## Configuration

### 1. Register the plugin in your CMS config file

In your Decap CMS setup file (usually `admin/index.js` or `admin.ts`):

```javascript
import DecapCMS from 'decap-cms-app';
import S3MediaLibrary from 'decap-cms-media-library-s3';

DecapCMS.registerMediaLibrary(S3MediaLibrary);
```

### 2. Add media library configuration to `config.yml`

```yaml
media_library:
  name: s3
  config:
    public_url_prefix: https://your-public-domain-or-cdn.example.com
```

### Configuration Options

| Option              | Type    | Required | Description                                                     |
| ------------------- | ------- | -------- | ----------------------------------------------------------------- |
| `public_url_prefix` | String  | Yes      | Public URL prefix used to build inserted asset URLs               |
| `root_path`         | String  | No       | Default root path within the bucket (default: `/`)                |
| `max_file_size`     | Number  | No       | Max upload size in bytes (default: 50MB)                          |
| `multiple`          | Boolean | No       | Allow selecting/inserting multiple files (default: `false`)       |

The library resolves auth/site context from Decap CMS backend state:

- `Authorization: Bearer <session_access_token>`
- `x-site-id: <active_site_id>`

`active_site_id` is sourced from backend site configuration (same source used by Turbo data
writes), not from arbitrary input. The actual provider endpoint, region, bucket, and access
credentials are never part of this config — they're configured per-site in the decap-turbo
dashboard and resolved server-side by the `s3` integration adapter.

## Usage

Once configured, the Decap CMS media library will display a file browser for your S3-compatible
bucket. You can:

- Click on folders to navigate
- Upload files via drag-and-drop or file picker
- Select files to insert into your content
- Delete files using the delete button
- Use breadcrumbs to navigate back to parent folders

### In your collection configuration

```yaml
collections:
  - name: blog
    label: Blog
    folder: content/blog
    create: true
    fields:
      - name: featured_image
        label: Featured Image
        widget: image
```

## Security

- AWS/R2/provider credentials are handled server-side, signed with AWS SigV4 in your edge
  function's `s3` adapter — never sent to or stored in the browser.
- Clients only send the active CMS session token + site context.
- The destination endpoint is resolved from that site's own configuration, never from anything
  the browser sends, to prevent SSRF via a caller-controlled destination.

## Prerequisites: a public bucket, custom domain, or CDN

S3/R2 buckets are private by default. `public_url_prefix` must point at something that can
actually serve the uploaded objects publicly — a bucket with public read access, a custom domain
(e.g. an R2 custom domain), or a CDN in front of the bucket (e.g. S3 + CloudFront). This
integration does not generate presigned GET URLs for viewing inserted assets.

## Limitations (MVP Version)

- No search functionality (coming in future versions)
- Client-side only image filtering (no server-side optimization)
- No image transformations
- Requires a pre-provisioned public URL path for the bucket (see above)

## Future Enhancements

- Full-text search across file names
- Image transformation options
- Batch operations (delete multiple files)
- Folder creation from UI
- Presigned direct-to-bucket uploads (bypassing the edge-function proxy for the upload body)

## License

MIT
