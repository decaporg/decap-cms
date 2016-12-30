/* eslint-disable */
/*
  Based closely on
  https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/from_markdown.js

  Adds a bit of logic allowing editor plugins to hook into the parsing.
*/

const markdownit = require("markdown-it")
const {Mark} = require("prosemirror-model")

function maybeMerge(a, b) {
  if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks))
    return a.copy(a.text + b.text)
}

function pluginHandler(schema, plugins) {
  return (type, attrs, content) => {
    if (type.name === 'paragraph' && content.length === 1 && content[0].type.name === 'text') {
      const text = content[0].text;
      const plugin = plugins.find(plugin => plugin.get('pattern').test(text));
      if (plugin) {
        const nodeType = schema.nodes[`plugin_${ plugin.get('id') }`];
        const data = plugin.get('fromBlock').call(plugin, text.match(plugin.get('pattern')));
        return nodeType.create(data);
      }
    }
    return null;
  };
}

// Object used to track the context of a running parse.
class MarkdownParseState {
  constructor(schema, plugins, tokenHandlers) {
    this.schema = schema
    this.stack = [{type: schema.nodes.doc, content: []}]
    this.marks = Mark.none
    this.tokenHandlers = tokenHandlers
    this.pluginHandler = pluginHandler(schema, plugins);
  }

  top() {
    return this.stack[this.stack.length - 1]
  }

  push(elt) {
    if (this.stack.length) this.top().content.push(elt)
  }

  // : (string)
  // Adds the given text to the current position in the document,
  // using the current marks as styling.
  addText(text) {
    if (!text) return
    let nodes = this.top().content, last = nodes[nodes.length - 1]
    let node = this.schema.text(text, this.marks), merged
    if (last && (merged = maybeMerge(last, node))) nodes[nodes.length - 1] = merged
    else nodes.push(node)
  }

  // : (Mark)
  // Adds the given mark to the set of active marks.
  openMark(mark) {
    this.marks = mark.addToSet(this.marks)
  }

  // : (Mark)
  // Removes the given mark from the set of active marks.
  closeMark(mark) {
    this.marks = mark.removeFromSet(this.marks)
  }

  parseTokens(toks) {
    for (let i = 0; i < toks.length; i++) {
      let tok = toks[i]
      let handler = this.tokenHandlers[tok.type]
      if (!handler)
        throw new Error("Token type `" + tok.type + "` not supported by Markdown parser")
      handler(this, tok)
    }
  }

  // : (NodeType, ?Object, ?[Node]) → ?Node
  // Add a node at the current position.
  addNode(type, attrs, content) {
    const node = this.pluginHandler(type, attrs, content) || type.createAndFill(attrs, content, this.marks);
    if (!node) return null
    this.push(node)
    return node
  }

  // : (NodeType, ?Object)
  // Wrap subsequent content in a node of the given type.
  openNode(type, attrs) {
    this.stack.push({type: type, attrs: attrs, content: []})
  }

  // : () → ?Node
  // Close and return the node that is currently on top of the stack.
  closeNode() {
    if (this.marks.length) this.marks = Mark.none
    let info = this.stack.pop()
    return this.addNode(info.type, info.attrs, info.content)
  }
}

function attrs(given, token) {
  return given instanceof Function ? given(token) : given
}

// Code content is represented as a single token with a `content`
// property in Markdown-it.
function noOpenClose(type) {
  return type == "code_inline" || type == "code_block" || type == "fence"
}

function withoutTrailingNewline(str) {
  return str[str.length - 1] == "\n" ? str.slice(0, str.length - 1) : str
}

function tokenHandlers(schema, tokens) {
  let handlers = Object.create(null)
  for (let type in tokens) {
    let spec = tokens[type]
    if (spec.block) {
      let nodeType =schema.nodeType(spec.block);
      if (noOpenClose(type)) {
        handlers[type] = (state, tok) => {
          state.openNode(nodeType, attrs(spec.attrs, tok))
          state.addText(withoutTrailingNewline(tok.content))
          state.closeNode()
        }
      } else {
        handlers[type + "_open"] = (state, tok) => state.openNode(nodeType, attrs(spec.attrs, tok))
        handlers[type + "_close"] = state => state.closeNode()
      }
    } else if (spec.node) {
      let nodeType = schema.nodeType(spec.node)
      handlers[type] = (state, tok) => state.addNode(nodeType, attrs(spec.attrs, tok))
    } else if (spec.mark) {
      let markType = schema.marks[spec.mark]
      if (noOpenClose(type)) {
        handlers[type] = (state, tok) => {
          state.openMark(markType.create(attrs(spec.attrs, tok)))
          state.addText(withoutTrailingNewline(tok.content))
          state.closeMark(markType)
        }
      } else {
        handlers[type + "_open"] = (state, tok) => state.openMark(markType.create(attrs(spec.attrs, tok)))
        handlers[type + "_close"] = state => state.closeMark(markType)
      }
    } else {
      throw new RangeError("Unrecognized parsing spec " + JSON.stringify(spec))
    }
  }

  handlers.text = (state, tok) => state.addText(tok.content)
  handlers.inline = (state, tok) => state.parseTokens(tok.children)
  handlers.softbreak = state => state.addText("\n")

  return handlers
}

// ;; A configuration of a Markdown parser. Such a parser uses
// [markdown-it](https://github.com/markdown-it/markdown-it) to
// tokenize a file, and then runs the custom rules it is given over
// the tokens to create a ProseMirror document tree.
class MarkdownParser {
  // :: (Schema, MarkdownIt, Object)
  // Create a parser with the given configuration. You can configure
  // the markdown-it parser to parse the dialect you want, and provide
  // a description of the ProseMirror entities those tokens map to in
  // the `tokens` object, which maps token names to descriptions of
  // what to do with them. Such a description is an object, and may
  // have the following properties:
  //
  // **`node`**`: ?string`
  //   : This token maps to a single node, whose type can be looked up
  //     in the schema under the given name. Exactly one of `node`,
  //     `block`, or `mark` must be set.
  //
  // **`block`**`: ?string`
  //   : This token comes in `_open` and `_close` variants (which are
  //     appended to the base token name provides a the object
  //     property), and wraps a block of content. The block should be
  //     wrapped in a node of the type named to by the property's
  //     value.
  //
  // **`mark`**`: ?string`
  //   : This token also comes in `_open` and `_close` variants, but
  //     should add a mark (named by the value) to its content, rather
  //     than wrapping it in a node.
  //
  // **`attrs`**`: ?union<Object, (MarkdownToken) → Object>`
  //   : If the mark or node to be created needs attributes, they can
  //     be either given directly, or as a function that takes a
  //     [markdown-it
  //     token](https://markdown-it.github.io/markdown-it/#Token) and
  //     returns an attribute object.
  constructor(schema, plugins, tokenizer, tokens) {
    // :: Object The value of the `tokens` object used to construct
    // this parser. Can be useful to copy and modify to base other
    // parsers on.
    this.tokens = tokens
    this.schema = schema
    this.tokenizer = tokenizer
    this.plugins = plugins
    this.tokenHandlers = tokenHandlers(schema, tokens)
  }

  // :: (string) → Node
  // Parse a string as [CommonMark](http://commonmark.org/) markup,
  // and create a ProseMirror document as prescribed by this parser's
  // rules.
  parse(text) {
    let state = new MarkdownParseState(this.schema, this.plugins, this.tokenHandlers), doc
    state.parseTokens(this.tokenizer.parse(text, {}))
    do { doc = state.closeNode() } while (state.stack.length)
    return doc
  }
}

// :: MarkdownParser
// A parser parsing unextended [CommonMark](http://commonmark.org/),
// without inline HTML, and producing a document in the basic schema.
export default function createMarkdownParser(schema, plugins) {
  const tokens = {
    blockquote: {block: "blockquote"},
    paragraph: {block: "paragraph"},
    list_item: {block: "list_item"},
    // Note - we force lists to be tight here, while that's not ProseMirror's default
    // The default behavior means list elements always have a `p` inside, and we want
    // to avoid tha.
    bullet_list: {block: "bullet_list", attrs: tok => ({tight: true})},
    ordered_list: {block: "ordered_list", attrs: tok => ({tight: true, order: +tok.attrGet("order") || 1})},
    heading: {block: "heading", attrs: tok => ({level: +tok.tag.slice(1)})},
    code_block: {block: "code_block"},
    fence: {block: "code_block"},
    hr: {node: "horizontal_rule"},
    image: {node: "image", attrs: tok => ({
      src: tok.attrGet("src"),
      title: tok.attrGet("title") || null,
      alt: tok.children[0] && tok.children[0].content || null
    })},
    hardbreak: {node: "hard_break"},

    em: {mark: "em"},
    strong: {mark: "strong"},
    link: {mark: "link", attrs: tok => ({
      href: tok.attrGet("href"),
      title: tok.attrGet("title") || null
    })},
    code_inline: {mark: "code"}
  };

  return new MarkdownParser(schema, plugins, markdownit("commonmark", {html: false}), tokens);
}
