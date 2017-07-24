import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import registry from '../../lib/registry';
import { resolveWidget } from '../Widgets';

export default class BlockControl extends React.Component {
  handleChange = (e) => {
    this.props.onChange(e.target.value);
    const widget = resolveWidget(e.target.value || 'string');
    console.log(widget);
  };

  render() {
    const { field, value, forID } = this.props;
    const fieldOptions = [
      '',
      'string',
      'text',
      'select'
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

          </div>
      </div>
    );
  }
}

BlockControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
};
