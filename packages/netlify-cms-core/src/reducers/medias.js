import { Map } from 'immutable';
import { resolvePath } from 'netlify-cms-lib-util';
import { ADD_ASSET, REMOVE_ASSET } from 'Actions/media';
import AssetProxy from 'ValueObjects/AssetProxy';
import { EDITORIAL_WORKFLOW } from 'Constants/publishModes';

const medias = (state = Map(), action) => {
  switch (action.type) {
    case ADD_ASSET:
      return state.set(action.payload.public_path, action.payload);
    case REMOVE_ASSET:
      return state.delete(action.payload);

    default:
      return state;
  }
};

export default medias;

const memoizedProxies = {};
export const getAsset = (publicFolder, mediaState, path, state) => {
  // No path provided, skip
  if (!path) return null;

  let proxy = mediaState.get(path) || memoizedProxies[path];
  if (proxy) {
    // There is already an AssetProxy in memmory for this path. Use it.
    return proxy;
  }

  // Get information we need to see if this is in a unpublished branch.
  const entryDraft = state.entryDraft;
  const publishMode = state.config.getIn(['publish_mode'], '');
  const isDraft = entryDraft.getIn(['entry', 'collection'], false) === 'draft';
  const isGithub = state.config.getIn(['backend', 'name'], false) === 'github';

  // Hanldes github editorial mode by using the uploaded branch URL to show image
  if (publishMode === EDITORIAL_WORKFLOW && isGithub && isDraft) {
    const branch = entryDraft.getIn(['entry', 'metaData', 'branch'], false);
    const repo = state.config.getIn(['backend', 'repo'], false);
    const mediaFolder = state.config.getIn(['media_folder'], false);
    const fileName = path.replace(publicFolder + '/', '');
    proxy = memoizedProxies[path] = new AssetProxy(
      `https://raw.githubusercontent.com/${repo}/${branch}/${mediaFolder}/${fileName}`,
      null,
      true,
    );
    return proxy;
  }

  // Create a new AssetProxy (for consistency) and return it.
  proxy = memoizedProxies[path] = new AssetProxy(resolvePath(path, publicFolder), null, true);
  return proxy;
};
