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
    config: PropTypes.object
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
    const { widget } = this.state;

    const name = field.get('name');
    const selectedName = `${ field.get('name') }_selected`;

    const fieldValue = value && Map.isMap(value) ?
      value.get(name) :
      value;
    const fieldValueSelected = value && Map.isMap(value) ?
      value.get(selectedName) :
      value;

    let options = config.get('dynamic_widgets').map((option) => {
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
              <div className={controlStyles.widget} key={selectedName}>
                <div className={controlStyles.control} key={selectedName}>
                  <label className={controlStyles.label} htmlFor={selectedName}>{`${ field.get('label') } Data`}</label>
                  {
                    React.createElement(widget.control, {
                      id: selectedName,
                      field,
                      value: fieldValueSelected,
                      onChange: (val, metadata) => {
                        onChange((value || Map()).set(selectedName, val), metadata);
                      },
                      onAddAsset,
                      onRemoveAsset,
                      getAsset,
                      forID: selectedName,
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
