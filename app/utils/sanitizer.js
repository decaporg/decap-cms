/* global HTMLParser */

/**
@module app
@submodule utils
*/

/* Helpers for transforming messy pasted in HTML to clean Markup */
var selfClosing = {
  img: true,
  hr: true,
  br: true
};

var whitespace = /^\s*$/;

class Node {
  constructor(node) {
    this.node = node;
  }
  render() {
    var text = (this.node.text || "").replace(/\n/g, '').replace(/(&nbsp;)+/g, ' ');
    return text.replace(/\s+/g, ' ');
  }
}

class Root extends Node {
  render() {
    var result = "";
    for (var i=0, len=this.node.children.length; i<len; i++) {
      result += this.node.children[i].render();
    }
    return result;
  }
}

class Tag extends Root {
  render() {
    var innerHTML = super.render();
    if (!selfClosing[this.node.tagName] && whitespace.test(innerHTML)) {
      return innerHTML.replace(/\s+/, ' ');
    }
    switch(this.node.tagName) {
      case "strong":
      case "b":
        return `**${innerHTML.trim()}**`;
      case "em":
      case "i":
        return `_${innerHTML.trim()}_`;
      case "a":
        return `[${innerHTML.trim().replace(/\s+/, ' ')}](${this.node.attrs.href})`;
      case "img":
        return `![${this.node.attrs.alt || ''}](${this.node.attrs.src})`;
      case "hr":
        return `\n\n--------\n\n`;
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return `${this.headerPrefix(this.node.tagName)} ${innerHTML.replace(/\s+/, ' ').trim()}\n\n`;
      case "div":
        return `${innerHTML}\n\n`;
      case "p":
        return `${innerHTML}\n\n`;
      case "li":
        return `* ${innerHTML}\n`;
      case "br":
        return `  \n`;
    }
    return innerHTML;
  }
  headerPrefix(tagName) {
    var count = parseInt(tagName.substr(1), 10);
    var prefix = "";
    for (var i=0; i<count; i++) {
      prefix += "#";
    }
    return prefix;
  }
}

class HTMLHandler {
  constructor() {
    this.stack = [{tagName: "html", children: []}];
    this.current = this.stack[0];
  }
  start(tagName, attrs, unary) {
    this.stack.push({tagName: tagName, attrs: this.attrsFor(attrs), children: []});
    this.current = this.stack[this.stack.length - 1];
    if (unary) {
      this.end(tagName);
    }
  }
  end() {
    var newNode = new Tag(this.current);
    this.stack.pop();
    this.current = this.stack[this.stack.length - 1];
    this.current.children.push(newNode);
  }
  chars(text) {

    this.current.children.push(new Node({text: text}));
  }
  attrsFor(attrs) {
    var obj = {};
    attrs.forEach((attr) => {
      obj[attr.name] = attr.value;
    });
    return obj;
  }
  getText() {
    return new Root(this.current).render().replace(/\n\n\n+/g, "\n\n");
  }
}

/**
  An HTML Sanitizer and Markdown converter.

  Will parse HTML and turn it into basic markdown with no inline-HTML blocks.

  Handles strong/b, em/i, links, lists, headings, images, hrs, paragraphs and line breaks.

  @class Sanitizer
*/
class Sanitizer {
  /**
    Takes an HTML string and returns a sanitized markdown string.

    @method sanitize
    @param {String} html
    @return {String} Returns a markdown string
  */
  sanitize(html) {
    var handler = new HTMLHandler();
    try {
      new HTMLParser(html, handler);
    } catch (e) {
      console.log("Error cleaning HTML: %o", e);
      return html;
    }

    return handler.getText();
  }
}


export default Sanitizer;
