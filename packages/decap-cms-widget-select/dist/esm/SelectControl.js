"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _find2 = _interopRequireDefault(require("lodash/find"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _immutable = require("immutable");
var _reactSelect = _interopRequireDefault(require("react-select"));
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _decapCmsLibWidgets = require("decap-cms-lib-widgets");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function optionToString(option) {
  return option && option.value ? option.value : null;
}
function convertToOption(raw) {
  if (typeof raw === 'string') {
    return {
      label: raw,
      value: raw
    };
  }
  return _immutable.Map.isMap(raw) ? raw.toJS() : raw;
}
function getSelectedValue({
  value,
  options,
  isMultiple
}) {
  if (isMultiple) {
    const selectedOptions = _immutable.List.isList(value) ? value.toJS() : value;
    if (!selectedOptions || !Array.isArray(selectedOptions)) {
      return null;
    }
    return selectedOptions.map(i => options.find(o => o.value === (i.value || i))).filter(Boolean).map(convertToOption);
  } else {
    return (0, _find2.default)(options, ['value', value]) || null;
  }
}
class SelectControl extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "isValid", () => {
      const {
        field,
        value,
        t
      } = this.props;
      const min = field.get('min');
      const max = field.get('max');
      if (!field.get('multiple')) {
        return {
          error: false
        };
      }
      const error = _decapCmsLibWidgets.validations.validateMinMax(t, field.get('label', field.get('name')), value, min, max);
      return error ? {
        error
      } : {
        error: false
      };
    });
    _defineProperty(this, "handleChange", selectedOption => {
      const {
        onChange,
        field
      } = this.props;
      const isMultiple = field.get('multiple', false);
      const isEmpty = isMultiple ? !(selectedOption !== null && selectedOption !== void 0 && selectedOption.length) : !selectedOption;
      if (field.get('required') && isEmpty && isMultiple) {
        onChange((0, _immutable.List)());
      } else if (isEmpty) {
        onChange(null);
      } else if (isMultiple) {
        const options = selectedOption.map(optionToString);
        onChange((0, _immutable.fromJS)(options));
      } else {
        onChange(optionToString(selectedOption));
      }
    });
  }
  componentDidMount() {
    const {
      field,
      onChange,
      value
    } = this.props;
    if (field.get('required') && field.get('multiple')) {
      if (value && !_immutable.List.isList(value)) {
        onChange((0, _immutable.fromJS)([value]));
      } else if (!value) {
        onChange((0, _immutable.fromJS)([]));
      }
    }
  }
  render() {
    const {
      field,
      value,
      forID,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle
    } = this.props;
    const fieldOptions = field.get('options');
    const isMultiple = field.get('multiple', false);
    const isClearable = !field.get('required', true) || isMultiple;
    const options = [...fieldOptions.map(convertToOption)];
    const selectedValue = getSelectedValue({
      options,
      value,
      isMultiple
    });
    return (0, _core.jsx)(_reactSelect.default, {
      inputId: forID,
      value: selectedValue,
      onChange: this.handleChange,
      className: classNameWrapper,
      onFocus: setActiveStyle,
      onBlur: setInactiveStyle,
      options: options,
      styles: _decapCmsUiDefault.reactSelectStyles,
      isMulti: isMultiple,
      isClearable: isClearable,
      placeholder: ""
    });
  }
}
exports.default = SelectControl;
_defineProperty(SelectControl, "propTypes", {
  onChange: _propTypes.default.func.isRequired,
  value: _propTypes.default.node,
  forID: _propTypes.default.string.isRequired,
  classNameWrapper: _propTypes.default.string.isRequired,
  setActiveStyle: _propTypes.default.func.isRequired,
  setInactiveStyle: _propTypes.default.func.isRequired,
  field: _reactImmutableProptypes.default.contains({
    options: _reactImmutableProptypes.default.listOf(_propTypes.default.oneOfType([_propTypes.default.string, _reactImmutableProptypes.default.contains({
      label: _propTypes.default.string.isRequired,
      value: _propTypes.default.string.isRequired
    })])).isRequired
  })
});