import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'div',
  classNames: ['cms', 'cms-preview-pane'],
  hasScrolled: false,

  previewTemplate: function() {
    var customName = `cms/preview/${this.get("collection.name")}`;
    var name = Ember.TEMPLATES[customName] ? customName : 'preview/default';
    return name;
  }.property("entry"),

  scrollTo: function() {
    if (!this.get("hasScrolled")) {
      this.set("hasScrolled", true);
      return;
    }
    var mutations = this.get("_mutations");
    var mutation = mutations[0];
    var target;

    switch(mutation.type) {
      case "childList":
        target = mutation.addedNodes[0];
        break;
      case "characterData":
        target = mutation.target.parentElement;
        break;
      default:
        target = mutation.target;
        break;
    }
    while ((target && target.parentNode) && !('offsetTop' in target)) {
      target = target.parentNode;
    }
    if (target && ('offsetTop' in target)) {
      this.$().scrollTo(target, 200);
    }
  },

  didInsertElement: function() {
    this.observer = new MutationObserver((mutations) => {
      this.set("_mutations", mutations);
      Ember.run.debounce(this, this.scrollTo, 50);
    });
    var config = { attributes: true, childList: true, characterData: true, subtree: true};
    this.observer.observe(this.$()[0], config);
  },

  willDestroyElement: function() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
});
