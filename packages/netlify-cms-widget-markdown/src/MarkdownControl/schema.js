import { Inline, Text } from 'slate';

const codeBlock = {
  match: [{ object: 'block', type: 'code-block' }],
  nodes: [
    {
      match: [{ object: 'text' }],
    },
  ],
  normalize: (editor, error) => {
    switch (error.code) {
      // Replace break nodes with newlines
      case 'child_object_invalid': {
        const { child } = error;
        if (Inline.isInline(child) && child.type === 'break') {
          editor.replaceNodeByKey(child.key, Text.create({ text: '\n' }));
          return;
        }
      }
    }
  },
};

const codeBlockOverride = {
  match: [{ object: 'block', type: 'code-block' }],
  isVoid: true,
};

const schema = ({ voidCodeBlock } = {}) => ({
  rules: [
    /**
     * Document
     */
    {
      match: [{ object: 'document' }],
      nodes: [
        {
          match: [
            { type: 'paragraph' },
            { type: 'heading-one' },
            { type: 'heading-two' },
            { type: 'heading-three' },
            { type: 'heading-four' },
            { type: 'heading-five' },
            { type: 'heading-six' },
            { type: 'quote' },
            { type: 'code-block' },
            { type: 'bulleted-list' },
            { type: 'numbered-list' },
            { type: 'thematic-break' },
            { type: 'table' },
            { type: 'shortcode' },
          ],
          min: 1,
        },
      ],
      normalize: (editor, error) => {
        switch (error.code) {
          // If no blocks present, insert one.
          case 'child_min_invalid': {
            const node = { object: 'block', type: 'paragraph' };
            editor.insertNodeByKey(error.node.key, 0, node);
            return;
          }
        }
      },
    },

    /**
     * Block Containers
     */
    {
      match: [
        { object: 'block', type: 'quote' },
        { object: 'block', type: 'list-item' },
      ],
      nodes: [
        {
          match: [
            { type: 'paragraph' },
            { type: 'heading-one' },
            { type: 'heading-two' },
            { type: 'heading-three' },
            { type: 'heading-four' },
            { type: 'heading-five' },
            { type: 'heading-six' },
            { type: 'quote' },
            { type: 'code-block' },
            { type: 'bulleted-list' },
            { type: 'numbered-list' },
            { type: 'thematic-break' },
            { type: 'table' },
            { type: 'shortcode' },
          ],
        },
      ],
    },

    /**
     * List Items
     */
    {
      match: [{ object: 'block', type: 'list-item' }],
      parent: [{ type: 'bulleted-list' }, { type: 'numbered-list' }],
    },

    /**
     * Blocks
     */
    {
      match: [
        { object: 'block', type: 'paragraph' },
        { object: 'block', type: 'heading-one' },
        { object: 'block', type: 'heading-two' },
        { object: 'block', type: 'heading-three' },
        { object: 'block', type: 'heading-four' },
        { object: 'block', type: 'heading-five' },
        { object: 'block', type: 'heading-six' },
        { object: 'block', type: 'table-cell' },
        { object: 'inline', type: 'link' },
      ],
      nodes: [
        {
          match: [{ object: 'text' }, { type: 'link' }, { type: 'image' }, { type: 'break' }],
        },
      ],
    },

    /**
     * Bulleted List
     */
    {
      match: [{ object: 'block', type: 'bulleted-list' }],
      nodes: [
        {
          match: [{ type: 'list-item' }],
          min: 1,
        },
      ],
      next: [
        { type: 'paragraph' },
        { type: 'heading-one' },
        { type: 'heading-two' },
        { type: 'heading-three' },
        { type: 'heading-four' },
        { type: 'heading-five' },
        { type: 'heading-six' },
        { type: 'quote' },
        { type: 'code-block' },
        { type: 'numbered-list' },
        { type: 'thematic-break' },
        { type: 'table' },
        { type: 'shortcode' },
      ],
      normalize: (editor, error) => {
        switch (error.code) {
          // If a list has no list items, remove the list
          case 'child_min_invalid':
            editor.removeNodeByKey(error.node.key);
            return;

          // If two bulleted lists are immediately adjacent, join them
          case 'next_sibling_type_invalid':
            if (error.next.type === 'bulleted-list') {
              editor.mergeNodeByKey(error.next.key);
            }
            return;
        }
      },
    },

    /**
     * Numbered List
     */
    {
      match: [{ object: 'block', type: 'numbered-list' }],
      nodes: [
        {
          match: [{ type: 'list-item' }],
          min: 1,
        },
      ],
      next: [
        { type: 'paragraph' },
        { type: 'heading-one' },
        { type: 'heading-two' },
        { type: 'heading-three' },
        { type: 'heading-four' },
        { type: 'heading-five' },
        { type: 'heading-six' },
        { type: 'quote' },
        { type: 'code-block' },
        { type: 'bulleted-list' },
        { type: 'thematic-break' },
        { type: 'table' },
        { type: 'shortcode' },
      ],
      normalize: (editor, error) => {
        switch (error.code) {
          // If a list has no list items, remove the list
          case 'child_min_invalid':
            editor.removeNodeByKey(error.node.key);
            return;

          // If two numbered lists are immediately adjacent, join them
          case 'next_sibling_type_invalid': {
            if (error.next.type === 'numbered-list') {
              editor.mergeNodeByKey(error.next.key);
            }
            return;
          }
        }
      },
    },

    /**
     * Voids
     */
    {
      match: [
        { object: 'inline', type: 'image' },
        { object: 'inline', type: 'break' },
        { object: 'block', type: 'thematic-break' },
        { object: 'block', type: 'shortcode' },
      ],
      isVoid: true,
    },

    /**
     * Table
     */
    {
      match: [{ object: 'block', type: 'table' }],
      nodes: [
        {
          match: [{ object: 'block', type: 'table-row' }],
        },
      ],
    },

    /**
     * Table Row
     */
    {
      match: [{ object: 'block', type: 'table-row' }],
      nodes: [
        {
          match: [{ object: 'block', type: 'table-cell' }],
        },
      ],
    },

    /**
     * Marks
     */
    {
      match: [
        { object: 'mark', type: 'bold' },
        { object: 'mark', type: 'italic' },
        { object: 'mark', type: 'strikethrough' },
        { object: 'mark', type: 'code' },
      ],
    },

    /**
     * Overrides
     */
    voidCodeBlock ? codeBlockOverride : codeBlock,
  ],
});

export default schema;
