/* eslint-disable */
/*
  Based closely on
  https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/from_markdown.js
*/

import unified from 'unified';
import markdown from 'remark-parse';
import { Mark } from 'prosemirror-model';

let schema;
let plugins
let activeMarks = Mark.none;
let textsArray = [];

const processMdastNode = node => {
  if (node.type === "root") {
    const content = node.children.map(childNode => processMdastNode(childNode));
    return schema.node("doc", {}, content);
  }

  /***
   * Block nodes
   ***/
  // heading and paragraph nodes contain raw text so we need to collect
  // the flat list of text nodes. Other node types contain paragraph nodes.
  if (node.type === "heading") {
    node.children.forEach(childNode => processMdastNode(childNode));
    const pNode = schema.node("heading", { level: node.depth }, textsArray);
    textsArray = [];
    return pNode;
  } else if (node.type === "paragraph") {

    // TODO: improve plugin handling

    // Handle externally defined plugins (they'll be wrapped in paragraphs)
    if (node.children.length === 1 && node.children[0].type === 'text') {
      const value = node.children[0].value;
      const plugin = plugins.find(plugin => plugin.get('pattern').test(value));
      if (plugin) {
        const nodeType = schema.nodes[`plugin_${plugin.get('id')}`];
        const data = plugin.get('fromBlock').call(plugin, value.match(plugin.get('pattern')));
        return nodeType.create(data);
      }
    }

    // Handle the internally defined image plugin. At this point the token has
    // already been parsed as an image by Remark, so we have to catch it by
    // checking for the 'image' type.
    if (node.children.length === 1 && node.children[0].type === 'image') {
      const { url, alt } = node.children[0];

      // Until we improve the editor components API for built in components,
      // we'll mock the result of String.prototype.match to pass in to the image
      // plugin's fromBlock method.
      const matches = [ , alt, url ];
      const plugin = plugins.find(plugin => plugin.id === 'image');
      if (plugin) {
        const nodeType = schema.nodes.plugin_image;
        const data = plugin.get('fromBlock').call(plugin, matches);
        return nodeType.create(data);
      }
    }

    node.children.forEach(childNode => processMdastNode(childNode));
    const pNode = schema.node("paragraph", {}, textsArray);
    textsArray = [];
    return pNode;
  } else if (node.type === "blockquote") {
    const content = node.children.map(childNode => processMdastNode(childNode));
    return schema.node("blockquote", {}, content);
  } else if (node.type === "list") {
    const content = node.children.map(childNode => processMdastNode(childNode));
    if (node.ordered) {
      return schema.node("ordered_list", { tight: true, order: 1 }, content);
    } else {
      return schema.node("bullet_list", { tight: true }, content);
    }
  } else if (node.type === "listItem") {
    const content = node.children.map(childNode => processMdastNode(childNode));
    return schema.node("list_item", {}, content);
  } else if (node.type === "thematicBreak") {
    return schema.node("horizontal_rule");
  } else if (node.type === "break") {
    return schema.node("hard_break");
  } else if (node.type === "image") {
    return schema.node("image", { src: node.url, alt: node.alt });
  } else if (node.type === "code") {
    return schema.node(
      "code_block",
      {
        params: node.lang,
      },
      schema.text(node.value)
    );
  }
  /***
   * End block items
   ***/

  // Inline
  if (node.type === "text") {
    textsArray.push(schema.text(node.value, activeMarks));
    return;
  } else if (node.type === "emphasis") {
    const mark = schema.marks["em"].create();
    activeMarks = mark.addToSet(activeMarks);
    node.children.forEach(childNode => processMdastNode(childNode));
    activeMarks = mark.removeFromSet(activeMarks);
    return;
  } else if (node.type === "strong") {
    const mark = schema.marks["strong"].create();
    activeMarks = mark.addToSet(activeMarks);
    node.children.forEach(childNode => processMdastNode(childNode));
    activeMarks = mark.removeFromSet(activeMarks);
    return;
  } else if (node.type === "link") {
    const mark = schema.marks["strong"].create({
      title: node.title,
      href: node.url,
    });
    activeMarks = mark.addToSet(activeMarks);
    node.children.forEach(childNode => processMdastNode(childNode));
    activeMarks = mark.removeFromSet(activeMarks);
    return;
  } else if (node.type === "inlineCode") {
    // Inline code is like a text node in that it can't have children
    // so we add it to textsArray immediately.
    const mark = schema.marks["code"].create();
    activeMarks = mark.addToSet(activeMarks);
    textsArray.push(schema.text(node.value, activeMarks));
    activeMarks = mark.removeFromSet(activeMarks);
    return;
  }

  return node;
};

const compileMarkdownToProseMirror = src => {
  // Clear out any old state.
  let activeMarks = Mark.none;
  let textsArray = [];

  const result = unified()
    .use(markdown, { commonmark: true, footnotes: true, pedantic: true })
    .parse(src);

  const output = unified()
    .use(() => processMdastNode)
    .runSync(result);

  return output;
};

const parser = (s, p) => {
  schema = s;
  plugins = p;
  return compileMarkdownToProseMirror;
};

export default parser;
