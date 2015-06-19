import commonmark from 'npm:commonmark';
import VNode from 'npm:virtual-dom/vnode/vnode';
import VText from 'npm:virtual-dom/vnode/vtext';
/* global HTMLParser */
/*jshint scripturl:true*/

/*
  Lookup table for all DOM attributes
*/
var getAttrs = {};
[
  "class", "style",
  "allowfullscreen", "allowtransparency", "charset", "cols", "contextmenu", "datetime", "disabled", "form", "frameborder",
  "height", "hidden", "maxlength", "role", "rows", "seamless", "size", "width", "wmode",
  "cx", "cy", "d", "dx", "dy", "fill", "fx", "fy", "gradientTransform", "gradientUnits", "offset", "points", "r", "rx", "ry",
  "spreadMethod", "stopColor", "stopOpacity", "stroke", "strokeLinecap", "strokeWidth", "textAnchor", "transform", "version",
  "viewBox", "x1", "x2", "x", "y1", "y2", "y"
].forEach(function(attr) {
  getAttrs[attr] = true;
});

/*
  Lookup table to convert from Markdown nodes to VDOM nodes
*/
var nodeTypes = {
  Paragraph: "p",
  Item: "li",
  BlockQuote: "blockquote",
  Link: "a",
  Emph: "em",
  Strong: "strong",
  Hardbreak: "br",
  HorizontalRule: "hr"
};

/*
  Handler used with HTMLParser to convert HTML to VDOM
*/
class HTMLHandler {
  /*
    We need the global media store so we can handle image sources for uploaded
    images.
  */
  static htmlToVDOM(html, media) {
    var handler = new HTMLHandler(media);

    try {
      new HTMLParser(html, handler);
    } catch (_) {
      return [new VText(html)];
    }

    return handler.getNodes();
  }

  constructor(media) {
    this.media = media;
    this.stack = [{tagName: "none", children: []}];
    this.current = this.stack[0];
  }

  start(tagName, attrs, unary) {
    this.stack.push({tagName: tagName, properties: this.propertiesFor(tagName, attrs), children: []});
    this.current = this.stack[this.stack.length - 1];
    if (unary) {
      this.end(tagName);
    }
  }

  end(tagName) {
    var newNode = new VNode(this.current.tagName, this.current.properties, this.current.children);
    this.stack.pop();
    this.current = this.stack[this.stack.length - 1];
    if (tagName === "script") {
      return;
    }
    this.current.children.push(newNode);
  }

  chars(text) {
    this.current.children.push(new VText(text));
  }

  propertiesFor(tagName, attrs) {
    var properties = {};
    var value;
    attrs.forEach((attr) => {
      value = (attr.value || "").indexOf('javascript:') === 0 ? "" : attr.value;
      if (getAttrs[attr.name]) {
        properties.attributes = properties.attributes || {};
        properties.attributes[attr.name] = value;
      } else if (attr.name.indexOf("on") === 0) {
        // Skip
      } else if (attr.name === "src") {
        properties.src = this.media.srcFor(value);
      } else {
        properties[attr.name] = value;
      }
    });
    if (tagName === "a") {
      properties.target = "_blank";
    }
    return properties;
  }

  getNodes() {
    return this.current.children;
  }
}

/*
  MarkdownProcessor - Converts a Markdown string to a virtual DOM.
*/
class MarkdownProcessor {
  constructor(media) {
    this.media = media;
    this.markdownParser = new commonmark.Parser();
  }

  markdownToVDOM(markdown) {
    var event, entering, node, newNode, html, grandparent;
    var ast = this.markdownParser.parse(markdown || "");
    var walker = ast.walker();
    var stack = [{tagName: "div", properties: {}, children: []}];
    var current = stack[0];

    while (event = walker.next()) {
      entering = event.entering;
      node = event.node;
      switch(node.type) {
        case 'Text':
          current.children.push(new VText(node.literal));
          break;
        case 'Softbreak':
          current.children.push(new VText("\n"));
          break;
        case 'Hardbreak':
        case 'HorizontalRule':
          current.children.push(new VNode(this.tagNameFor(node), {}, []));
          break;
        case 'Emph':
        case 'Strong':
        case 'BlockQuote':
        case 'Item':
        case 'List':
        case 'Link':
        case 'Header':
        case 'Paragraph':
          if (node.type === "Paragraph") {
            grandparent = node.parent.parent;
            if (grandparent !== null &&
                grandparent.type === 'List') {
                if (grandparent.listTight) {
                    break;
                }
            }
          }
          if (entering) {
            stack.push({tagName: this.tagNameFor(node), properties: this.propertiesFor(node), children: []});
            current = stack[stack.length - 1];
          } else {
            if (current.html) {
              var newChildren = [];
              html = "";
              current.children.forEach(child => {
                if (child.type === "VirtualText") {
                  html += child.text;
                } else {
                  HTMLHandler.htmlToVDOM(html, this.media).forEach(node => {
                    newChildren.push(node);
                  });
                  html = "";
                  newChildren.push(child);
                }
              });
              HTMLHandler.htmlToVDOM(html, this.media).forEach(node => {
                newChildren.push(node);
              });
              current.children = newChildren;
            }
            newNode = new VNode(current.tagName, current.properties, current.children);
            stack.pop();
            current = stack[stack.length - 1];
            current.children.push(newNode);
          }
          break;
        case 'Image':
          if (entering) {
            stack.push({tagName: "img", properties: this.propertiesFor(node), children: []});
            current = stack[stack.length - 1];
          } else {
            if (current.children.length) {
              current.properties.alt = "";
              current.children.forEach((child) => {
                current.properties.alt += child.text || "";
              });
            }
            newNode = new VNode(current.tagName, current.properties, []);
            stack.pop();
            current = stack[stack.length - 1];
            current.children.push(newNode);
          }
          break;
        case 'Code':
          current.children.push(new VNode("code", {}, [new VText(node.literal)]));
          break;
        case 'CodeBlock':
          current.children.push(new VNode("pre", {}, [
            new VNode("code", this.propertiesFor(node), [new VText(node.literal)])
          ]));
          break;
        case 'Html':
          current.html = true;
          current.children.push(new VText(node.literal));
          break;
        case 'HtmlBlock':
          HTMLHandler.htmlToVDOM(node.literal, this.media).forEach(node => {
            current.children.push(node);
          });
          break;
        default:
          // Do nothing
      }
    }

    return new VNode(current.tagName, current.properties, current.children);
  }

  tagNameFor(node) {
    switch(node.type) {
      case "Header":
        return `h${node.level}`;
      case "List":
        return node.listType === "Bullet" ? "ul" : "ol";
      default:
        return nodeTypes[node.type];
    }
  }

  propertiesFor(node) {
    var infoWords;
    var properties = {};
    switch(node.type) {
      case 'Link':
        properties.href = node.destination;
        properties.target = "_blank";
        if (node.title) {
          properties.title = node.title;
        }
        break;
      case 'Image':
        properties.src = this.media.srcFor(node.destination);
        break;
      case 'CodeBlock':
        infoWords = node.info ? node.info.split(/ +/) : [];
        if (infoWords.length > 0 && infoWords[0].length > 0) {
          properties.attributes = {"class": "language-" + infoWords[0]};
        }
        break;
      default:
        break;
    }
    return properties;
  }
}

export default MarkdownProcessor;
