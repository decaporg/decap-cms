# Nested Collection Changes

## Summary
Updated nested collections to remove the requirement for `index.md` files and enable dynamic filename generation based on entry titles.

## Changes Made

### 1. Folder Names as Tree Titles
**File**: `packages/decap-cms-core/src/components/Collection/NestedCollection.js`
- Modified `getNodeTitle()` to use folder names directly instead of looking for index file titles
- Simplified logic to always return `node.title`

### 2. Dynamic Filename Generation
**File**: `packages/decap-cms-core/src/reducers/entryDraft.js`
- Added `cleanTitleForFilename()` function to sanitize titles for use as filenames
- Updated `selectCustomPath()` to:
  - Support backward compatibility with `index_file` configuration
  - Generate dynamic filenames from entry titles for new entries
  - Preserve existing filenames when moving entries between folders
  - Only generate new filenames for new entries (when `newRecord` is true)

### 3. Optional index_file Configuration
**Files**: 
- `packages/decap-cms-core/src/types/redux.ts`
- `packages/decap-cms-core/index.d.ts`
- `packages/decap-cms-core/src/constants/configSchema.js`

Made `index_file` optional in the `meta.path` configuration:
```typescript
meta?: { path?: { label: string; widget: string; index_file?: string } }
```

### 4. Updated Tests
**File**: `packages/decap-cms-core/src/constants/__tests__/configSchema.spec.js`
- Updated tests to verify both configurations work:
  - With `index_file` (backward compatibility)
  - Without `index_file` (new behavior)

### 5. Updated Example Configs
**Files**:
- `dev-test/config.yml`
- `dev-test/backends/test/config.yml`

Removed `index_file` from example nested collection configurations.

## Behavior

### Old Behavior (with index_file)
```yaml
meta: { path: { widget: string, label: 'Path', index_file: 'index' } }
```
- Required `index.md` in each folder
- All files named `index.md`
- Folder title came from index file's title field

### New Behavior (without index_file)
```yaml
meta: { path: { widget: string, label: 'Path' } }
```
- No index file required
- Folder names used as tree node titles
- New files get dynamic names based on cleaned title (e.g., "My Article" → `my-article.md`)
- Files created in subfolders based on UI context (current filter path)
- When moving existing files between folders, the filename is preserved

## Backward Compatibility
The changes maintain full backward compatibility. Collections with `index_file` configured will continue to work as before.

## File Moving Fix
Fixed file moving behavior to be conditional based on the `subfolders` setting in nested collections.

### The Issue
When updating the path field on an existing entry, the behavior needed to respect the `subfolders` configuration.

### Root Cause
The "move children" logic was designed for collections with `subfolders: false`, where all files in a folder represent a single logical entry. This logic needed to be conditional.

### The Solution
Made the file moving behavior conditional based on the `nested.subfolders` configuration:

**When `subfolders: true` (default - legacy behavior):**
- All files in the source directory are moved together
- This maintains backward compatibility for existing collections where all files in a folder represent a single entry

**When `subfolders: false` (new behavior):**
- Only the specific file being edited is moved
- Other files in the source directory remain untouched
- This is the safer behavior for collections where each file is independent

### Files Modified
- `packages/decap-cms-lib-util/src/implementation.ts` - Added `hasSubfolders` to `PersistOptions` type
- `packages/decap-cms-core/src/backend.ts` - Pass `hasSubfolders` setting to backend implementations
- `packages/decap-cms-backend-github/src/API.ts` - Made `updateTree()` conditional on `hasSubfolders`
- `packages/decap-cms-backend-gitlab/src/API.ts` - Made `getCommitItems()` conditional on `hasSubfolders`
- `packages/decap-cms-backend-azure/src/API.ts` - Updated to use `hasSubfolders` from options
- `packages/decap-cms-backend-bitbucket/src/API.ts` - Made `uploadFiles()` conditional on `hasSubfolders`
- `packages/decap-cms-server/src/middlewares/utils/fs.ts` - Made `move()` conditional on `hasSubfolders`
- `packages/decap-cms-core/src/reducers/entryDraft.js` - Ensured existing entries preserve their filename when moved

### Behavior Summary
- New entries get filenames generated from their title
- Existing entries preserve their current filename when moved to a different folder
- File moving respects the `subfolders` configuration:
  - `subfolders: true` (default): Moves all files in directory (legacy behavior for backward compatibility)
  - `subfolders: false`: Only moves the specific file (new, safer behavior)
- All backend implementations now have consistent, configurable move behavior
