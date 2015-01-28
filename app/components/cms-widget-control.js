import Resolver from './cms-widget-resolver';

export default Resolver.extend({
  customName: function() {
    return this.widget.get("type") + "-control";
  },
  defaultName: function() {
    return "widgets/" + this.widget.get("type") + "-control";
  },
  noName: function() {
    return "widgets/not-found-control";
  }
});
