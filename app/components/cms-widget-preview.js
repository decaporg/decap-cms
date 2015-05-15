import Resolver from './cms-widget-resolver';

/**
@module app
@submodule widgets
*/

/**
  The preview part of a widget.

  This represents the realtime preview part of a widget and will resolve to a component based
  on the type of the widget or the `preview` attribute of the widget.

  If `preview` is set for the widget, the component will resolve to a component of that name if any exist.

  If the widget is of type `foo`, the resolver will first look for a `foo-preview` component.
  If none is found, it'll look for a `widgets/foo-preview` (the namespace of the built-in
  widgets). If there's no build in widget either, it'll show the "widgets/string-preview"
  component that simply outputs the value of the widget.

  @class CmsWidgetPreview
  @extends Resolver
*/
export default Resolver.extend({
  init: function() {
    this._super();
    this.set("tagName", this.get("widget.field.tagname") || "div");
    this.set("classNames", (this.get("widget.field.class") || "").split(" "));
  },
  name: function() {
    return `${this.get("widget.field.preview") || this.get("widget.type")}-preview`;
  },
  noName: function() {
    return "string-preview";
  }
});
