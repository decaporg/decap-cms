"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = withMapControl;
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _core = require("@emotion/core");
var _ol = _interopRequireDefault(require("ol/ol.css"));
var _Map = _interopRequireDefault(require("ol/Map.js"));
var _View = _interopRequireDefault(require("ol/View.js"));
var _GeoJSON = _interopRequireDefault(require("ol/format/GeoJSON"));
var _Draw = _interopRequireDefault(require("ol/interaction/Draw.js"));
var _Tile = _interopRequireDefault(require("ol/layer/Tile.js"));
var _Vector = _interopRequireDefault(require("ol/layer/Vector.js"));
var _OSM = _interopRequireDefault(require("ol/source/OSM.js"));
var _Vector2 = _interopRequireDefault(require("ol/source/Vector.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const formatOptions = {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857'
};
function getDefaultFormat() {
  return new _GeoJSON.default(formatOptions);
}
function getDefaultMap(target, featuresLayer) {
  return new _Map.default({
    target,
    layers: [new _Tile.default({
      source: new _OSM.default()
    }), featuresLayer],
    view: new _View.default({
      center: [0, 0],
      zoom: 2
    })
  });
}
function withMapControl({
  getFormat,
  getMap
} = {}) {
  var _class;
  return _class = class MapControl extends _react.default.Component {
    constructor(props) {
      super(props);
      this.mapContainer = /*#__PURE__*/_react.default.createRef();
    }
    componentDidMount() {
      const {
        field,
        onChange,
        value
      } = this.props;
      const format = getFormat ? getFormat(field) : getDefaultFormat(field);
      const features = value ? [format.readFeature(value)] : [];
      const featuresSource = new _Vector2.default({
        features,
        wrapX: false
      });
      const featuresLayer = new _Vector.default({
        source: featuresSource
      });
      const target = this.mapContainer.current;
      const map = getMap ? getMap(target, featuresLayer) : getDefaultMap(target, featuresLayer);
      if (features.length > 0) {
        map.getView().fit(featuresSource.getExtent(), {
          maxZoom: 16,
          padding: [80, 80, 80, 80]
        });
      }
      const draw = new _Draw.default({
        source: featuresSource,
        type: field.get('type', 'Point')
      });
      map.addInteraction(draw);
      const writeOptions = {
        decimals: field.get('decimals', 7)
      };
      draw.on('drawend', ({
        feature
      }) => {
        featuresSource.clear();
        onChange(format.writeGeometry(feature.getGeometry(), writeOptions));
      });
    }
    render() {
      const {
        height
      } = this.props;
      return (0, _core.jsx)(_core.ClassNames, null, ({
        cx,
        css
      }) => (0, _core.jsx)("div", {
        className: cx(this.props.classNameWrapper, css`
                  ${_ol.default};
                  padding: 0;
                  overflow: hidden;
                  height: ${height};
                `),
        ref: this.mapContainer
      }));
    }
  }, _defineProperty(_class, "propTypes", {
    onChange: _propTypes.default.func.isRequired,
    field: _propTypes.default.object.isRequired,
    height: _propTypes.default.string,
    value: _propTypes.default.node
  }), _defineProperty(_class, "defaultProps", {
    value: '',
    height: '400px'
  }), _class;
}