import PropTypes from 'prop-types';
import React from 'react';
import DateTimeControl from './DateTimeControl';
import DateTime from 'react-datetime';

export default class DateControl extends DateTimeControl {
  render() {
    return (<DateTime
      timeFormat={false}
      value={this.props.value}
      onChange={this.handleChange}
    />);
  }
}

DateControl.propTypes = DateTimeControl.propTypes;
