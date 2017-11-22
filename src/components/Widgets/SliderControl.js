import React, { Component, PropTypes } from 'react';
import { Map, List } from 'immutable';
import { resolveWidget } from '../Widgets';
import controlStyles from '../ControlPanel/ControlPane.css';
import styles from './ObjectControl.css';

export default class SliderControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.object,
      PropTypes.bool,
    ]),
    field: PropTypes.object,
    forID: PropTypes.string,
    className: PropTypes.string,
  };

  controlFor(field) {
    const { onAddAsset, onRemoveAsset, getAsset, value, onChange } = this.props;
    if (field.get('widget') === 'hidden') {
      return null;
    }
    const widget = resolveWidget(field.get('widget') || 'string');
    const fieldValue = value && Map.isMap(value) ? value.get(field.get('name')) : value;

    return (<div className={controlStyles.widget} key={field.get('name')}>
      <div className={controlStyles.control} key={field.get('name')}>
        <label className={controlStyles.label} htmlFor={field.get('name')}>{field.get('label')}</label>
        {
          React.createElement(widget.control, {
            id: field.get('name'),
            field,
            value: fieldValue,
            onChange: (val, metadata) => {
              onChange((value || Map()).set(field.get('name'), val), metadata);
            },
            onAddAsset,
            onRemoveAsset,
            getAsset,
            forID: field.get('name'),
          })
        }
      </div>
    </div>);
  }

  render() {
    const { field, forID } = this.props;
    const className = this.props.className || '';

    const sliderFields = List([
      Map({ label: "String", name: "string", widget: "string" }),
      Map({ label: "String2", name: "string2", widget: "string" }),
    ]);

    return (<div id={forID} className={`${ className } ${ styles.root }`}>
      {sliderFields.map(f => this.controlFor(f))}
    </div>);
  }
}
