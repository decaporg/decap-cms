import PropTypes from 'prop-types';
import React from 'react';
import DateTime from 'react-datetime';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map } from 'immutable';

export default class DateTimeControl extends React.Component {
  handleChange = (datetime) => {
    this.props.onChange(datetime);
  };

  getValue(value) {
    if (value === false || value === '') {
      return '';
    } else if(!value) {
      return new Date();
    } else {
      return value;
    }
  }

  componentWillReceiveProps(props) {
    this.handleChange(this.getValue(props.value));
  }

  componentDidMount() {
    this.handleChange(this.getValue(this.props.value));
  }

  render() {
    const fieldProps = this.props.field.get('options', Map()).toJS();
    return (<DateTime
      {...fieldProps}
      value={this.getValue(this.props.value)}
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
  options: ImmutablePropTypes.mapContains({
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
