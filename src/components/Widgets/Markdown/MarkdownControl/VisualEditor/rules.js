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

const rules = [ enforceNeverEmpty ];

export default rules;
