import Route from './cms';

export default Route.extend({
  actions: {
    toggleSidebar: function() {
      this.set("controller.showSidebar", !this.get("controller.showSidebar"));
    }
  }
});
