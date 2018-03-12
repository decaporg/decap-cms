import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { List, Map } from 'immutable';
import MarkdownPreview from '../Markdown/MarkdownPreview';
import ImagePreview from '../Image/ImagePreview';
import FilePreview from '../File/FilePreview';

const renderObject = (value, result, getAsset) => {
  const fields = value.get('fields').toArray();
  const resultToJS = result.toJS();
  if (resultToJS) {
    const keys = Object.keys(resultToJS);
    const values = List(
      keys
        .map((key) => {
          const f = fields.filter(field => field.get('name') === key);
          if (f && f.length > 0) {
            let newF = f[0].merge({ [key]: result.get(key) });
            if (key === 'name') {
              newF = newF.merge({ ___name: result.get(key) });
            }
            return newF;
          }
          return null;
        })
        .filter(val => val)
    );
    return <ModularContentPreview value={values} getAsset={getAsset} nested />;
  }
  return null;
};

const renderValue = (value, getAsset) => {
  const widget = value.get('widget');
  const result = value.get('___name') || value.get(value.get('name'));
  let valuePreview = null;

  switch (widget) {
    case 'image':
      valuePreview = <ImagePreview value={result} getAsset={getAsset} />;
      break;
    case 'file':
      valuePreview = <FilePreview value={result} getAsset={getAsset} />;
      break;
    case 'markdown':
      valuePreview = <MarkdownPreview value={result || ''} getAsset={getAsset} />;
      break;
    case 'list':
      if (result && result.size) {
        valuePreview = <div className="list">{result.map(r => renderObject(value, r, getAsset))}</div>;
      }
      break;
    case 'object':
      valuePreview = renderObject(value, result, getAsset);
      break;
    default:
      valuePreview = result ? result.toString() : null;
      break;
  }

  return valuePreview;
};
class ModularContentPreview extends Component {
  render() {
    const { field, value, getAsset, nested } = this.props;
    return (
      value && (
        <div className="nc-widgetPreview" style={{ marginBottom: 20, marginTop: nested ? 5 : 0 }}>
          {!nested && <h3 style={{ marginTop: 0, marginBottom: 10 }}>Modular Content -- {field.get('label')}</h3>}
          {!nested && <hr />}
          {value &&
            value.size &&
            value.map((val, index) => (
              <div
                key={`${ val.get('name') }-${ index }`}
                className="nc-widgetPreview"
                style={{ marginBottom: nested ? 2 : 5 }}
              >
                <h4
                  style={{
                    display: `inline-block`,
                    margin: 0,
                    marginLeft: nested ? 10 : 0,
                  }}
                >
                  {val.get('label')}:
                </h4>
                {` `}
                {renderValue(val, getAsset)}
              </div>
            ))}
          {!nested && <hr />}
        </div>
      )
    );
  }
}

ModularContentPreview.propTypes = {
  field: PropTypes.any,
  value: PropTypes.map,
  getAsset: PropTypes.func,
  nested: PropTypes.bool,
};

export default ModularContentPreview;
