"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rehypePaperEmoji;
/**
 * Dropbox Paper outputs emoji characters as images, and stores the actual
 * emoji character in a `data-emoji-ch` attribute on the image. This plugin
 * replaces the images with the emoji characters.
 */
function rehypePaperEmoji() {
  function transform(node) {
    if (node.tagName === 'img' && node.properties.dataEmojiCh) {
      return {
        type: 'text',
        value: node.properties.dataEmojiCh
      };
    }
    node.children = node.children ? node.children.map(transform) : node.children;
    return node;
  }
  return transform;
}