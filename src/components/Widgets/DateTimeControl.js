import PropTypes from 'prop-types';
import React from 'react';
import DateTime from 'react-datetime';
import ImmutablePropTypes from 'react-immutable-proptypes';

export default class DateTimeControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: this.getStateValue(this.props.value) };
  }

  handleChange = (datetime) => {
    this.props.onChange(datetime);
  };

  getStateValue(value) {
    if (value === false || value === '') {
      return '';
    } else if(!value) {
      return new Date();
    } else {
      return value;
    }
  }

  componentWillReceiveProps(props) {
    const { value: newValue } = props;
    if(newValue !== this.props.value) {
      this.setState({ value: this.getStateValue(newValue) }, () => {
        this.handleChange(this.state.value);
      });
    }
  }

  componentDidMount() {
    this.handleChange(this.state.value);
  }

  render() {
    const _fieldProps = this.props.field.get('field');
    const fieldProps = _fieldProps && _fieldProps.toJSON ? _fieldProps.toJSON() : _fieldProps
    const { value } = this.state;
    return (<DateTime
      {...fieldProps}
      value={value}
      onChange={this.handleChange}
    />);
  }
}

DateTimeControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.bool,
  ]),
  field: ImmutablePropTypes.mapContains({
    dateFormat: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.bool,
    ]),
    timeFormat: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.bool,
    ]),
  })
};
