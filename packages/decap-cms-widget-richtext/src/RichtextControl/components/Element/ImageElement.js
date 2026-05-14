import React from 'react';
import { PlateElement } from 'platejs/react';

function isAbsoluteAssetUrl(url) {
  return /^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:');
}

function resolveImageSource(url, getAsset, field) {
  if (!url) {
    return '';
  }

  if (!getAsset || isAbsoluteAssetUrl(url)) {
    return url;
  }

  const asset = getAsset(url, field);
  return asset && typeof asset.toString === 'function' ? asset.toString() : asset;
}

function ImageElement({ children, element, getAsset, field, ...props }) {
  const { alt, title, url } = element?.data || {};
  const src = resolveImageSource(url, getAsset, field);

  return (
    <PlateElement
      as="span"
      element={element}
      contentEditable={false}
      style={{ display: 'inline-block' }}
      {...props}
    >
      <img
        src={src || ''}
        alt={alt || ''}
        title={title || ''}
        style={{ maxWidth: '100%', height: 'auto', verticalAlign: 'middle' }}
      />
      {children}
    </PlateElement>
  );
}

export default ImageElement;
