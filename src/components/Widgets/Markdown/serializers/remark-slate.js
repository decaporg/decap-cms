import { get, isEmpty } from 'lodash';
import u from 'unist-builder';
import mdastDefinitions from 'mdast-util-definitions';
import modifyChildren from 'unist-util-modify-children';

export default function remarkToSlatePlugin() {
  const typeMap = {
    paragraph: 'paragraph',
    blockquote: 'quote',
    code: 'code',
    listItem: 'list-item',
    table: 'table',
    tableRow: 'table-row',
    tableCell: 'table-cell',
    thematicBreak: 'thematic-break',
    link: 'link',
    image: 'image',
  };
  const markMap = {
    strong: 'bold',
    emphasis: 'italic',
    delete: 'strikethrough',
    inlineCode: 'code',
  };
  const toTextNode = (text, data) => ({ kind: 'text', text, data });
  const wrapText = (node, index, parent) => {
    if (['text', 'html'].includes(node.type)) {
      parent.children.splice(index, 1, u('paragraph', [node]));
    }
  };

  let getDefinition;
  const transform = (node, index, siblings, parent) => {
    let nodes;

    if (node.type === 'root') {
      // Create definition getter for link and image references
      getDefinition = mdastDefinitions(node);
      // Ensure top level text nodes are wrapped in paragraphs
      modifyChildren(wrapText)(node);
    }

    if (isEmpty(node.children)) {
      nodes = node.children;
    } else {
      // If a node returns a falsey value, exclude it. Some nodes do not
      // translate from MDAST to Slate, such as definitions for link/image
      // references or footnotes.
      //
      // Consider using unist-util-remove instead for this.
      nodes = node.children.reduce((acc, childNode, idx, sibs) => {
        const transformed = transform(childNode, idx, sibs, node);
        if (transformed) {
          acc.push(transformed);
        }
        return acc;
      }, []);
    }

    if (node.type === 'root') {
      return { nodes };
    }

    /**
     * Convert MDAST shortcode nodes to Slate 'shortcode' type nodes.
     */
    if (get(node, ['data', 'shortcode'])) {
      const { data } = node;
      const nodes = [ toTextNode('') ];
      return { kind: 'block', type: 'shortcode', data, isVoid: true, nodes };
    }

    // Process raw html as text, since it's valid markdown
    if (['text', 'html'].includes(node.type)) {
      return toTextNode(node.value, node.data);
    }

    if (node.type === 'inlineCode') {
      return { kind: 'text', ranges: [{ text: node.value, marks: [{ type: 'code' }] }] };
    }

    if (['strong', 'emphasis', 'delete'].includes(node.type)) {
      const remarkToSlateMarks = (markNode, parentMarks = []) => {
        const marks = [...parentMarks, { type: markMap[markNode.type] }];
        const ranges = [];
        markNode.children.forEach(childNode => {
          if (['html', 'text'].includes(childNode.type)) {
            ranges.push({ text: childNode.value, marks });
            return;
          }
          const nestedRanges = remarkToSlateMarks(childNode, marks);
          ranges.push(...nestedRanges);
        });
        return ranges;
      };

      return { kind: 'text', ranges: remarkToSlateMarks(node) };
    }

    if (node.type === 'heading') {
      const depths = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };
      return { kind: 'block', type: `heading-${depths[node.depth]}`, nodes };
    }

    if (['paragraph', 'blockquote', 'tableRow', 'tableCell'].includes(node.type)) {
      return { kind: 'block', type: typeMap[node.type], nodes };
    }

    if (node.type === 'code') {
      const data = { lang: node.lang };
      const text = toTextNode(node.value);
      const nodes = [text];
      return { kind: 'block', type: typeMap[node.type], data, nodes };
    }

    if (node.type === 'list') {
      const slateType = node.ordered ? 'numbered-list' : 'bulleted-list';
      const data = { start: node.start };
      return { kind: 'block', type: slateType, data, nodes };
    }

    if (node.type === 'listItem') {
      const data = { checked: node.checked };
      return { kind: 'block', type: typeMap[node.type], data, nodes };
    }

    if (node.type === 'table') {
      const data = { align: node.align };
      return { kind: 'block', type: typeMap[node.type], data, nodes };
    }

    if (node.type === 'thematicBreak') {
      return { kind: 'block', type: typeMap[node.type], isVoid: true };
    }

    if (node.type === 'link') {
      const { title, url } = node;
      const data = { title, url };
      return { kind: 'inline', type: typeMap[node.type], data, nodes };
    }

    if (node.type === 'linkReference') {
      const definition = getDefinition(node.identifier);
      const data = {};
      if (definition) {
        data.title = definition.title;
        data.url = definition.url;
      }
      return { kind: 'inline', type: typeMap['link'], data, nodes };
    }

    if (node.type === 'image') {
      const { title, url, alt } = node;
      const data = { title, url, alt };
      return { kind: 'block', type: typeMap[node.type], data };
    }

    if (node.type === 'imageReference') {
      const definition = getDefinition(node.identifier);
      const data = {};
      if (definition) {
        data.title = definition.title;
        data.url = definition.url;
      }
      return { kind: 'block', type: typeMap['image'], data };
    }
  };

  // Since `transform` is used for recursive child mapping, ensure that only the
  // first argument is supplied on the initial call.
  return node => transform(node);
}
