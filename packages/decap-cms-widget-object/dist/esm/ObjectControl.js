"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _core = require("@emotion/core");
var _immutable = require("immutable");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _decapCmsLibWidgets = require("decap-cms-lib-widgets");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const styleStrings = {
  nestedObjectControl: `
    padding: 6px 14px 14px;
    border-top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  `,
  objectWidgetTopBarContainer: `
    padding: ${_decapCmsUiDefault.lengths.objectWidgetTopBarContainerPadding};
  `,
  collapsedObjectControl: `
    display: none;
  `
};
class ObjectControl extends _react.default.Component {
  constructor(props) {
    super(props);
    _defineProperty(this, "componentValidate", {});
    _defineProperty(this, "validate", () => {
      const {
        field
      } = this.props;
      let fields = field.get('field') || field.get('fields');
      fields = _immutable.List.isList(fields) ? fields : (0, _immutable.List)([fields]);
      fields.forEach(field => {
        if (field.get('widget') === 'hidden') return;
        this.componentValidate[field.get('name')]();
      });
    });
    _defineProperty(this, "handleCollapseToggle", () => {
      this.setState({
        collapsed: !this.state.collapsed
      });
    });
    _defineProperty(this, "renderFields", (multiFields, singleField) => {
      if (multiFields) {
        return multiFields.map((f, idx) => this.controlFor(f, idx));
      }
      return this.controlFor(singleField);
    });
    _defineProperty(this, "objectLabel", () => {
      const {
        value,
        field
      } = this.props;
      const label = field.get('label', field.get('name'));
      const summary = field.get('summary');
      return summary ? _decapCmsLibWidgets.stringTemplate.compileStringTemplate(summary, null, '', value) : label;
    });
    this.state = {
      collapsed: props.field.get('collapsed', false)
    };
  }

  /*
   * Always update so that each nested widget has the option to update. This is
   * required because ControlHOC provides a default `shouldComponentUpdate`
   * which only updates if the value changes, but every widget must be allowed
   * to override this.
   */
  shouldComponentUpdate() {
    return true;
  }
  controlFor(field, key) {
    const {
      value,
      onChangeObject,
      onValidateObject,
      clearFieldErrors,
      metadata,
      fieldsErrors,
      editorControl: EditorControl,
      controlRef,
      parentIds,
      isFieldDuplicate,
      isFieldHidden,
      locale
    } = this.props;
    if (field.get('widget') === 'hidden') {
      return null;
    }
    const fieldName = field.get('name');
    const fieldValue = value && _immutable.Map.isMap(value) ? value.get(fieldName) : value;
    const isDuplicate = isFieldDuplicate && isFieldDuplicate(field);
    const isHidden = isFieldHidden && isFieldHidden(field);
    return (0, _core.jsx)(EditorControl, {
      key: key,
      field: field,
      value: fieldValue,
      onChange: onChangeObject,
      clearFieldErrors: clearFieldErrors,
      fieldsMetaData: metadata,
      fieldsErrors: fieldsErrors,
      onValidate: onValidateObject,
      processControlRef: controlRef && controlRef.bind(this),
      controlRef: controlRef,
      parentIds: parentIds,
      isDisabled: isDuplicate,
      isHidden: isHidden,
      isFieldDuplicate: isFieldDuplicate,
      isFieldHidden: isFieldHidden,
      locale: locale
    });
  }
  render() {
    const {
      field,
      forID,
      classNameWrapper,
      forList,
      hasError,
      t
    } = this.props;
    const collapsed = forList ? this.props.collapsed : this.state.collapsed;
    const multiFields = field.get('fields');
    const singleField = field.get('field');
    if (multiFields || singleField) {
      return (0, _core.jsx)(_core.ClassNames, null, ({
        css,
        cx
      }) => (0, _core.jsx)("div", {
        id: forID,
        className: cx(classNameWrapper, css`
                  ${styleStrings.objectWidgetTopBarContainer}
                `, {
          [css`
                    ${styleStrings.nestedObjectControl}
                  `]: forList
        }, {
          [css`
                    border-color: ${_decapCmsUiDefault.colors.textFieldBorder};
                  `]: forList ? !hasError : false
        })
      }, forList ? null : (0, _core.jsx)(_decapCmsUiDefault.ObjectWidgetTopBar, {
        collapsed: collapsed,
        onCollapseToggle: this.handleCollapseToggle,
        heading: collapsed && this.objectLabel(),
        t: t
      }), (0, _core.jsx)("div", {
        className: cx({
          [css`
                    ${styleStrings.collapsedObjectControl}
                  `]: collapsed
        })
      }, this.renderFields(multiFields, singleField))));
    }
    return (0, _core.jsx)("h3", null, "No field(s) defined for this widget");
  }
}
exports.default = ObjectControl;
_defineProperty(ObjectControl, "propTypes", {
  onChangeObject: _propTypes.default.func.isRequired,
  onValidateObject: _propTypes.default.func,
  value: _propTypes.default.oneOfType([_propTypes.default.node, _propTypes.default.object, _propTypes.default.bool]),
  field: _propTypes.default.object,
  forID: _propTypes.default.string,
  classNameWrapper: _propTypes.default.string.isRequired,
  forList: _propTypes.default.bool,
  controlRef: _propTypes.default.func,
  editorControl: _propTypes.default.elementType.isRequired,
  resolveWidget: _propTypes.default.func.isRequired,
  clearFieldErrors: _propTypes.default.func.isRequired,
  fieldsErrors: _reactImmutableProptypes.default.map,
  hasError: _propTypes.default.bool,
  t: _propTypes.default.func,
  locale: _propTypes.default.string
});
_defineProperty(ObjectControl, "defaultProps", {
  value: (0, _immutable.Map)()
});