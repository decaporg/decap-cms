import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

import React from 'react';
import CSSTransition from 'react-transition-group/CSSTransition';
import c from 'classnames';

export var Loader = function (_React$Component) {
  _inherits(Loader, _React$Component);

  function Loader() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, Loader);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Loader.__proto__ || _Object$getPrototypeOf(Loader)).call.apply(_ref, [this].concat(args))), _this), _this.state = {
      currentItem: 0
    }, _this.setAnimation = function () {
      if (_this.interval) return;
      var children = _this.props.children;


      _this.interval = setInterval(function () {
        var nextItem = _this.state.currentItem === children.length - 1 ? 0 : _this.state.currentItem + 1;
        _this.setState({ currentItem: nextItem });
      }, 5000);
    }, _this.renderChild = function () {
      var children = _this.props.children;
      var currentItem = _this.state.currentItem;

      if (!children) {
        return null;
      } else if (typeof children == 'string') {
        return React.createElement(
          'div',
          { className: 'nc-loader-text' },
          children
        );
      } else if (Array.isArray(children)) {
        _this.setAnimation();
        return React.createElement(
          'div',
          { className: 'nc-loader-text' },
          React.createElement(
            CSSTransition,
            {
              classNames: {
                enter: 'nc-loader-enter',
                enterActive: 'nc-loader-enterActive',
                exit: 'nc-loader-exit',
                exitActive: 'nc-loader-exitActive'
              },
              timeout: 500
            },
            React.createElement(
              'div',
              { key: currentItem, className: 'nc-loader-animateItem' },
              children[currentItem]
            )
          )
        );
      }
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(Loader, [{
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      if (this.interval) {
        clearInterval(this.interval);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          active = _props.active,
          className = _props.className;

      var combinedClassName = c('nc-loader-root', { 'nc-loader-active': active }, className);
      return React.createElement(
        'div',
        { className: combinedClassName },
        this.renderChild()
      );
    }
  }, {
    key: '__reactstandin__regenerateByEval',
    // @ts-ignore
    value: function __reactstandin__regenerateByEval(key, code) {
      // @ts-ignore
      this[key] = eval(code);
    }
  }]);

  return Loader;
}(React.Component);
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(Loader, 'Loader', 'src/Loader/Loader.js');
  leaveModule(module);
})();

;