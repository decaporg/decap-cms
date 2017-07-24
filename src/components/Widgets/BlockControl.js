import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import registry from '../../lib/registry';
import { resolveWidget } from '../Widgets';
import { Map } from 'immutable';

export default class BlockControl extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      widget: null
    };
  }

  handleChange = (e) => {
    this.props.onChange(e.target.value);
    let widget = resolveWidget(e.target.value || 'string');

    this.setState({
      'widget': widget
    });
  };

  render() {
    const { field, value, forID } = this.props;
    const { widget } = this.state;
    const fieldValue = value && Map.isMap(value) ? value.get(field.get('name')) : value;

    const fieldOptions = [
      '',
      'string',
      'text',
    ];

    const options = fieldOptions.map((option) => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }
      return option;
    });

    return (
      <div>
          <div>
            <select id={forID} value={value || ''} onChange={this.handleChange}>
              {options.map((option, idx) => <option key={idx} value={option.value}>
                {option.label}
              </option>)}
            </select>
          </div>
          <div>
          {
            widget ?
              React.createElement(widget.control, {
                id: field.get('name'),
                field,
                value: fieldValue,
                onChange: (val, metadata) => {
                  onChange((value || Map()).set(field.get('name'), val), metadata);
                },
                // onAddAsset,
                // onRemoveAsset,
                // getAsset,
                // forID: field.get('name'),
              })
            :
              ''
          }
          </div>
      </div>
    );
  }
}

BlockControl.propTypes = {
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
