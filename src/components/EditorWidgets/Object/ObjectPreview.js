import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { List } from 'immutable';
import { resolveWidget } from 'Lib/registry';

class PreviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: `inline-block`, verticalAlign: `text-top` }}>
          {this.props.value ? this.props.value.toString() : ''}
        </div>
      );
    }
    return <div style={{ display: `inline-block`, verticalAlign: `text-top` }}>{this.props.children}</div>;
  }
}

PreviewErrorBoundary.propTypes = {
  value: PropTypes.any,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

const renderObject = (field, value, result, getAsset, index = 0) => {
  const fields = value.get('fields').toArray();
  const resultToJS = result.toJS();
  if (resultToJS) {
    const values = List(
      fields.map((childField) => {
        const key = childField.get('name');
        let renderedField = childField.merge({ [key]: result.get(key) || '' });
        if (key === 'name') {
          renderedField = renderedField.merge({ ___name: result.get(key) });
        }
        return renderedField || null;
      })
    );
    return (
      <ObjectPreview key={`${ field.get('name') }-${ index }`} field={field} value={values} getAsset={getAsset} nested />
    );
  }
  return null;
};

const renderValue = (field, value, getAsset) => {
  const widget = value.get('widget');
  let result = value.get('___name') || value.get(value.get('name'));
  const PreviewComponent = resolveWidget(widget).preview;
  let valuePreview;
  switch (widget) {
    case 'boolean':
      result = result || 'false';
      break;
    case 'date':
      result = Object(result);
      break;
    case 'datetime':
      result = new Date(result);
      break;
    case 'list':
      if (result && result.size) {
        valuePreview = (
          <div className="list">{result.map((r, idx) => renderObject(field, value, r, getAsset, idx))}</div>
        );
      }
      break;
    case 'object':
      valuePreview = renderObject(field, value, result, getAsset);
      break;
    default:
      valuePreview = PreviewComponent ? (
        <PreviewErrorBoundary value={result}>
          <PreviewComponent value={result} getAsset={getAsset} />
        </PreviewErrorBoundary>
      ) : (
        result
      );
      break;
  }
  if (valuePreview) {
    return valuePreview;
  }
  return result ? result.toString() : null;
};

const ObjectPreview = ({ field, value, getAsset, nested }) => (
  <div className="nc-widgetPreview">
    {(field && field.get('fields')) ||
      (value && (
        <div className="nc-widgetPreview" style={{ marginBottom: 20, marginTop: nested ? 5 : 0 }}>
          {!nested && <h3 style={{ marginTop: 0, marginBottom: 10 }}>Modular Content -- {field.get('label')}</h3>}
          {!nested && <hr />}
          {value &&
            value.size &&
            value.map((val, index) => (
              <div
                key={`${ val.get('name') }-${ index }`}
                className="nc-widgetPreview"
                style={{
                  marginBottom: nested ? 2 : 5,
                  marginLeft: nested ? 10 : 0,
                }}
              >
                <h4
                  style={{
                    display: `inline-block`,
                    margin: 0,
                    marginRight: 5,
                  }}
                >
                  {val.get('label')}:
                </h4>
                {renderValue(field, val, getAsset)}
              </div>
            ))}
          {!nested && <hr />}
        </div>
      ))}
  </div>
);

ObjectPreview.propTypes = {
  field: PropTypes.any,
  value: PropTypes.map,
  getAsset: PropTypes.func,
  nested: PropTypes.bool,
};

export default ObjectPreview;
