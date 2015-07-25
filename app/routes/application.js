import Route from './cms';

export default Route.extend({
  actions: {
    showSidebar: function() {
      this.set("controller.showSidebar", true);
    },
    hideSidebar: function() {
      this.set("controller.showSidebar", false);
    },
    toggleSidebar: function() {
      this.set("controller.showSidebar", !this.get("controller.showSidebar"));
    }
  }
});
