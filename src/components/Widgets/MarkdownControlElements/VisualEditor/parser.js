/* eslint-disable */
/*
  Based closely on
  https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/from_markdown.js
*/

import Remark from "remark";
const visit = require('unist-util-visit')
const {Mark} = require("prosemirror-model")

let schema

// Setup Remark.
const remark = new Remark({
  commonmark: true,
  footnotes: true,
  pedantic: true,
});

const processMdastNode = (node) => {
  console.log('processMdastNode', node)
  if (node.type === 'root') {
    const content = node.children.map((childNode) => (
      processMdastNode(childNode)
    ))
    return schema.node('doc', {}, content)
  }

  /***
   * Block nodes
   ***/
  if (node.type === 'heading') {
    const content = node.children.map((childNode) => (
      processMdastNode(childNode)
    ))
    console.log(content)
    return schema.node('heading', { level: node.depth }, content)
  } else if (node.type === 'paragraph') {
    const content = node.children.map((childNode) => (
      processMdastNode(childNode)
    ))
    return schema.node('paragraph', {}, content)
  } else if (node.type === 'list') {
    const content = node.children.map((childNode) => (
      processMdastNode(childNode)
    ))
    if (node.ordered) {
      return schema.node('ordered_list', { tight: true, order: 1 }, content)
    } else {
      return schema.node('bullet_list', {}, content)
    }
  } else if (node.type === 'listItem') {
    const content = node.children.map((childNode) => (
      processMdastNode(childNode)
    ))
    return schema.node('list_item', {}, content)
  } else if (node.type === 'thematicBreak') {
    return schema.node('horizontal_rule')
  } else if (node.type === 'break') {
    return schema.node('hard_break')
  } else if (node.type === 'image') {
    return schema.node('image', { src: node.url, alt: node.alt })
  }
  /***
   * end block items
   ***/

  // Inline
  if (node.type === 'text') {
    console.log('text value', node.value)
    return schema.text(node.value)
  }

  return doc
}

const compileMarkdownToProseMirror = (src) => {
  console.log(src)
  const mdast = remark.parse(src)
  console.log(mdast)
  const doc = processMdastNode(mdast)
  console.log(doc.content)
  return doc
}

module.exports = (s, plugins) => {
  //console.log(s)
  //console.log(s.nodes.code_block.create({ params: { language: 'javascript' } }))
  schema = s
  return compileMarkdownToProseMirror
}
