import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Map } from 'immutable';
import { loadConfig } from '../../actions/config';
import { resolveWidget } from '../Widgets';
import controlStyles from '../ControlPanel/ControlPane.css';

class DynamicControl extends Component {
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
  };

  constructor(props) {
    super(props);
    const fieldValue = this.props.value && Map.isMap(this.props.value) ?
      this.props.value.get(this.props.field.get('name')) :
      this.props.value;
    if (!fieldValue) {
      this.state = {
        widget: null,
      };
    } else {
      this.state = {
        widget: resolveWidget(fieldValue),
      };
    }
  }

  handleChange = (e) => {
    this.props.onChange(Map().set(e.target.id, e.target.value));

    if (!e.target.value) {
      this.setState({
        widget: null,
      });
    } else {
      this.setState({
        widget: resolveWidget(e.target.value),
      });
    }
  };

  render() {
    const { field, value, forID, onChange, onAddAsset, onRemoveAsset, getAsset, config } = this.props;
    const { widget, collections } = this.state;
    const fieldValue = value && Map.isMap(value) ?
      value.get(field.get('name')) :
      value;
    const fieldValueSelected = value && Map.isMap(value) ?
      value.get(field.get('name') + '_selected') :
      value;

    const blocks = config.get('dynamic_widgets');

    let options = blocks.map((option) => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }
      return option;
    });

    options = options.insert(0, {
      label: 'Please Select',
      value: '',
    });

    return (
      <div>
        <div>
          <select id={forID} value={fieldValue || ''} onChange={this.handleChange}>
            {options.map((option, idx) => <option key={idx} value={option.value}>
              {option.label}
            </option>)}
          </select>
        </div>
        <div>
          {
            widget ?
              <div className={controlStyles.widget} key={field.get('name') + '_selected'}>
                <div className={controlStyles.control} key={field.get('name') + '_selected'}>
                  <label className={controlStyles.label} htmlFor={field.get('name') + '_selected'}>{field.get('label') + ' Data'}</label>
                  {
                    React.createElement(widget.control, {
                      id: field.get('name') + '_selected',
                      field,
                      value: fieldValueSelected,
                      onChange: (val, metadata) => {
                        onChange((value || Map()).set(field.get('name') + '_selected', val), metadata);
                      },
                      onAddAsset,
                      onRemoveAsset,
                      getAsset,
                      forID: field.get('name') + '_selected',
                    })
                  }
                </div>
              </div>
            :
              ''
          }
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    config: state.config,
  }),
  { loadConfig }
)(DynamicControl);
