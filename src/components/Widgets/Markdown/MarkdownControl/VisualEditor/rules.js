import { Block, Text } from 'slate';

/**
 * Rules are used to validate the editor state each time it changes, to ensure
 * it is never rendered in an undesirable state.
 */

/**
 * If the editor is ever in an empty state, insert an empty
 * paragraph block.
 */
const enforceNeverEmpty = {
  match: object => object.kind === 'document',
  validate: doc => {
    const hasBlocks = !doc.getBlocks().isEmpty();
    return hasBlocks ? null : {};
  },
  normalize: transform => {
    const block = Block.create({
      type: 'paragraph',
      nodes: [Text.createFromString('')],
    });
    const { key } = transform.state.document;
    return transform.insertNodeByKey(key, 0, block).focus();
  },
};

/**
 * Ensure that shortcodes are children of the root node.
 */
const shortcodesAtRoot = {
  match: object => object.kind === 'document',
  validate: doc => {
    return doc.findDescendant(node => {
      return node.type === 'shortcode' && doc.getParent(node.key).key !== doc.key;
    });
  },
  normalize: (transform, doc, node) => {
    return transform.unwrapNodeByKey(node.key);
  },
};

const rules = [ enforceNeverEmpty, shortcodesAtRoot ];

export default rules;
