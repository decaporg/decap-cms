import Ember from 'ember';
import createElement from 'npm:virtual-dom/create-element';
import VNode from 'npm:virtual-dom/vnode/vnode';
import VText from 'npm:virtual-dom/vnode/vtext';
import diff from 'npm:virtual-dom/diff';
import patch from 'npm:virtual-dom/patch';
/* global marked */

var attrs ={};
[
  "class", "style",
  "allowfullscreen", "allowtransparency", "charset", "cols", "contextmenu", "datetime", "disabled", "form", "frameborder",
  "height", "hidden", "maxlength", "role", "rows", "seamless", "size", "width", "wmode",
  "cx", "cy", "d", "dx", "dy", "fill", "fx", "fy", "gradientTransform", "gradientUnits", "offset", "points", "r", "rx", "ry",
  "spreadMethod", "stopColor", "stopOpacity", "stroke", "strokeLinecap", "strokeWidth", "textAnchor", "transform", "version",
  "viewBox", "x1", "x2", "x", "y1", "y2", "y"
].forEach(function(attr) {
  attrs[attr] = true;
});


export default Ember.Component.extend({
  tagName: "div",

  createVNode: function(domNode, key) {
    key = key || null; // XXX: Leave out `key` for now... merely used for (re-)ordering

    if(domNode.nodeType === 1) {
      return this.createFromElement(domNode, key);
    }
    if(domNode.nodeType === 3) {
      return this.createFromTextNode(domNode, key);
    }
    return;
  },

  vdomFromHtml: function(html, key) {
    var domNode = document.createElement('div'); // create container
    domNode.innerHTML = html; // browser parses HTML into DOM tree
    domNode = domNode.children[0] || domNode; // select first node in tree
    return this.createVNode(domNode, key);
  },

  createFromTextNode: function(tNode) {
    return new VText(tNode.nodeValue);
  },

  createFromElement: function(el) {
    var tagName = el.tagName;
    var namespace = el.namespaceURI === 'http://www.w3.org/1999/xhtml'? null : el.namespaceURI;
    var properties = this.getElementProperties(el);
    var children = [];
    var node = null;

    for (var i = 0; i < el.childNodes.length; i++) {
      node = this.createVNode(el.childNodes[i]/*, i*/);
      if (node) {
          children.push(node);
      }
    }

    return new VNode(tagName, properties, children, null, namespace);
  },

  getElementProperties: function(el) {
    var name,value,mediaFile;
    var obj = {};
    for (var i=0, len=el.attributes.length; i<len; i++) {
      name = el.attributes[i].name;
      value = el.attributes[i].value;
      if (attrs[name]) {
        obj.attributes = obj.attributes || {};
        obj.attributes[name] = value;
      } else if (name === "src") {
        mediaFile = this.get("media").find(value);
        obj.src = mediaFile ? mediaFile.src : value;
      } else {
        obj[el.attributes[i].name] = el.attributes[i].value;  
      }
    }
    return obj;
  },
  didInsertElement: function() {
    var vdom = this.createVdom();
    var rootNode = createElement(vdom);
    this.element.appendChild(rootNode);
    this.set("vdom", vdom);
    this.set("root", rootNode);
  },
  updateVDOM: function() {
    var vdom = this.get("vdom");
    var newTree = this.createVdom();
    var patches = diff(vdom, newTree);
    var rootNode = patch(this.get("root"), patches);
    this.set("root", rootNode);
    this.set("vdom", newTree);
  }.observes("widget.value"),

  createVdom: function() {
    return this.vdomFromHtml("<div>" + marked(this.get("widget.value") || "") + "</div>"); 
  }
});