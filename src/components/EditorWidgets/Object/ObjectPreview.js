import PropTypes from 'prop-types';
import React from 'react';
import { List } from 'immutable';
import MarkdownPreview from '../Markdown/MarkdownPreview';
import ImagePreview from '../Image/ImagePreview';
import FilePreview from '../File/FilePreview';
import RelationPreview from '../Relation/RelationPreview';

const renderObject = (field, value, result, getAsset) => {
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
    return <ObjectPreview field={field} value={values} getAsset={getAsset} nested />;
  }
  return null;
};

const renderValue = (field, value, getAsset) => {
  const widget = value.get('widget');
  let result = value.get('___name') || value.get(value.get('name'));
  let valuePreview = null;

  switch (widget) {
    case 'boolean':
      result = result || 'false';
      valuePreview = result.toString() || null;
      break;
    case 'date':
      valuePreview = result.toString() || null;
      break;
    case 'datetime':
      result = new Date(result);
      valuePreview = result.toString() || null;
      break;
    case 'relation':
      valuePreview = <RelationPreview value={result} />;
      break;
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
        valuePreview = <div className="list">{result.map(r => renderObject(field, value, r, getAsset))}</div>;
      }
      break;
    case 'object':
      valuePreview = renderObject(field, value, result, getAsset);
      break;
    default:
      valuePreview = result ? result.toString() : null;
      break;
  }

  return valuePreview;
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
                  }}
                >
                  {val.get('label')}:
                </h4>
                {` `}
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
