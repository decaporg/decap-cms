# Integration Testing Guide

This guide covers testing S3-compatible media library behavior in the current edge-proxy model.

## Local validation

From repository root:

```bash
npm run test:unit -- --runInBand \
  packages/decap-cms-media-library-s3/src/__tests__/client.test.ts \
  packages/decap-cms-media-library-s3/src/__tests__/fileManager.test.ts
```

## Manual test config

Use a backend config that includes:

- `backend.base_url`
- `backend.site_id`
- active authenticated user session

Media library config only needs:

```yaml
media_library:
  name: s3
  config:
    public_url_prefix: https://your-public-domain-or-cdn.example.com
    root_path: /
```

## Functional scenarios

### 1. File browsing

- Open an image field.
- Verify folder ("CommonPrefix") navigation and listing.
- Verify listings beyond 1000 keys paginate correctly (if testing against a large bucket).

Expected:

- Files/folders render.
- Breadcrumb and parent navigation work.

### 2. Single insert

- Select one file.
- Click `Insert`.

Expected:

- One URL is inserted into the field.
- Modal closes.

### 3. Multiple insert

- In multi-select mode, select multiple files.
- Click `Insert`.

Expected:

- Multiple URLs are inserted.

### 4. Upload

- Upload one or more files.

Expected:

- Progress updates.
- Files appear in listing, pre-selected — the modal stays open after upload so you can review the
  result before clicking "Insert" (upload does not auto-insert or auto-close).
- No failure right at `max_file_size`.

### 5. Delete

- Delete a file and confirm.

Expected:

- File is removed from listing.

## Error-path scenarios

### Missing session token

Expected message:

- `Session token not found. Please log in again.`

### Missing site context

Expected message:

- `Active site id is missing in backend configuration.`

### Missing backend base URL

Expected message:

- `Backend base URL is missing. Configure backend.base_url.`

### Missing site S3 configuration

Expected behavior:

- 500 response with `Missing S3 storage configuration for site`, surfaced as a load error.

### Backend authorization failures

Expected behavior:

- 401/403/500 responses are surfaced as load/upload/delete errors.

## Cross-provider testing

Since this is a generic S3-compatible integration, when adding support for a new provider or
changing the adapter, re-run the functional scenarios above against at least:

- Cloudflare R2 (virtual-hosted-style, `region: auto`)
- A path-style provider (e.g. local MinIO, `s3_force_path_style: true`)

## Reporting issues

Include:

- browser + OS
- sanitized backend/media config (redact `s3_access_key_id`/`s3_secret_access_key`)
- repro steps
- expected vs actual
- network response details for `/functions/v1/integrations/s3/*`
