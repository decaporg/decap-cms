# Lib Util

Shared utilities to handle various `decap-cms-backend-*` backends operations.

## Code structure

This structure should be the same for backends.

At first, look at `Implementation`. This is File Management System API and has factory method for `AuthComponent`.

### File Management System API

An abstraction layer between the CMS and Git-repository manager API.

Used as backend in [cms-core](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-core/README.md).

### Low-level abstractions for Git-repository manager API:

- `API` - used for Entry files
- `git-lfs` - used for Media files
- and over halpful utilities

