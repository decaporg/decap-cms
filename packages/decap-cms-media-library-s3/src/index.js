// Decap CMS media library integration for S3-compatible object storage (AWS S3, Cloudflare R2, Neon Object Storage, and others).

import React from 'react';
import { createRoot } from 'react-dom/client';

import S3Widget from './components/S3Widget';

// Fallback for an older core that predates `getMediaLibraryContext` and so
// passes us no token at all. Reads only the access token: everything else Decap
// persists here (the refresh token in particular) is none of this package's
// business.
function readStoredAccessToken() {
  try {
    const stored = window.localStorage.getItem('decap-cms-user');
    const parsed = stored ? JSON.parse(stored) : null;
    return (parsed && (parsed.access_token || parsed.token)) || null;
  } catch (_error) {
    return null;
  }
}

function getBackendConfigFromWindow() {
  if (window.CMS_CONFIG && window.CMS_CONFIG.backend) {
    return window.CMS_CONFIG.backend;
  }
  return null;
}

function buildEdgeBaseUrl(baseUrl) {
  const normalized = baseUrl.replace(/\/+$/, '');
  return `${normalized}/functions/v1/integrations/s3`;
}

function createContextResolver(providedConfig, getMediaLibraryContext) {
  return async () => {
    const context = getMediaLibraryContext ? await getMediaLibraryContext() : {};
    const backendConfig = context.backendConfig || getBackendConfigFromWindow() || {};

    // `context.token` is the short-lived access token core hands us; the
    // localStorage read only covers a core old enough not to supply one.
    const accessToken = context.token || readStoredAccessToken();
    const activeSiteId = context.activeSiteId || backendConfig.turbo_site_id || null;
    const baseUrl = backendConfig.base_url;

    return {
      accessToken,
      activeSiteId,
      edgeBaseUrl: baseUrl ? buildEdgeBaseUrl(baseUrl) : null,
    };
  };
}

/**
 * Initialize the S3-compatible media library
 * @param options - Configuration options including public_url_prefix
 * @param handleInsert - Callback function when user inserts files
 * @returns MediaLibraryInstance with show, hide, and other required methods
 */
async function init({ options = {}, handleInsert = () => {}, getMediaLibraryContext } = {}) {
  const { config: providedConfig = {} } = options;

  if (!providedConfig.public_url_prefix) {
    throw new Error('public_url_prefix is required in media_library config');
  }

  const resolveRequestContext = createContextResolver(providedConfig, getMediaLibraryContext);

  const config = providedConfig;
  let widgetContainer = null;
  let widgetRoot = null;
  let isOpen = false;

  const mediaLibraryInstance = {
    show: ({ allowMultiple = false, imagesOnly = false, config: instanceConfig = {} } = {}) => {
      if (isOpen) return;

      const resolvedMultiple =
        allowMultiple !== false && Boolean(instanceConfig.multiple ?? providedConfig.multiple);

      if (!widgetContainer) {
        widgetContainer = document.createElement('div');
        document.body.appendChild(widgetContainer);
      }

      isOpen = true;

      widgetRoot = createRoot(widgetContainer);

      widgetRoot.render(
        React.createElement(S3Widget, {
          config,
          resolveRequestContext,
          onInsert: insertedValue => {
            handleInsert(insertedValue);
            mediaLibraryInstance.hide();
          },
          onClose: () => {
            mediaLibraryInstance.hide();
          },
          allowMultiple: resolvedMultiple,
          imagesOnly,
        }),
      );
    },

    hide: () => {
      if (!isOpen || !widgetRoot) return;

      isOpen = false;

      widgetRoot.unmount();

      if (widgetContainer && widgetContainer.parentNode) {
        widgetContainer.parentNode.removeChild(widgetContainer);
        widgetContainer = null;
        widgetRoot = null;
      }
    },

    onClearControl: () => {},

    onRemoveControl: () => {},

    /**
     * Enable standalone mode - allows widget to appear in toolbar and field buttons
     */
    enableStandalone: () => true,
  };

  return mediaLibraryInstance;
}

const s3MediaLibrary = {
  name: 's3',
  init,
};

export const DecapCmsMediaLibraryS3 = s3MediaLibrary;
export default s3MediaLibrary;
