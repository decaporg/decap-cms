/* eslint-disable */
/*
  Based closely on
  https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/from_markdown.js
*/

import Remark from "remark";
const visit = require("unist-util-visit");
const { Mark } = require("prosemirror-model");

let schema;
let activeMarks = Mark.none;
let textsArray = [];

// Setup Remark.
const remark = new Remark({
  commonmark: true,
  footnotes: true,
  pedantic: true,
});

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

  return doc;
};

const compileMarkdownToProseMirror = src => {
  // console.log(src);
  // Clear out any old state.
  let activeMarks = Mark.none;
  let textsArray = [];

  const mdast = remark.parse(src);
  const doc = processMdastNode(mdast);
  return doc;
};

module.exports = (s, plugins) => {
  //console.log(s)
  //console.log(s.nodes.code_block.create({ params: { language: 'javascript' } }))
  schema = s;
  return compileMarkdownToProseMirror;
};
