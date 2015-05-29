import Route from './cms';

export default Route.extend({
  actions: {
    toggleSidebar: function() {
      console.log("Toggle");
      this.set("controller.showSidebar", !this.get("controller.showSidebar"))
    }
  }
});
