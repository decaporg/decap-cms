import Ember from 'ember';
import createElement from 'npm:virtual-dom/create-element';
import diff from 'npm:virtual-dom/diff';
import patch from 'npm:virtual-dom/patch';
import MarkdownVDOM from '../../utils/markdown_vdom';

/**
  Preview component for the Markdown widget.

  Will convert the widget value from markdown to HTML.

  Converts the markdown into a virtual dom to rewriting the whole HTML DOM for
  the preview element every time the value changes.

  @class MarkdownPreview
  @extends Ember.Component
*/
export default Ember.Component.extend({
  init: function() {
    console.log("Init markdown preview");
    this._super.apply(this, arguments);
  },
  /*
    Wrap the preview in a div
  */
  tagName: "div",

  /*
    Setup the VDOM element with a VDOM representation of the markdown when the
    component element is inserted into the DOM.
  */
  didInsertElement: function() {
    console.log("Inserted markdown preview");
    this.md = new MarkdownVDOM(this.get("media"));
    var vdom = this.md.markdownToVDOM(this.get("widget.value"));
    var rootNode = createElement(vdom);
    this.element.appendChild(rootNode);
    this.set("vdom", vdom);
    this.set("root", rootNode);
  },

  /*
    Create a new VDOM from the markdown and patch the current VDOM with a diff
    whenever the widget value changes.
  */
  updateVDOM: function() {
    if (!this.md) { return; }
    var vdom = this.get("vdom");
    var newTree = this.md.markdownToVDOM(this.get("widget.value"));
    var patches = diff(vdom, newTree);
    var rootNode = patch(this.get("root"), patches);
    this.set("root", rootNode);
    this.set("vdom", newTree);
  }.observes("widget.value"),
});
