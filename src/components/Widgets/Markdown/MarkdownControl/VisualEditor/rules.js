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
  normalize: change => {
    const block = Block.create({
      type: 'paragraph',
      nodes: [Text.create('')],
    });
    const { key } = change.state.document;
    return change.insertNodeByKey(key, 0, block).focus();
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
  normalize: (change, doc, node) => {
    return change.unwrapNodeByKey(node.key);
  },
};

/**
 * Ensure that trailing shortcodes are followed by an empty paragraph.
 */
const noTrailingShortcodes = {
  match: object => object.kind === 'document',
  validate: doc => {
    return doc.findDescendant(node => {
      return node.type === 'shortcode' && doc.getBlocks().last().key === node.key;
    });
  },
  normalize: (change, doc, node) => {
    const text = Text.create('');
    const block = Block.create({ type: 'paragraph', nodes: [ text ] });
    return change.insertNodeByKey(doc.key, doc.get('nodes').size, block);
  },
};

/**
 * Ensure that code blocks contain no marks.
 */
const codeBlocksContainPlainText = {
  match: node => node.type === 'code',
  validate: node => {
    const invalidChild = node.getTexts().find(text => !text.getMarks().isEmpty());
    return invalidChild || null;
  },
  normalize: (change, node, invalidChild) => {
    invalidChild.getMarks().forEach(mark => {
      change.removeMarkByKey(invalidChild.key, 0, invalidChild.get('characters').size, mark);
    });
  },
};

const rules = [ enforceNeverEmpty, shortcodesAtRoot, noTrailingShortcodes, codeBlocksContainPlainText ];

export default rules;
