import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'div',
  classNames: ['cms', 'cms-preview-pane'],
  lastMutationEl: null,

  scrollTo: function(mutation) {
    var target;
    switch(mutation.type) {
      case "childList":
        target = mutation.addedNodes[0];
        break;
      default:
        target = mutation.target;
        break;
    }
    while ((target && target.parentNode) && !target.offsetTop) {
      target = target.parentNode;
    }
    if (target) {
      this.$().animate({scrollTop: target.offsetTop - 100});
    }
  },

  didInsertElement: function() {
    this.observer = new MutationObserver((mutations) => {
      Ember.run.debounce(this, () => { this.scrollTo(mutations[0]); }, 50);
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
})
