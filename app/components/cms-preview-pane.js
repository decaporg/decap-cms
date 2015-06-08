import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'div',
  classNames: ['cms', 'cms-preview-pane'],

  scrollTo: function(mutation) {
    var target = mutation.target;
    while ((target && target.parentNode) && !target.scrollIntoView) {
      target = target.parentNode;
    }
    target && target.scrollIntoView({smooth: true});
  },

  didInsertElement: function() {
    this.observer = new MutationObserver((mutations) => {
      Ember.run.debounce(this, () => { this.scrollTo(mutations[0]); }, 200);
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
