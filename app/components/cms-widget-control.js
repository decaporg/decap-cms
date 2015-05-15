import Resolver from './cms-widget-resolver';

/**
@module app
@submodule widgets
*/

/**
  The control part of a widget.

  This represents the input part of a widget and will resolve to a component based
  on the type of the widget.

  If the widget is of type `foo`, the resolver will first look for a `foo-control` component.
  If none is found, it'll look for a `widgets/foo-control` (the namespace of the built-in
  widgets). If there's no build in widget either, it'll show the "widgets/not-found-control"
  component with instructions on how to make your own custom control.

  @class CmsWidgetControl
  @extends Resolver
*/
export default Resolver.extend({
  name: function() {
    return this.get("widget.type") + "-control";
  },
  noName: function() {
    return "not-found-control";
  }
});
